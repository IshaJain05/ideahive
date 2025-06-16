import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const ScheduledInterview = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInterviewsWithStudentNames = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "interviews"));

        const interviewsWithNames = await Promise.all(
          querySnapshot.docs.map(async (docSnap) => {
            const interview = { id: docSnap.id, ...docSnap.data() };
            const studentDoc = await getDoc(doc(db, "users", interview.studentId));
            const studentName = studentDoc.exists() ? studentDoc.data().name : "Unknown";
            return { ...interview, studentName };
          })
        );

        setInterviews(interviewsWithNames);
      } catch (err) {
        console.error("Error fetching interviews:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInterviewsWithStudentNames();
  }, []);

  if (loading) return <p>Loading interviews...</p>;
  if (error) return <p>Failed to load interviews. Error: {error}</p>;

  return (
    <div className="page-container">
      <h1>Scheduled Interviews</h1>
      {interviews.length === 0 ? (
        <p>No interviews scheduled at the moment.</p>
      ) : (
        <ul>
          {interviews.map((interview) => (
            <li key={interview.id}>
              <p><strong>Student:</strong> {interview.studentName}</p>
              <p><strong>Date & Time:</strong> {interview.timestamp?.toDate().toLocaleString()}</p>
              <p><strong>Meeting Link:</strong> <a href={interview.link} target="_blank" rel="noopener noreferrer">{interview.link}</a></p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ScheduledInterview;
