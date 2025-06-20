import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, getDoc, query, where, serverTimestamp
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebase";
import "../App.css";
import FileUpload from "../components/FileUpload";
import FileList from "../components/FileList";

const MyProjects = () => {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [userRole, setUserRole] = useState("");
  const [facultyInfo, setFacultyInfo] = useState(null);
  const [expandedIds, setExpandedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserRole(data.role);

            if (data.role === "Faculty") {
              setFacultyInfo({
                facultyName: data.name || "Faculty",
                facultyEmail: data.email || "unknown@pes.edu",
                facultyDepartment: data.department || "N/A",
              });
              fetchFacultyProjects(user.uid);
            } else {
              fetchStudentProjects(user.uid);
            }
          }
        } catch (err) {
          console.error("Error loading user data:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchFacultyProjects = async (uid) => {
    try {
      const snapshot = await getDocs(collection(db, "projects"));
      const filtered = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((p) => p.facultyId === uid);

      const updatedProjects = await Promise.all(
        filtered.map(async (project) => {
          const q = query(
            collection(db, "projectRequests"),
            where("projectId", "==", project.id),
            where("status", "==", "Approved")
          );
          const snap = await getDocs(q);
          const members = snap.docs.map((d) => {
            const data = d.data();
            return `${data.studentName || data.studentId} (${data.studentEmail || "no-email"})`;
          });
          return { ...project, members };
        })
      );

      setProjects(updatedProjects);
    } catch (error) {
      console.error("Error fetching faculty projects:", error);
    }
  };

  const fetchStudentProjects = async (uid) => {
    try {
      const snapshot = await getDocs(collection(db, "projects"));
      const joined = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((p) => p.members?.includes(uid));
      setProjects(joined);
    } catch (error) {
      console.error("Error fetching student projects:", error);
    }
  };

  const toggleExpanded = (projectId) => {
    setExpandedIds((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleCreateOrUpdateProject = async () => {
    if (!title.trim() || !facultyInfo) return;

    try {
      if (editMode && selectedProjectId) {
        await updateDoc(doc(db, "projects", selectedProjectId), {
          title,
          description,
        });
      } else {
        await addDoc(collection(db, "projects"), {
          title,
          description,
          facultyId: auth.currentUser.uid,
          facultyName: facultyInfo.facultyName,
          facultyEmail: facultyInfo.facultyEmail,
          facultyDepartment: facultyInfo.facultyDepartment,
          members: [],
          createdAt: serverTimestamp(),
        });
      }

      resetModal();
      fetchFacultyProjects(auth.currentUser.uid);
    } catch (error) {
      console.error("Error saving project:", error);
    }
  };

  const handleEdit = (project) => {
    setEditMode(true);
    setSelectedProjectId(project.id);
    setTitle(project.title);
    setDescription(project.description);
    setShowModal(true);
  };

  const handleDelete = async (projectId) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await deleteDoc(doc(db, "projects", projectId));
        fetchFacultyProjects(auth.currentUser.uid);
      } catch (error) {
        console.error("Error deleting project:", error);
      }
    }
  };

  const resetModal = () => {
    setShowModal(false);
    setEditMode(false);
    setSelectedProjectId(null);
    setTitle("");
    setDescription("");
  };

  return (
    <div className="page-container">
      <h1 className="page-title">My Projects</h1>

      {loading ? (
        <p className="no-data-text">Loading...</p>
      ) : projects.length === 0 ? (
        <p className="no-data-text">No projects found.</p>
      ) : (
        <div className="project-grid">
          {userRole === "Faculty" && (
            <div className="project-card add-project" onClick={() => setShowModal(true)}>
              <div className="plus-icon">+</div>
              <p>Create Project</p>
            </div>
          )}

          {projects.map((project) => (
            <div key={project.id} className="project-card">
              <h3>{project.title}</h3>
              <p className="project-description">{project.description || "No description provided"}</p>
              <p className="project-meta">Faculty: {project.facultyName}</p>
              <p className="project-meta">Email: {project.facultyEmail}</p>
              <p className="project-meta">Department: {project.facultyDepartment}</p>

              {userRole === "Faculty" && (
                <>
                  <FileUpload projectId={project.id} />
                  <FileList projectId={project.id} />

                  <button className="secondary-button" onClick={() => toggleExpanded(project.id)}>
                    {expandedIds.includes(project.id) ? "Hide Members" : "Show Members"}
                  </button>

                  {expandedIds.includes(project.id) && (
                    <ul className="project-members">
                      {(project.members || []).map((m, idx) => (
                        <li key={idx}>{m}</li>
                      ))}
                    </ul>
                  )}

                  <div className="project-actions">
                    <button className="secondary-button" onClick={() => navigate(`/project/${project.id}`)}>View Project</button>
                    <button className="secondary-button" onClick={() => handleEdit(project)}>Edit</button>
                    <button className="secondary-button" onClick={() => handleDelete(project.id)}>Delete</button>
                  </div>
                </>
              )}

              {userRole === "Student" && (
                <>
                  <button className="secondary-button" onClick={() => toggleExpanded(project.id)}>
                    {expandedIds.includes(project.id) ? "Hide Details" : "Show Details"}
                  </button>

                  {expandedIds.includes(project.id) && (
                    <div className="expanded-section">
                      <FileList projectId={project.id} />
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editMode ? "Edit Project" : "Create New Project"}</h2>
            <input type="text" placeholder="Project Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea placeholder="Project Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <div className="modal-actions">
              <button onClick={handleCreateOrUpdateProject} className="primary-button">
                {editMode ? "Update" : "Create"}
              </button>
              <button onClick={resetModal} className="secondary-button">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProjects;
