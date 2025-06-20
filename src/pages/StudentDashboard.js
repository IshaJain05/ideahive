import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  updateDoc,
  doc
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import InterviewFeedbackView from "../components/InterviewFeedbackView";
import StudentTasks from "../components/StudentTasks";
import StudentProgress from "../components/StudentProgress";
import {
  FaTasks,
  FaProjectDiagram,
  FaComments,
  FaCalendarAlt
} from "react-icons/fa";
import { logActivity } from "../utils/logActivity";

const StudentDashboard = () => {
  const user = auth.currentUser;

  const [userName, setUserName] = useState("User");
  const [greeting, setGreeting] = useState("Hello");
  const [joinedProjects, setJoinedProjects] = useState(0);
  const [upcomingInterviews, setUpcomingInterviews] = useState(0);
  const [assignedTasks, setAssignedTasks] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const submitTask = async (taskId, deadline) => {
    const now = new Date();
    const isLate = now > new Date(deadline?.seconds ? deadline.toDate() : deadline);
    await updateDoc(doc(db, "tasks", taskId), {
      status: isLate ? "Late" : "Submitted",
      submittedAt: now,
    });
    await logActivity("Submitted a task", null, `Task ID: ${taskId} - ${isLate ? "Late" : "On-time"}`);
  };

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening");
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchUser = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) setUserName(snap.data().name || "User");
    };
    fetchUser();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        const projSnap = await getDocs(
          query(collection(db, "projects"), where("members", "array-contains", user.uid))
        );
        setJoinedProjects(projSnap.size);

        const taskSnap = await getDocs(
          query(collection(db, "tasks"), where("studentId", "==", user.uid))
        );
        setAssignedTasks(taskSnap.size);

        const unread = taskSnap.docs.filter(doc => doc.data().status === "Unread");
        setUnreadMessages(unread.length);

        const interviewSnap = await getDocs(
          query(collection(db, "interviews"), where("studentId", "==", user.uid))
        );
        const today = new Date();
        const upcoming = interviewSnap.docs.filter(doc => new Date(doc.data().date) >= today);
        setUpcomingInterviews(upcoming.length);
      } catch (err) {
        console.error("Error fetching dashboard stats:", err.message);
        toast.error("Failed to load dashboard data.");
      }
    };

    fetchStats();
  }, [user]);

  return (
    <main className="main-content">
      <ToastContainer />
      <section className="dashboard-main center-dashboard">
        <div className="dashboard-content">
          <h2 className="dashboard-title">{greeting}, {userName}</h2>

          <div className="dashboard-widgets">
            <div className="widget-card" style={{ borderLeft: "5px solid #007bff" }}>
              <h4><FaProjectDiagram /> Joined Projects</h4>
              <p>{joinedProjects}</p>
            </div>
            <div className="widget-card" style={{ borderLeft: "5px solid #28a745" }}>
              <h4><FaCalendarAlt /> Interviews</h4>
              <p>{upcomingInterviews}</p>
            </div>
            <div className="widget-card" style={{ borderLeft: "5px solid #ffc107" }}>
              <h4><FaComments /> Messages</h4>
              <p>{unreadMessages}</p>
            </div>
            <div className="widget-card" style={{ borderLeft: "5px solid #6f42c1" }}>
              <h4><FaTasks /> Tasks</h4>
              <p>{assignedTasks}</p>
            </div>
          </div>

          <div className="dashboard-lower-grid">
            <div className="dashboard-card">
              <h3>Interview Feedback</h3>
              <InterviewFeedbackView />
            </div>

            <div className="dashboard-card">
              <h3>Your Assigned Tasks</h3>
              {assignedTasks === 0
                ? <p>No tasks assigned yet.</p>
                : <StudentTasks userId={user?.uid} onSubmitTask={submitTask} />}
            </div>

            <div className="dashboard-card">
              <h3>Your Progress Overview</h3>
              <StudentProgress />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default StudentDashboard;
