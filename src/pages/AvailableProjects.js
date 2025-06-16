import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  getDocs as getFilteredDocs
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


const AvailableProjects = () => {
  const [projects, setProjects] = useState([]);
  const [requestedProjects, setRequestedProjects] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState("");

  const user = auth.currentUser;

  // Fetch all projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const snapshot = await getDocs(collection(db, "projects"));
        const allProjects = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProjects(allProjects);
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };
    fetchProjects();
  }, []);

  // Fetch user's existing join requests
  useEffect(() => {
    const fetchRequests = async () => {
      if (!user) return;
      const q = query(collection(db, "projectRequests"), where("studentId", "==", user.uid));
      const snapshot = await getFilteredDocs(q);
      const requestedIds = snapshot.docs.map((doc) => doc.data().projectId);
      setRequestedProjects(requestedIds);
    };
    fetchRequests();
  }, [user]);

  // Handle join request
  const handleRequestJoin = async (projectId) => {
    if (requestedProjects.includes(projectId)) {
      toast.info("You’ve already requested to join this project.");
      return;
    }

    try {
      await addDoc(collection(db, "projectRequests"), {
        projectId,
        studentId: user.uid,
        status: "Pending",
      });

      setRequestedProjects((prev) => [...prev, projectId]);
      toast.success("Join request sent successfully!");
    } catch (error) {
      console.error("Error sending join request:", error);
      toast.error("Failed to send request.");
    }
  };

  // Filtered projects logic
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title?.toLowerCase().includes(searchText) ||
      p.description?.toLowerCase().includes(searchText);
    const matchesFaculty =
      !selectedFaculty || (p.facultyName || "N/A") === selectedFaculty;
    return matchesSearch && matchesFaculty;
  });

  return (
    <div className="page-container">
      <ToastContainer />

      {/* Banner Header */}
      <div className="project-header">
        <h1>Available Projects</h1>
        <p>Find and join exciting academic projects guided by top faculty</p>
      </div>

      {/* Filters */}
      <div className="project-filters">
        <input
          type="text"
          placeholder="Search by title or description..."
          onChange={(e) => setSearchText(e.target.value.toLowerCase())}
        />
        <select onChange={(e) => setSelectedFaculty(e.target.value)}>
          <option value="">All Faculties</option>
          {[...new Set(projects.map((p) => p.facultyName || "N/A"))].map((fac) => (
            <option key={fac}>{fac}</option>
          ))}
        </select>
      </div>

      {/* Filtered Results */}
      {filteredProjects.length === 0 ? (
        <p style={{ textAlign: "center", padding: "2rem", color: "#888" }}>
          🔍 No matching projects found.
        </p>
      ) : (
        <ul className="project-list">
          {filteredProjects.map((project) => (
            <li key={project.id} className="project-card">
              <span className="project-badge">Ongoing</span>
              <h3>{project.title}</h3>
              {project.description && (
                <p>{project.description}</p>
              )}
              <p><strong>Faculty:</strong> {project.facultyName || "N/A"}</p>
              <button
                className="primary-button"
                onClick={() => handleRequestJoin(project.id)}
                disabled={requestedProjects.includes(project.id)}
              >
                {requestedProjects.includes(project.id) ? "Requested" : "Request to Join"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AvailableProjects;
