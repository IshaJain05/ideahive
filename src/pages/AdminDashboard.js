import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalFaculty: 0,
    totalProjects: 0,
    totalTasks: 0,
    submittedTasks: 0,
    lateTasks: 0,
    pendingTasks: 0,
    totalInterviews: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const projectsSnap = await getDocs(collection(db, "projects"));
        const tasksSnap = await getDocs(collection(db, "tasks"));
        const interviewsSnap = await getDocs(collection(db, "interviews"));

        const users = usersSnap.docs.map(doc => doc.data());
        const tasks = tasksSnap.docs.map(doc => doc.data());

        const totalUsers = users.length;
        const totalStudents = users.filter(u => u.role === "Student").length;
        const totalFaculty = users.filter(u => u.role === "Faculty").length;

        const totalTasks = tasks.length;
        const submittedTasks = tasks.filter(t => t.status === "Submitted").length;
        const lateTasks = tasks.filter(t => t.status === "Late").length;
        const pendingTasks = tasks.filter(t => t.status === "Pending").length;

        setStats({
          totalUsers,
          totalStudents,
          totalFaculty,
          totalProjects: projectsSnap.size,
          totalTasks,
          submittedTasks,
          lateTasks,
          pendingTasks,
          totalInterviews: interviewsSnap.size,
        });
      } catch (err) {
        console.error("Error fetching admin data:", err);
      }
    };

    fetchData();
  }, []);

  const taskStatusChart = {
    labels: ["Submitted", "Late", "Pending"],
    datasets: [
      {
        data: [stats.submittedTasks, stats.lateTasks, stats.pendingTasks],
        backgroundColor: ["#4caf50", "#ff9800", "#f44336"],
      },
    ],
  };

  const userRoleChart = {
    labels: ["Students", "Faculty"],
    datasets: [
      {
        data: [stats.totalStudents, stats.totalFaculty],
        backgroundColor: ["#2196f3", "#9c27b0"],
      },
    ],
  };

  return (
    <div className="page-container">
      <h1 className="page-title">📊 Admin Dashboard</h1>

      <div className="dashboard-widgets">
        <div className="widget-card"><h4>Total Users</h4><p>{stats.totalUsers}</p></div>
        <div className="widget-card"><h4>Total Students</h4><p>{stats.totalStudents}</p></div>
        <div className="widget-card"><h4>Total Faculty</h4><p>{stats.totalFaculty}</p></div>
        <div className="widget-card"><h4>Total Projects</h4><p>{stats.totalProjects}</p></div>
        <div className="widget-card"><h4>Total Tasks</h4><p>{stats.totalTasks}</p></div>
        <div className="widget-card"><h4>Upcoming Interviews</h4><p>{stats.totalInterviews}</p></div>
      </div>

      <div className="charts-section" style={{ display: "flex", gap: "40px", flexWrap: "wrap", marginTop: "2rem" }}>
        <div style={{ width: "300px" }}>
          <h4>📝 Task Status Breakdown</h4>
          <Pie data={taskStatusChart} />
        </div>

        <div style={{ width: "300px" }}>
          <h4>👥 User Role Distribution</h4>
          <Pie data={userRoleChart} />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
