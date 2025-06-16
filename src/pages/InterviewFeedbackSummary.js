// Faculty side
import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const InterviewFeedbackSummary = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [students, setStudents] = useState({});
  const [projects, setProjects] = useState({});
  const [interviews, setInterviews] = useState({});

  useEffect(() => {
    const fetchFeedbacks = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const q = query(
          collection(db, "interview_feedback"),
          where("facultyId", "==", user.uid)
        );
        const snapshot = await getDocs(q);
        const fbList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setFeedbacks(fbList);

        const studentSnap = await getDocs(collection(db, "users"));
        const projectSnap = await getDocs(collection(db, "projects"));
        const interviewSnap = await getDocs(collection(db, "interviews"));

        const studentMap = {};
        studentSnap.docs.forEach((doc) => (studentMap[doc.id] = doc.data().name));

        const projectMap = {};
        projectSnap.docs.forEach((doc) => (projectMap[doc.id] = doc.data().title));

        const interviewMap = {};
        interviewSnap.docs.forEach((doc) => {
          const data = doc.data();
          interviewMap[doc.id] = data.date
            ? new Date(data.date.seconds * 1000).toLocaleString()
            : "N/A";
        });

        setStudents(studentMap);
        setProjects(projectMap);
        setInterviews(interviewMap);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchFeedbacks();
  }, []);

  const handleDownloadCSV = () => {
    if (feedbacks.length === 0) {
      alert("No feedbacks to export.");
      return;
    }

    const headers = ["Student", "Project", "Interview Date", "Rating", "Comment"];
    const rows = feedbacks.map((fb) => [
      `"${students[fb.studentId] || "Unknown"}"`,
      `"${projects[fb.projectId] || "Unknown"}"`,
      `"${interviews[fb.interviewId] || "Unknown"}"`,
      fb.rating,
      `"${fb.comment.replace(/"/g, "'")}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.setAttribute("download", "interview_feedback_summary.csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="page-container">
      <ToastContainer />
      <h1 className="page-title">📝 Interview Feedback Summary</h1>

      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <button
          onClick={handleDownloadCSV}
          style={{
            padding: "12px 24px",
            fontWeight: "bold",
            fontSize: "1rem",
            backgroundColor: "#1976d2",
            color: "#fff",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
          }}
        >
          ⬇ Download CSV
        </button>
      </div>

      {feedbacks.length === 0 ? (
        <p style={{ textAlign: "center", fontStyle: "italic" }}>No feedbacks submitted yet.</p>
      ) : (
        <div
          className="feedback-grid"
          style={{
            display: "grid",
            gap: "20px",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))"
          }}
        >
          {feedbacks
            .sort((a, b) => {
              const dateA = new Date(interviews[a.interviewId] || 0);
              const dateB = new Date(interviews[b.interviewId] || 0);
              return dateB - dateA;
            })
            .map((fb) => (
              <div
                key={fb.id}
                className="feedback-card"
                style={{
                  background: "#f9f9f9",
                  padding: "16px",
                  borderRadius: "10px",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.05)"
                }}
              >
                <h3 style={{ color: "#0d47a1", marginBottom: "8px" }}>
                  {students[fb.studentId] || "Unknown Student"}
                </h3>
                <p><strong>Project:</strong> {projects[fb.projectId] || "Unknown Project"}</p>
                <p><strong>Date:</strong> {interviews[fb.interviewId] || "Unknown Date"}</p>
                <p><strong>Rating:</strong> {fb.rating} / 5 ⭐</p>
                <p><strong>Feedback:</strong></p>
                <p style={{ fontStyle: "italic", marginTop: "6px" }}>{fb.comment}</p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default InterviewFeedbackSummary;
