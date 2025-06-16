import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const TrackProgress = () => {
  const [projects, setProjects] = useState([]);
  const [taskStats, setTaskStats] = useState({});

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) return;

      try {
        const projectQuery = query(collection(db, "projects"), where("facultyId", "==", user.uid));
        const projectSnapshot = await getDocs(projectQuery);
        const projectsData = projectSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setProjects(projectsData);

        const taskSnapshot = await getDocs(collection(db, "tasks"));
        const stats = {};

        projectsData.forEach((project) => {
          const projectTasks = taskSnapshot.docs.filter(
            (doc) => doc.data().projectId === project.id
          );

          const submitted = projectTasks.filter((task) => task.data().status === "Submitted").length;
          const late = projectTasks.filter((task) => task.data().status === "Late").length;
          const pending = projectTasks.filter((task) => task.data().status === "Pending").length;
          const total = projectTasks.length;
          const progress = total > 0 ? Math.round(((submitted + late) / total) * 100) : 0;

          stats[project.id] = {
            submitted,
            late,
            pending,
            total,
            progress,
          };
        });

        setTaskStats(stats);
      } catch (err) {
        console.error("Error fetching project progress:", err);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleDownloadPDF = () => {
    if (projects.length === 0) {
      alert("No projects to export.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Project Progress Summary", 14, 22);

    const tableColumn = ["Project Title", "Total Tasks", "Submitted", "Late", "Pending", "Progress %"];
    const tableRows = projects.map(project => {
      const stat = taskStats[project.id] || {};
      return [
        project.title || "N/A",
        stat.total || 0,
        stat.submitted || 0,
        stat.late || 0,
        stat.pending || 0,
        stat.progress || 0,
      ];
    });

    doc.autoTable({
      startY: 35,
      head: [tableColumn],
      body: tableRows,
      theme: "grid",
    });

    doc.save("project_progress_summary.pdf");
  };

  return (
    <div className="page-container">
      <ToastContainer />
      <h1 className="page-title">📊 Track Project Progress</h1>

      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <button
          onClick={handleDownloadPDF}
          style={{
            padding: "12px 25px",
            fontWeight: "bold",
            borderRadius: "8px",
            backgroundColor: "#1976d2",
            color: "#fff",
            border: "none",
            fontSize: "1rem",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          ⬇ Download Project Report (PDF)
        </button>
      </div>

      {projects.length === 0 ? (
        <p style={{ textAlign: "center", fontStyle: "italic" }}>No projects found.</p>
      ) : (
        <div className="project-progress-grid" style={{ display: "grid", gap: "20px", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          {projects.map((project) => {
            const stat = taskStats[project.id] || {};
            const progress = stat.progress || 0;

            return (
              <div
                key={project.id}
                className="progress-card"
                style={{
                  background: "#ffffff",
                  padding: "20px",
                  borderRadius: "12px",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                  transition: "transform 0.2s",
                }}
              >
                <h3 style={{ marginBottom: "10px", color: "#0d47a1" }}>{project.title}</h3>
                <p style={{ marginBottom: "12px", fontSize: "0.95rem", color: "#333" }}>
                  {project.description || "No description available"}
                </p>

                <p><strong>Total Tasks:</strong> {stat.total}</p>
                <p><strong>Submitted:</strong> {stat.submitted}</p>
                <p><strong>Submitted Late:</strong> {stat.late}</p>
                <p><strong>Pending:</strong> {stat.pending}</p>

                <div style={{ marginTop: "15px" }}>
                  <div
                    style={{
                      height: "20px",
                      background: "#e0e0e0",
                      borderRadius: "10px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${progress}%`,
                        background:
                          progress >= 75 ? "#388e3c" :
                          progress >= 50 ? "#f57c00" :
                          "#d32f2f",
                        transition: "width 0.5s ease",
                      }}
                    ></div>
                  </div>
                  <p style={{ textAlign: "right", fontSize: "0.9rem", marginTop: "5px" }}>
                    {progress}% Completed
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TrackProgress;
