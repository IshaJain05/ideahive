import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";
import "../App.css";

const UpcomingInterviews = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) return;

      try {
        const q = query(
          collection(db, "interviews"),
          where("studentId", "==", user.uid)
        );
        const snapshot = await getDocs(q);
        const today = new Date();

        const upcoming = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((int) => {
            const ts = int.timestamp?.seconds
              ? new Date(int.timestamp.seconds * 1000)
              : new Date(int.timestamp);
            return ts >= today;
          })
          .sort((a, b) => {
            const aTime = new Date(a.timestamp?.seconds * 1000);
            const bTime = new Date(b.timestamp?.seconds * 1000);
            return aTime - bTime;
          });

        setInterviews(upcoming);
      } catch (err) {
        console.error("Failed to fetch interviews:", err.message);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="page-container">
      <h1 className="page-title">Upcoming Interviews</h1>

      {loading ? (
        <p>Loading...</p>
      ) : interviews.length === 0 ? (
        <p className="no-data-text">No upcoming interviews scheduled.</p>
      ) : (
        <div className="interview-grid">
          {interviews.map((interview) => {
            const date = new Date(interview.timestamp?.seconds * 1000).toLocaleString();
            return (
              <div
  key={interview.id}
  className="interview-card"
  style={{
    marginBottom: "2rem",
    padding: "1.5rem",
    background: "#ffffff",
    borderRadius: "10px",
    boxShadow: "0 0 10px rgba(0,0,0,0.05)",
    maxWidth: "500px",
    margin: "auto"
  }}
>
  <h3 style={{ marginBottom: "0.5rem" }}>Interview with Faculty</h3>
  <p style={{ marginBottom: "0.25rem" }}>
    <strong>Date & Time:</strong> {date}
  </p>
  <p style={{ marginBottom: "1rem" }}>
    <strong>Status:</strong> {interview.status || "Scheduled"}
  </p>
  <a
    href={interview.link}
    target="_blank"
    rel="noopener noreferrer"
    className="primary-button"
    style={{ display: "inline-block", marginTop: "10px" }}
  >
    Join Meeting
  </a>
</div>

            );
          })}
        </div>
      )}
    </div>
  );
};

export default UpcomingInterviews;
