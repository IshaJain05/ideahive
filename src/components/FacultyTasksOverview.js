import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";
import { auth, db } from "../firebase";

const FacultyTasksOverview = () => {
  const [tasksByProject, setTasksByProject] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTasks = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // ✅ Get only this faculty's projects
        const projectQuery = query(collection(db, "projects"), where("facultyId", "==", user.uid));
        const projectSnap = await getDocs(projectQuery);
        const projectMap = {};
        const projectIds = [];

        projectSnap.forEach(doc => {
          projectMap[doc.id] = doc.data().title || "Untitled Project";
          projectIds.push(doc.id);
        });

        if (projectIds.length === 0) {
          setTasksByProject({});
          setLoading(false);
          return;
        }

        // ✅ Get only tasks assigned to these projects
        const taskQuery = query(collection(db, "tasks"));
        const taskSnap = await getDocs(taskQuery);
        const relevantTasks = taskSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(task => projectIds.includes(task.projectId));

        const grouped = {};
        for (const task of relevantTasks) {
          const projectTitle = projectMap[task.projectId] || "Unknown Project";
          let studentName = "Unknown Student";

          try {
            const studentSnap = await getDoc(doc(db, "users", task.studentId));
            if (studentSnap.exists()) {
              studentName = studentSnap.data().name || studentName;
            }
          } catch (err) {
            console.warn(`Could not fetch student info for ${task.studentId}`);
          }

          const enrichedTask = { ...task, studentName };

          if (!grouped[projectTitle]) grouped[projectTitle] = [];
          grouped[projectTitle].push(enrichedTask);
        }

        setTasksByProject(grouped);
      } catch (err) {
        console.error("Error loading tasks:", err.message);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  return (
    <div className="page-container">
      <h2 className="page-title">📋 Tasks Assigned to Students</h2>

      {loading ? (
        <p>Loading...</p>
      ) : Object.keys(tasksByProject).length === 0 ? (
        <p>No tasks found for your projects.</p>
      ) : (
        Object.entries(tasksByProject).map(([projectTitle, tasks]) => (
          <div key={projectTitle} className="project-group" style={{ marginBottom: "2rem" }}>
            <h3 style={{ color: "#0056b3" }}>📁 {projectTitle}</h3>
            <ul className="task-list" style={{ listStyle: "none", padding: 0 }}>
              {tasks.map((task) => {
                const deadline = task.deadline?.seconds
                  ? new Date(task.deadline.seconds * 1000).toLocaleString()
                  : "No deadline";

                return (
                  <li key={task.id} className="task-item" style={{
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    padding: "12px",
                    marginBottom: "10px",
                    backgroundColor: "#f8f9fa"
                  }}>
                    <p><strong>📌 Task:</strong> {task.name}</p>
                    <p><strong>👤 Student:</strong> {task.studentName}</p>
                    <p><strong>📅 Deadline:</strong> {deadline}</p>
                    <p><strong>📊 Status:</strong>{" "}
                      <span style={{ color: task.status === "Late" ? "red" : "green" }}>
                        {task.status || "Pending"}
                      </span>
                    </p>
                    {task.submissionUrl && (
                      <p>
                        📎 <a href={task.submissionUrl} target="_blank" rel="noopener noreferrer">
                          View Submission
                        </a>
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))
      )}
    </div>
  );
};

export default FacultyTasksOverview;
