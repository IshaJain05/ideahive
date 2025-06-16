import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection, query, where, getDocs, doc, getDoc,
  onSnapshot, orderBy, updateDoc
} from "firebase/firestore";
import { db, auth } from "../firebase";
import Chat from "./Chat";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const FacultyDashboard = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [showMessageDropdown, setShowMessageDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);

  const [facultyName, setFacultyName] = useState("User");
  const [greeting, setGreeting] = useState("Hello");
  const [users, setUsers] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [totalProjects, setTotalProjects] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [upcomingInterviews, setUpcomingInterviews] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);

  const dropdownRef = useRef();

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening");
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchName = async () => {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) setFacultyName(userDoc.data().name);
    };
    fetchName();
  }, [user]);

  useEffect(() => {
    const fetchStudents = async () => {
      const snapshot = await getDocs(query(collection(db, "users"), where("role", "==", "Student")));
      setUsers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchStudents();
  }, []);

  useEffect(() => {
    if (!user) return;
    const chatQuery = query(
      collection(db, "chats"),
      where("receiver", "==", user.uid),
      where("read", "==", false)
    );
    const unsubscribe = onSnapshot(chatQuery, (snapshot) => {
      setUnreadMessages(snapshot.docs.length);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const projectsSnap = await getDocs(query(collection(db, "projects"), where("facultyId", "==", user.uid)));
      setTotalProjects(projectsSnap.size);

      const requestsSnap = await getDocs(query(collection(db, "projectRequests"), where("status", "==", "Pending")));
      const relevantRequests = requestsSnap.docs.filter(doc => doc.data().facultyId === user.uid);
      setPendingRequests(relevantRequests.length);

      const interviewSnap = await getDocs(query(collection(db, "interviews"), where("facultyId", "==", user.uid)));
      const futureInterviews = interviewSnap.docs.filter(doc => doc.data().timestamp?.toDate() > new Date());
      setUpcomingInterviews(futureInterviews.length);

      const tasksSnap = await getDocs(collection(db, "tasks"));
      const assignedTasks = tasksSnap.docs.filter(doc => doc.data().assignedBy === user.uid);
      setTotalTasks(assignedTasks.length);
    };
    fetchStats();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "notifications"),
      where("to", "==", user.uid),
      orderBy("timestamp", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    });
    return () => unsubscribe();
  }, [user]);

  // 🧠 Close all dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowMessageDropdown(false);
        setShowProfileDropdown(false);
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif) => {
    await updateDoc(doc(db, "notifications", notif.id), { read: true });
    if (notif.link) navigate(notif.link);
  };

  const markAllAsRead = async () => {
    for (const notif of notifications.filter(n => !n.read)) {
      await updateDoc(doc(db, "notifications", notif.id), { read: true });
    }
    setUnreadCount(0);
  };

  const toggleDropdown = (type) => {
    setShowMessageDropdown(type === "messages" ? !showMessageDropdown : false);
    setShowProfileDropdown(type === "profile" ? !showProfileDropdown : false);
    setShowNotifications(type === "notifications" ? !showNotifications : false);
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setShowChat(true);
    setShowMessageDropdown(false);
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>IdeaHive</h2>
        <a href="/faculty-dashboard">Dashboard</a>
        <a href="/assign-task">Assign Tasks</a>
        <a href="/track-task">Track Tasks</a>
        <a href="/schedule-interview">Schedule Interviews</a>
        <a href="/my-projects">My Projects</a>
        <a href="/manage-requests">Manage Join Requests</a>
        <a href="/track-progress">Track Project Progress</a>
        <a href="/interview-feedback-summary">Interview Feedback Summary</a>
        <a href="/activity-log">Activity Log</a>
        <a href="/edit-profile">Edit Profile</a>
        <a href="/faculty-tasks">Track Assigned Tasks</a>
      </aside>

      <main className="main-content" ref={dropdownRef}>
        <ToastContainer />
        <header className="dashboard-header">
          <h1 className="idea-hive-title">IdeaHive</h1>
          <div className="header-buttons">
            <div className="messages-container">
              <button className="messages-button" onClick={() => toggleDropdown("messages")}>
                Messages {unreadMessages > 0 && <span className="notification-badge">{unreadMessages}</span>}
              </button>
              {showMessageDropdown && (
                <div className="messages-dropdown">
                  {users.length === 0 ? <p>No Students</p> : users.map(u => (
                    <div key={u.id} className="user-item" onClick={() => handleUserSelect(u)}>
                      {u.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="user-profile">
              <button className="user-profile-circle" onClick={() => toggleDropdown("profile")}>
                {facultyName.charAt(0)}
              </button>
              {showProfileDropdown && (
                <div className="user-dropdown">
                  <button className="dropdown-item" onClick={() => navigate("/edit-profile")}>Edit Profile</button>
                  <button className="dropdown-item" onClick={() => navigate("/login")}>Log Out</button>
                </div>
              )}
            </div>

            <div className="notifications-container">
              <button className="notifications-button" onClick={() => toggleDropdown("notifications")}>
                🔔 Notifications {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </button>
              {showNotifications && (
                <div className="notifications-dropdown">
                  <div className="notifications-header">
                    <strong>Notifications</strong>
                    <button className="secondary-button" onClick={markAllAsRead}>Mark all as read</button>
                  </div>
                  {notifications.length === 0
                    ? <p style={{ padding: "0.5rem" }}>No notifications</p>
                    : notifications.map((notif, index) => (
                        <div key={index} className="notification-item" onClick={() => handleNotificationClick(notif)}>
                          <div>{notif.message}</div>
                          {notif.timestamp?.seconds && (
                            <div className="notification-time">
                              {new Date(notif.timestamp.seconds * 1000).toLocaleString()}
                            </div>
                          )}
                        </div>
                      ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {showChat && selectedUser && (
          <div className="chat-popup">
            <Chat
              receiverId={selectedUser.id}
              receiverName={selectedUser.name}
              onClose={() => setShowChat(false)}
            />
          </div>
        )}

        <section className="dashboard-main center-dashboard">
          <div className="dashboard-content">
            <h2 className="dashboard-title">{greeting}, {facultyName}</h2>
            <div className="dashboard-widgets">
              <div className="widget-card"><h4>Total Projects</h4><p>{totalProjects}</p></div>
              <div className="widget-card"><h4>Pending Requests</h4><p>{pendingRequests}</p></div>
              <div className="widget-card"><h4>Upcoming Interviews</h4><p>{upcomingInterviews}</p></div>
              <div className="widget-card"><h4>Tasks Assigned</h4><p>{totalTasks}</p></div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default FacultyDashboard;
