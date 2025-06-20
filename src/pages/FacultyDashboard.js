import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import Chat from "./Chat";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Link } from "react-router-dom";

const FacultyDashboard = () => {
  const user = auth.currentUser;
  const dropdownRef = useRef();

  const [showChat, setShowChat] = useState(false);
  const [facultyName, setFacultyName] = useState("User");
  const [greeting, setGreeting] = useState("Hello");

  const [totalProjects, setTotalProjects] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [upcomingInterviews, setUpcomingInterviews] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [myProjects, setMyProjects] = useState([]);

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

  const fetchStats = useCallback(async () => {
    if (!user) return;

    const projectsSnap = await getDocs(query(collection(db, "projects"), where("facultyId", "==", user.uid)));
    const projects = projectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setMyProjects(projects);
    setTotalProjects(projects.length);

    const requestsSnap = await getDocs(query(collection(db, "projectRequests"), where("status", "==", "Pending")));
    const relevantRequests = requestsSnap.docs.filter(doc => doc.data().facultyId === user.uid);
    setPendingRequests(relevantRequests.length);

    const interviewSnap = await getDocs(query(collection(db, "interviews"), where("facultyId", "==", user.uid)));
    const futureInterviews = interviewSnap.docs.filter(doc => doc.data().timestamp?.toDate() > new Date());
    setUpcomingInterviews(futureInterviews.length);

    const tasksSnap = await getDocs(collection(db, "tasks"));
    const assignedTasks = tasksSnap.docs.filter(doc => doc.data().assignedBy === user.uid);
    setTotalTasks(assignedTasks.length);
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="layout">
      <main className="main-content" ref={dropdownRef}>
        <ToastContainer />
        <section className="dashboard-main center-dashboard">
          <div className="dashboard-content">
            <h2 className="dashboard-title" style={{ marginTop: "1.5rem" }}>
              {greeting}, {facultyName}
            </h2>

            <div className="dashboard-widgets">
              <div className="widget-card" style={{ borderLeft: "5px solid #007bff" }}>
                <h4>Total Projects</h4>
                <p>{totalProjects}</p>
              </div>
              <div className="widget-card" style={{ borderLeft: "5px solid #ffc107" }}>
                <h4>Pending Requests</h4>
                <p>{pendingRequests}</p>
              </div>
              <div className="widget-card" style={{ borderLeft: "5px solid #28a745" }}>
                <h4>Upcoming Interviews</h4>
                <p>{upcomingInterviews}</p>
              </div>
              <div className="widget-card" style={{ borderLeft: "5px solid #6f42c1" }}>
                <h4>Tasks Assigned</h4>
                <p>{totalTasks}</p>
              </div>
            </div>

            <div className="dashboard-card" style={{ marginTop: "2rem" }}>
              <h3>My Projects</h3>
              {myProjects.length === 0 ? (
                <p>No projects found.</p>
              ) : (
                <ul>
                  {myProjects.map(project => (
                    <li key={project.id}>
                      <Link to={`/faculty/project-overview?id=${project.id}`}>
                        {project.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </main>

      {showChat && (
        <div className="chat-popup">
          <Chat
            receiverId="some-student-id"
            receiverName="Student"
            onClose={() => setShowChat(false)}
          />
        </div>
      )}
    </div>
  );
};

export default FacultyDashboard;
