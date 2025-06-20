import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";

const InterviewFeedbackView = () => {
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, "interview_feedback"),
        where("studentId", "==", user.uid)
      );

      const snapshot = await getDocs(q);
      const feedbackList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFeedbacks(feedbackList);
    };

    fetchFeedbacks();
  }, []);

  return (
    <div style={{ padding: "1rem" }}>
      <h3>Interview Feedback</h3>
      {feedbacks.length === 0 ? (
        <p>No feedback received yet.</p>
      ) : (
        feedbacks.map((f) => (
          <div key={f.id} style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "12px",
            background: "#fdfdfd"
          }}>
            <strong>Project:</strong> {f.projectId}<br />
            <strong>Rating:</strong> {f.rating} / 5<br />
            <strong>Feedback:</strong>
            <div style={{ marginTop: "4px", fontStyle: "italic" }}>{f.comment}</div>
          </div>
        ))
      )}
    </div>
  );
};

export default InterviewFeedbackView;
