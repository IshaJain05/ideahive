// src/components/Header.js
import React, { useState, useEffect } from "react";
import { FaBell, FaComments, FaUserCircle, FaSignOutAlt, FaUserEdit } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc // ✅ Import added
} from "firebase/firestore";
import { toast } from "react-toastify";
import "../App.css";


const Header = ({ role }) => {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const isStudent = role === "Student";

  // Fetch unread messages
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      query(collection(db, "chats"), where("receiver", "==", user.uid), where("read", "==", false)),
      (snap) => {
        setUnreadMessages(snap.docs.length);
        if (snap.docs.length) {
          toast.info("New message received", { position: "top-right", autoClose: 3000 });
        }
      }
    );
    return () => unsub();
  }, [user]);

  // Fetch unread notifications
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      query(collection(db, "notifications"), where("to", "==", user.uid), where("read", "==", false), orderBy("timestamp", "desc")),
      (snap) => {
        const notifs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNotifications(notifs);
        setUnreadCount(notifs.length);
      }
    );
    return () => unsub();
  }, [user]);

  const handleLogout = () => navigate("/login");

  const handleNotificationClick = async (notif) => {
    await updateDoc(doc(db, "notifications", notif.id), { read: true });
    navigate(notif.link || "/");
  };

  return (
    <div className="header-bar">
      <div className="header-left" onClick={() => navigate("/")}>
        <img src="/IdeaHiveLogo.png" alt="logo" className="header-logo" />
        <h2>IdeaHive</h2>
      </div>

      <div className="header-right">
        <div className="icon-wrapper" onClick={() => navigate(isStudent ? "/student/chat" : "/faculty/chat")}>
          <FaComments />
          {unreadMessages > 0 && <span className="badge">{unreadMessages}</span>}
        </div>

        <div className="icon-wrapper" onClick={() => setShowNotifications(!showNotifications)}>
          <FaBell />
          {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
        </div>

        <div className="icon-wrapper" onClick={() => setShowDropdown(!showDropdown)}>
          <FaUserCircle />
        </div>

        {showDropdown && (
          <div className="user-dropdown">
            <button className="dropdown-item" onClick={() => navigate(isStudent ? "/student/edit-profile" : "/faculty/edit-profile")}>
              <FaUserEdit /> Edit Profile
            </button>
            <button className="dropdown-item" onClick={handleLogout}>
              <FaSignOutAlt /> Logout
            </button>
          </div>
        )}

        {showNotifications && (
          <div className="notifications-dropdown">
            {notifications.length === 0 ? (
              <p>No new notifications</p>
            ) : (
              notifications.map((notif, i) => (
                <div key={i} className="notification-item" onClick={() => handleNotificationClick(notif)}>
                  {notif.message}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
