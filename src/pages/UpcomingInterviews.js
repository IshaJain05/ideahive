import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";
import "../App.css";

const UpcomingInterviews = () => {
  const [interviews, setInterviews] = useState([]);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const fetchInterviews = async () => {
      try {
        const interviewQuery = query(
          collection(db, "interviews"),
          where("studentId", "==", user.uid)
        );
        const snapshot = await getDocs(interviewQuery);
        const today = new Date();

        const upcoming = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((int) => new Date(int.dateTime) >= today)
          .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

        setInterviews(upcoming);
      } catch (err) {
        console.error("Error fetching interviews:", err.message);
      }
    };

    fetchInterviews();
  }, [user]);

  return (
    <div className="page-container">
      <h1 className="page-title">Upcoming Interviews</h1>

      {interviews.length === 0 ? (
        <p className="no-data-text">No upcoming interviews scheduled.</p>
      ) : (
        <div className="interview-grid">
          {interviews.map((interview) => (
            <div key={interview.id} className="interview-card">
              <h3>Interview with Faculty</h3>
              <p><strong>Date & Time:</strong> {new Date(interview.dateTime).toLocaleString()}</p>
              <p><strong>Status:</strong> {interview.status || "Scheduled"}</p>
              <a
                href={interview.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="primary-button"
              >
                Join Meeting
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UpcomingInterviews;
