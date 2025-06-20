import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db, storage, auth } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast, ToastContainer } from "react-toastify";
import { onAuthStateChanged } from "firebase/auth";
import "react-toastify/dist/ReactToastify.css";
import "../App.css";
 
const TrackTask = () => {
  const [tasksByProject, setTasksByProject] = useState({});
  const [fileUploads, setFileUploads] = useState({});
  const [uploadingTaskId, setUploadingTaskId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("👤 Authenticated user UID:", user.uid); // log UID
        setCurrentUser(user);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const fetchTasksAndProjects = async () => {
      try {
        console.log("Fetching tasks for:", currentUser.uid);
        const taskQuery = query(
          collection(db, "tasks"),
          where("studentId", "==", currentUser.uid)
        );
        const taskSnap = await getDocs(taskQuery);
        const tasks = taskSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const projectsSnap = await getDocs(collection(db, "projects"));
        const projectMap = {};
        projectsSnap.docs.forEach((doc) => {
          projectMap[doc.id] = doc.data().title || "Untitled Project";
        });

        const grouped = {};
        tasks.forEach((task) => {
          const title = projectMap[task.projectId] || "Unknown Project";
          if (!grouped[title]) grouped[title] = [];
          grouped[title].push(task);
        });

        setTasksByProject(grouped);
      } catch (err) {
        console.error("❌ Error fetching tasks/projects:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasksAndProjects();
  }, [currentUser]);

  const handleFileChange = (taskId, file) => {
    setFileUploads((prev) => ({ ...prev, [taskId]: file }));
  };

  const submitAssignment = async (task) => {
    const file = fileUploads[task.id];
    if (!file) return toast.error(" Please select a file.");
    if (file.size > 10 * 1024 * 1024) return toast.error(" File too large.");

    try {
      setUploadingTaskId(task.id);
      const storageRef = ref(storage, `submissions/${task.studentId}/${file.name}`);
      await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(storageRef);

      const now = new Date();
      const deadlineDate = task.deadline?.seconds
        ? new Date(task.deadline.seconds * 1000)
        : new Date(task.deadline);
      const isLate = deadlineDate && now > deadlineDate;

      await updateDoc(doc(db, "tasks", task.id), {
        status: isLate ? "Late" : "Submitted",
        submissionUrl: fileUrl,
        submittedAt: now,
      });

      toast.success(isLate ? "ubmitted Late!" : "Submitted!");
    } catch (err) {
      console.error("Upload Failed", err);
      toast.error("Upload Failed");
    } finally {
      setUploadingTaskId(null);
    }
  };

  const calculateProgress = (tasks) => {
    const submitted = tasks.filter((t) => t.status === "Submitted").length;
    const late = tasks.filter((t) => t.status === "Late").length;
    const total = tasks.length;
    const completed = submitted + late;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  return (
    <div className="page-container">
      <ToastContainer />
      <h1 className="page-title">Track Your Tasks</h1>

      {loading ? (
        <p>Loading...</p>
      ) : Object.keys(tasksByProject).length === 0 ? (
        <p style={{ textAlign: "center", marginTop: "2rem", fontStyle: "italic" }}>
          No tasks assigned yet.
        </p>
      ) : (
        Object.entries(tasksByProject).map(([projectTitle, tasks]) => {
          const progress = calculateProgress(tasks);
          return (
            <div key={projectTitle} className="project-group">
              <h2 style={{ color: "#1a237e", marginTop: "1rem" }}>{projectTitle}</h2>

              <div className="progress-bar" style={{
                background: "#ddd",
                height: "18px",
                borderRadius: "10px",
                overflow: "hidden",
                marginTop: "10px",
                marginBottom: "10px",
              }}>
                <div style={{
                  height: "100%",
                  width: `${progress}%`,
                  backgroundColor:
                    progress >= 75 ? "#2e7d32" : progress >= 50 ? "#f9a825" : "#d32f2f",
                  transition: "width 0.4s ease-in-out",
                }} />
              </div>
              <p style={{ fontSize: "0.9rem", marginBottom: "1rem" }}>
                {progress}% Completed
              </p>

              <ul className="task-list">
                {tasks.map((task) => {
                  const deadline = task.deadline?.seconds
                    ? new Date(task.deadline.seconds * 1000).toLocaleString()
                    : new Date(task.deadline).toLocaleString();

                  return (
                    <li key={task.id} className="task-item">
                      <h3>{task.name}</h3>
                      <p><strong>Status:</strong> {task.status || "Pending"}</p>
                      <p><strong>Deadline:</strong> {deadline}</p>

                      {task.fileUrl && (
                        <p>
                           <a href={task.fileUrl} target="_blank" rel="noopener noreferrer">View Task</a>
                        </p>
                      )}

                      {task.submissionUrl && (
                        <p>
                           <a href={task.submissionUrl} target="_blank" rel="noopener noreferrer">Your Submission</a>
                        </p>
                      )}

                      {task.status === "Pending" && (
                        <div>
                          <input
                            type="file"
                            onChange={(e) => handleFileChange(task.id, e.target.files[0])}
                            disabled={uploadingTaskId === task.id}
                          />
                          <button
                            onClick={() => submitAssignment(task)}
                            disabled={uploadingTaskId === task.id}
                          >
                            {uploadingTaskId === task.id ? "Uploading..." : "Submit"}
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })
      )}
    </div>
  );
};

export default TrackTask;
