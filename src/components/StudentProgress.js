import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";

const StudentProgress = () => {
  const [totalTasks, setTotalTasks] = useState(0);
  const [submittedOnTime, setSubmittedOnTime] = useState(0);
  const [submittedLate, setSubmittedLate] = useState(0);
  const [pendingTasks, setPendingTasks] = useState(0);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const fetchProgress = async () => {
      const q = query(collection(db, "tasks"), where("studentId", "==", user.uid));
      const snapshot = await getDocs(q);
      const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const total = tasks.length;
      const onTime = tasks.filter(t => t.status === "Submitted").length;
      const late = tasks.filter(t => t.status === "Late").length;
      const pending = tasks.filter(t => t.status === "Pending").length;

      setTotalTasks(total);
      setSubmittedOnTime(onTime);
      setSubmittedLate(late);
      setPendingTasks(pending);
    };

    fetchProgress();
  }, [user]);

  const completionRate = totalTasks ? Math.round(((submittedOnTime + submittedLate) / totalTasks) * 100) : 0;

  return (
    <div style={{ marginTop: "2rem", padding: "1rem", background: "#f9f9f9", borderRadius: "10px" }}>
      <h3>📈 Your Progress Overview</h3>
      <p><strong>Total Tasks:</strong> {totalTasks}</p>
      <p><strong>Submitted On Time:</strong> {submittedOnTime}</p>
      <p><strong>Submitted Late:</strong> {submittedLate}</p>
      <p><strong>Pending:</strong> {pendingTasks}</p>

      <div style={{ marginTop: "1rem" }}>
        <p><strong>Completion:</strong> {completionRate}%</p>
        <div style={{
          width: "100%",
          height: "20px",
          backgroundColor: "#e0e0e0",
          borderRadius: "10px",
          overflow: "hidden"
        }}>
          <div style={{
            width: `${completionRate}%`,
            height: "100%",
            backgroundColor: completionRate >= 75 ? "green" : "orange",
            transition: "width 0.5s ease-in-out"
          }}></div>
        </div>
      </div>
    </div>
  );
};

export default StudentProgress;
