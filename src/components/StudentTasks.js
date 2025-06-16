import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const StudentTasks = ({ userId, onSubmitTask }) => {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDocs(collection(db, "tasks"));
      const data = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(task => task.studentId === userId);
      setTasks(data);
    };

    if (userId) fetch();
  }, [userId]);

  return tasks.map(task => {
    const deadline = task.deadline?.seconds
      ? new Date(task.deadline.seconds * 1000)
      : null;
    const now = new Date();
    // eslint-disable-next-line no-unused-vars
    const isOverdue = deadline && now > deadline;

    return (
      <li key={task.id} style={{
        border: "1px solid #ccc",
        borderRadius: "8px",
        padding: "10px",
        marginBottom: "10px",
        backgroundColor: "#f9f9f9"
      }}>
        <strong>{task.name}</strong><br />
        Deadline:{" "}
        {deadline
          ? deadline.toLocaleString()
          : "No deadline set"}<br />
        Status:{" "}
        <span style={{ color: task.status === "Late" ? "red" : "green" }}>
          {task.status}
        </span>
        <br />
        {task.status === "Pending" && (
          <button
            onClick={() => onSubmitTask(task.id, task.deadline)}
            style={{ marginTop: "5px" }}
          >
            Submit
          </button>
        )}
      </li>
    );
  });
};

export default StudentTasks;
