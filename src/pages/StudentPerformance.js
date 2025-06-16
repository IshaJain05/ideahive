import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const StudentPerformance = () => {
  const [students, setStudents] = useState([]);
  
  //const [tasks, setTasks] = useState([]);
  const [performance, setPerformance] = useState({});
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const fetchStudentsAndTasks = async () => {
      try {
        // Fetch all students
        const studentQuery = query(collection(db, "users"), where("role", "==", "Student"));
        const studentSnapshot = await getDocs(studentQuery);
        const studentsData = studentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStudents(studentsData);

        // Fetch all tasks assigned by this faculty
        const taskQuery = query(collection(db, "tasks"), where("assignedBy", "==", user.uid));
        const taskSnapshot = await getDocs(taskQuery);
        const tasksData = taskSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
       // setTasks(tasksData);

        // Calculate performance
        const stats = {};

        studentsData.forEach((student) => {
          const studentTasks = tasksData.filter(task => task.studentId === student.id);
          const submitted = studentTasks.filter(task => task.status === "Submitted").length;
          const late = studentTasks.filter(task => task.status === "Late").length;
          const pending = studentTasks.filter(task => task.status === "Pending").length;
          const total = studentTasks.length;
          const progress = total > 0 ? Math.round(((submitted + late) / total) * 100) : 0;

          stats[student.id] = {
            submitted,
            late,
            pending,
            total,
            progress,
          };
        });

        setPerformance(stats);

      } catch (error) {
        console.error("Error fetching student performance:", error);
      }
    };

    fetchStudentsAndTasks();
  }, [user]);

  const handleDownloadPDF = (student) => {
    const stat = performance[student.id] || {};
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Student Progress Report", 14, 22);

    doc.setFontSize(12);
    doc.text(`Student Name: ${student.name}`, 14, 40);
    doc.text(`Email: ${student.email}`, 14, 48);

    const tableColumn = ["Metric", "Value"];
    const tableRows = [
      ["Total Tasks Assigned", stat.total || 0],
      ["Submitted On Time", stat.submitted || 0],
      ["Submitted Late", stat.late || 0],
      ["Pending", stat.pending || 0],
      ["Progress (%)", stat.progress || 0],
    ];

    doc.autoTable({
      startY: 55,
      head: [tableColumn],
      body: tableRows,
      theme: "grid",
    });

    doc.save(`${student.name}_progress_report.pdf`);
  };

  return (
    <div className="page-container">
      <ToastContainer />
      <h1 className="page-title">🎯 Student Performance Tracking</h1>

      {students.length === 0 ? (
        <p>No students found.</p>
      ) : (
        <div className="student-cards">
          {students.map((student) => {
            const stat = performance[student.id] || {};
            const progress = stat.progress || 0;
            const submitted = stat.submitted || 0;
            const late = stat.late || 0;
            const pending = stat.pending || 0;
            const total = stat.total || 0;

            return (
              <div key={student.id} className="student-card" style={{ marginBottom: "20px", background: "#f9f9f9", padding: "15px", borderRadius: "10px" }}>
                <h3>{student.name}</h3>
                <p><strong>Email:</strong> {student.email}</p>

                <p><strong>Total Tasks Assigned:</strong> {total}</p>
                <p><strong>Submitted On Time:</strong> {submitted}</p>
                <p><strong>Submitted Late:</strong> {late}</p>
                <p><strong>Pending Tasks:</strong> {pending}</p>

                <div className="progress-bar" style={{ background: "#ddd", height: "20px", borderRadius: "10px", overflow: "hidden", marginTop: "10px" }}>
                  <div
                    className="progress-fill"
                    style={{
                      height: "100%",
                      width: `${progress}%`,
                      background: progress >= 75 ? "green" : progress >= 50 ? "orange" : "red",
                      transition: "width 0.5s ease-in-out"
                    }}
                  ></div>
                </div>

                <p style={{ marginTop: "5px" }}>{progress}% Completed</p>

                {/* ✅ Download PDF Button */}
                <button className="primary-button" style={{ marginTop: "10px" }} onClick={() => handleDownloadPDF(student)}>
                  ⬇ Download PDF Report
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentPerformance;
