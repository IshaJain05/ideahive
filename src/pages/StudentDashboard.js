import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  updateDoc
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Chat from "./Chat";
import { logActivity } from "../utils/logActivity";
import InterviewFeedbackView from "../components/InterviewFeedbackView";
import StudentTasks from "../components/StudentTasks";
import StudentProgress from "../components/StudentProgress";
import {
  FaTasks,
  FaProjectDiagram,
  FaComments,
  FaCalendarAlt,
  FaSignOutAlt,
  FaUserEdit,
  FaBell
} from "react-icons/fa";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [showDropdown, setShowDropdown] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [userName, setUserName] = useState("User");
  const [greeting, setGreeting] = useState("Hello");
  const [joinedProjects, setJoinedProjects] = useState(0);
  const [upcomingInterviews, setUpcomingInterviews] = useState(0);
  const [assignedTasks, setAssignedTasks] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatReceiver, setChatReceiver] = useState(null);
  const [facultyList, setFacultyList] = useState([]);

  const toggleNotifications = () => setShowNotifications(!showNotifications);
  const handleLogout = () => navigate("/login");

  const submitTask = async (taskId, deadline) => {
    const now = new Date();
    const isLate = now > new Date(deadline?.seconds ? deadline.toDate() : deadline);
    await updateDoc(doc(db, "tasks", taskId), {
      status: isLate ? "Late" : "Submitted",
      submittedAt: now,
    });
    await logActivity("Submitted a task", null, `Task ID: ${taskId} - ${isLate ? "Late" : "On-time"}`);
  };

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening");
  }, []);

  useEffect(() => {
    if (!user) return;
    const getUser = async () => {
      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (docSnap.exists()) setUserName(docSnap.data().name || "User");
    };
    getUser();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      query(
        collection(db, "chats"),
        where("receiver", "==", user.uid),
        where("read", "==", false),
        orderBy("timestamp", "desc")
      ),
      (snap) => {
        setUnreadMessages(snap.docs.length);
        if (snap.docs.length) toast.info("New message received", { position: "top-right", autoClose: 5000 });
      }
    );
    return () => unsub();
  }, [user]);

  useEffect(() => {
  const fetchStats = async () => {
    try {
      if (!user) return;

      // Projects joined
      const projQ = query(
        collection(db, "projects"),
        where("members", "array-contains", user.uid)
      );
      const projSnap = await getDocs(projQ);
      setJoinedProjects(projSnap.size);

      // Upcoming interviews
      const interviewQ = query(
        collection(db, "interviews"),
        where("studentId", "==", user.uid)
      );
      const interviewSnap = await getDocs(interviewQ);
      const today = new Date();
      const upcoming = interviewSnap.docs.filter(
        doc => new Date(doc.data().date) >= today
      );
      setUpcomingInterviews(upcoming.length);

      // Tasks assigned
      const taskQ = query(
        collection(db, "tasks"),
        where("studentId", "==", user.uid)
      );
      const taskSnap = await getDocs(taskQ);
      setAssignedTasks(taskSnap.size);
    } catch (err) {
      console.error("❌ Fetching stats failed:", err.message);
      toast.error("Error loading dashboard data. Please check permissions.");
    }
  };

  fetchStats();
}, [user]);


  useEffect(() => {
  const fetchFaculty = async () => {
    try {
      if (!user) return;

      const q = query(collection(db, "projects"), where("members", "array-contains", user.uid));
      const projectsSnap = await getDocs(q);
      const facultyIds = [
        ...new Set(
          projectsSnap.docs
            .map(doc => doc.data().facultyId)
            .filter(fid => typeof fid === "string")
        )
      ];

      const fetched = await Promise.all(
        facultyIds.map(async (fid) => {
          try {
            const snap = await getDoc(doc(db, "users", fid));
            if (snap.exists()) {
              const name = snap.data().name || "Faculty";
              return { id: fid, name };
            }
            return null;
          } catch (err) {
            console.warn(`❌ Error fetching user ${fid}:`, err.message);
            return null;
          }
        })
      );

      setFacultyList(fetched.filter(Boolean));
      console.log("✅ Final faculty list:", fetched.filter(Boolean));
    } catch (err) {
      console.error("❌ Faculty fetch failed:", err.message);
    }
  };

  fetchFaculty();
}, [user]);


  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "notifications"),
      where("to", "==", user.uid),
      where("read", "==", false),
      orderBy("timestamp", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const notifs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifs);
      setUnreadCount(notifs.length);
    });
    return () => unsub();
  }, [user]);

  const handleNotificationClick = async (notif) => {
    await updateDoc(doc(db, "notifications", notif.id), { read: true });

    if (notif.message?.toLowerCase().includes("was approved")) {
      toast(
        <div>
          <strong>🎉 Project Approved!</strong><br />
          {notif.message}
        </div>,
        {
          position: "top-right",
          autoClose: 5000,
        }
      );
    }

    navigate(notif.link || "/");
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>IdeaHive</h2>
        <a href="/student">Dashboard</a>
        <a href="/available-projects">Explore Projects</a>
        <a href="/my-projects">My Projects</a>
        <a href="/upcoming-interviews">Interviews</a>
        <a href="/track-task">Tasks</a>
        <a href="/activity-log">Activity Log</a>
        <button className="sidebar-link" onClick={() => navigate("/edit-profile")}>
          Edit Profile
        </button>
      </aside>

      <main className="main-content">
        <ToastContainer />
        <header className="dashboard-header" style={{ background: "linear-gradient(to right, #0056b3, #007bff)", color: "white" }}>
          <h1 className="idea-hive-title">IdeaHive</h1>

          <div className="header-buttons">
            <div className="dropdown chat-dropdown-wrapper">
              <button className="messages-button" onClick={() => setShowChat(!showChat)}>
                <FaComments /> {unreadMessages > 0 && <span className="notification-badge">{unreadMessages}</span>}
              </button>
              {showChat && (
                <div className="chat-dropdown">
                  {!chatReceiver ? (
                    <div className="chat-user-dropdown">
                      <h4>Chat with Faculty</h4>
                      <ul>
                        {facultyList.length === 0 ? (
                          <li>No faculty found</li>
                        ) : (
                          facultyList.map(fac => (
                            <li key={fac.id}>
                              <button onClick={() => setChatReceiver(fac)}>{fac.name}</button>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  ) : (
                    <Chat
                      receiverId={chatReceiver.id}
                      receiverName={chatReceiver.name}
                      onClose={() => {
                        setChatReceiver(null);
                        setShowChat(false);
                      }}
                    />
                  )}
                </div>
              )}
            </div>

            <div className="user-profile">
              <button className="user-profile-circle" onClick={() => setShowDropdown(!showDropdown)}>
                {userName.charAt(0)}
              </button>
              {showDropdown && (
                <div className="user-dropdown">
                  <button className="dropdown-item" onClick={() => navigate("/edit-profile")}><FaUserEdit /> Edit Profile</button>
                  <button className="dropdown-item" onClick={handleLogout}><FaSignOutAlt /> Log Out</button>
                  <button className="dropdown-item" onClick={toggleNotifications}><FaBell /> Notifications</button>
                </div>
              )}
            </div>

            <div className="notifications-container">
              <button className="notifications-button" onClick={toggleNotifications}>
                <FaBell />
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </button>
              {showNotifications && (
                <div className="notifications-dropdown">
                  {notifications.length === 0
                    ? <p>No new notifications</p>
                    : notifications.map((notif, index) => (
                        <div key={index} className="notification-item" onClick={() => handleNotificationClick(notif)}>
                          {notif.message}
                        </div>
                      ))}
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="dashboard-main center-dashboard">
          <div className="dashboard-content">
            <h2 className="dashboard-title">{greeting}, {userName}</h2>

            <div className="dashboard-widgets">
              <div className="widget-card" style={{ borderLeft: "5px solid #007bff" }}>
                <h4><FaProjectDiagram /> Joined Projects</h4>
                <p>{joinedProjects}</p>
              </div>
              <div className="widget-card" style={{ borderLeft: "5px solid #28a745" }}>
                <h4><FaCalendarAlt /> Interviews</h4>
                <p>{upcomingInterviews}</p>
              </div>
              <div className="widget-card" style={{ borderLeft: "5px solid #ffc107" }}>
                <h4><FaComments /> Messages</h4>
                <p>{unreadMessages}</p>
              </div>
              <div className="widget-card" style={{ borderLeft: "5px solid #6f42c1" }}>
                <h4><FaTasks /> Tasks</h4>
                <p>{assignedTasks}</p>
              </div>
            </div>

            <div className="dashboard-lower-grid">
              <div className="dashboard-card">
                <h3>Interview Feedback</h3>
                <InterviewFeedbackView />
              </div>

              <div className="dashboard-card">
                <h3>Your Assigned Tasks</h3>
                {assignedTasks === 0
                  ? <p>No tasks assigned yet.</p>
                  : <StudentTasks userId={user?.uid} onSubmitTask={submitTask} />}
              </div>

              <div className="dashboard-card">
                <h3>Your Progress Overview</h3>
                <StudentProgress />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default StudentDashboard;
