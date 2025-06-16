import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import FileUpload from "../components/FileUpload";
import FileList from "../components/FileList";

const ProjectOverview = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [taskProgress, setTaskProgress] = useState({ completed: 0, total: 0 });
  const [activityLog, setActivityLog] = useState([]);

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const projectRef = doc(db, "projects", projectId);
        const projectDoc = await getDoc(projectRef);
        if (!projectDoc.exists()) return;

        const projectData = projectDoc.data();
        setProject(projectData);

        // Members
        const memberIds = projectData.members || [];
        const memberDetails = await Promise.all(
          memberIds.map(async (uid) => {
            const userDoc = await getDoc(doc(db, "users", uid));
            return userDoc.exists()
              ? { id: uid, name: userDoc.data().name }
              : { id: uid, name: "Unknown User" };
          })
        );
        setMembers(memberDetails);

        // Interviews
        const interviewQuery = query(
          collection(db, "interviews"),
          where("projectId", "==", projectId),
          where("timestamp", ">=", new Date())
        );
        const interviewSnap = await getDocs(interviewQuery);
        setUpcomingInterviews(interviewSnap.docs.map((doc) => doc.data()));

        // Tasks
        const taskQuery = query(collection(db, "tasks"), where("projectId", "==", projectId));
        const taskSnap = await getDocs(taskQuery);
        const total = taskSnap.docs.length;
        const completed = taskSnap.docs.filter(doc => doc.data().status === "Completed").length;
        setTaskProgress({ completed, total });

        // Activity Logs
        const activityQuery = query(
          collection(db, "activityLogs"),
          where("projectId", "==", projectId),
          orderBy("timestamp", "desc")
        );
        const activitySnap = await getDocs(activityQuery);
        setActivityLog(activitySnap.docs.map((doc) => doc.data()));
      } catch (error) {
        console.error("Error loading project data:", error.message);
      }
    };

    fetchProjectData();
  }, [projectId]);

  if (!project) return <p>Loading project details...</p>;

  const progressPercent = taskProgress.total
    ? (taskProgress.completed / taskProgress.total) * 100
    : 0;

  return (
    <div className="project-page-container">
      <button onClick={() => navigate("/my-projects")} className="secondary-button">
        ← Back to Projects
      </button>

      {/* Cover Image */}
      {project.coverImageURL && (
        <img
          src={project.coverImageURL}
          alt="Project Cover"
          style={{
            width: "100%",
            height: "300px",
            objectFit: "cover",
            borderRadius: "8px",
            margin: "1rem 0",
          }}
        />
      )}

      <h1 className="project-title">{project.title}</h1>
      <p className="project-description">{project.description}</p>

      {/* Extra metadata */}
      <div className="project-metadata">
        <p><strong>Domain:</strong> {project.domain || "N/A"}</p>
        <p><strong>Tags:</strong> {project.tags?.join(", ") || "N/A"}</p>
        <p><strong>Start Date:</strong> {project.startDate || "N/A"}</p>
        <p><strong>Estimated Duration:</strong> {project.estimatedDuration || "N/A"}</p>
      </div>

      {/* Members */}
      <div className="project-section">
        <h2>👥 Project Members</h2>
        {members.length === 0 ? (
          <p>No members in this project.</p>
        ) : (
          <ul>{members.map((m) => <li key={m.id}>• {m.name}</li>)}</ul>
        )}
      </div>

      {/* Interviews */}
      <div className="project-section">
        <h2>📅 Upcoming Interviews</h2>
        {upcomingInterviews.length === 0 ? (
          <p>No upcoming interviews.</p>
        ) : (
          <ul>
            {upcomingInterviews.map((i, idx) => (
              <li key={idx}>
                {new Date(i.timestamp.seconds * 1000).toLocaleString()} – with{" "}
                <strong>{i.facultyName || "Faculty"}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Progress */}
      <div className="project-section">
        <h2>📈 Task Progress</h2>
        <p>{taskProgress.completed} of {taskProgress.total} tasks completed ({progressPercent.toFixed(1)}%)</p>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>

      {/* Activity */}
      <div className="project-section">
        <h2>🕒 Recent Activity</h2>
        {activityLog.length === 0 ? (
          <p>No recent activity.</p>
        ) : (
          <ul>
            {activityLog.map((a, i) => (
              <li key={i}>
                {a.description} – {new Date(a.timestamp.seconds * 1000).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Files */}
      <div className="project-section">
        <h2>📂 Project Files</h2>
        <FileUpload projectId={projectId} />
        <FileList projectId={projectId} />
      </div>
    </div>
  );
};

export default ProjectOverview;
