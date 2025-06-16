import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase";

const Header = () => {
  const navigate = useNavigate();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadTasks, setUnreadTasks] = useState(0);
  const [upcomingInterviews, setUpcomingInterviews] = useState(0);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const chatQuery = query(collection(db, "chats"), where("receiver", "==", user.uid), where("read", "==", false));
    const taskQuery = query(collection(db, "tasks"), where("assignedTo", "==", user.uid), where("status", "==", "New"));
    const interviewQuery = query(collection(db, "interviews"), where("student", "==", user.uid));

    const unsubscribeChat = onSnapshot(chatQuery, (snapshot) => setUnreadMessages(snapshot.docs.length));
    const unsubscribeTasks = onSnapshot(taskQuery, (snapshot) => setUnreadTasks(snapshot.docs.length));
    const unsubscribeInterviews = onSnapshot(interviewQuery, (snapshot) => setUpcomingInterviews(snapshot.docs.length));

    return () => {
      unsubscribeChat();
      unsubscribeTasks();
      unsubscribeInterviews();
    };
  }, [user]);

  return (
    <header style={{
      backgroundColor: "#4f46e5",
      color: "white",
      padding: "0.8rem 2rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
    }}>
      {/* Left: Logo + IdeaHive */}
      <div style={{ display: "flex", alignItems: "center", cursor: "pointer" }} onClick={() => navigate("/")}>
        <img src="/logopes.png" alt="IdeaHive Logo" style={{ height: "40px", marginRight: "10px" }} />
        <h1 style={{ margin: 0, fontSize: "1.5rem" }}>IdeaHive</h1>
      </div>

      {/* Right: Notifications */}
      <div style={{ display: "flex", gap: "20px" }}>
        <button style={notifButtonStyle} onClick={() => navigate("/messages")}>
          🔔 {unreadMessages > 0 && <span style={notifBadgeStyle}>{unreadMessages}</span>}
        </button>
        <button style={notifButtonStyle} onClick={() => navigate("/tasks")}>
          📋 {unreadTasks > 0 && <span style={notifBadgeStyle}>{unreadTasks}</span>}
        </button>
        <button style={notifButtonStyle} onClick={() => navigate("/interviews")}>
          📅 {upcomingInterviews > 0 && <span style={notifBadgeStyle}>{upcomingInterviews}</span>}
        </button>
      </div>
    </header>
  );
};

const notifButtonStyle = {
  position: "relative",
  background: "transparent",
  border: "none",
  color: "white",
  fontSize: "1.5rem",
  cursor: "pointer",
};

const notifBadgeStyle = {
  position: "absolute",
  top: "-5px",
  right: "-8px",
  background: "red",
  color: "white",
  borderRadius: "50%",
  fontSize: "0.7rem",
  width: "18px",
  height: "18px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export default Header;
