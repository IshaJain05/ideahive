import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const FacultyTrackTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [projects, setProjects] = useState({});
  const [students, setStudents] = useState({});
  const [filters, setFilters] = useState({ projectId: "", studentId: "", status: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const fetchTasks = async () => {
      const q = query(collection(db, "tasks"), where("assignedBy", "==", user.uid));
      const snapshot = await getDocs(q);
      const taskList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(taskList);
      setFilteredTasks(taskList);

      const projectsSnap = await getDocs(collection(db, "projects"));
      const studentsSnap = await getDocs(collection(db, "users"));

      const projectMap = {};
      projectsSnap.docs.forEach(doc => projectMap[doc.id] = doc.data().title);

      const studentMap = {};
      studentsSnap.docs.forEach(doc => studentMap[doc.id] = doc.data().name);

      setProjects(projectMap);
      setStudents(studentMap);
    };

    fetchTasks();
  }, [user]);

  useEffect(() => {
    let updated = [...tasks];

    // Apply filters
    if (filters.projectId) updated = updated.filter(task => task.projectId === filters.projectId);
    if (filters.studentId) updated = updated.filter(task => task.studentId === filters.studentId);
    if (filters.status) updated = updated.filter(task => task.status === filters.status);

    // Apply search
    if (searchTerm) {
      updated = updated.filter(task => task.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // Sort by deadline ascending
    updated.sort((a, b) => {
      const aDeadline = a.deadline?.seconds || 0;
      const bDeadline = b.deadline?.seconds || 0;
      return aDeadline - bDeadline;
    });

    setFilteredTasks(updated);
  }, [filters, searchTerm, tasks]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleDownloadCSV = () => {
    if (filteredTasks.length === 0) {
      alert("No tasks to export.");
      return;
    }

    const headers = ["Task Name", "Project", "Student", "Status", "Deadline"];
    const rows = filteredTasks.map(task => [
      `"${task.name}"`,
      `"${projects[task.projectId] || "N/A"}"`,
      `"${students[task.studentId] || "N/A"}"`,
      `"${task.status}"`,
      `"${task.deadline?.seconds ? new Date(task.deadline.seconds * 1000).toLocaleString() : "N/A"}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "faculty_tasks_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-container">
      <ToastContainer />
      <h1 className="page-title">📝 Track Assigned Tasks</h1>

      {/* Filters + Search */}
      <div style={{ marginBottom: "20px", display: "flex", flexWrap: "wrap", gap: "10px" }}>
        <select onChange={(e) => handleFilterChange("projectId", e.target.value)} value={filters.projectId}>
          <option value="">All Projects</option>
          {Object.entries(projects).map(([id, title]) => (
            <option key={id} value={id}>{title}</option>
          ))}
        </select>

        <select onChange={(e) => handleFilterChange("studentId", e.target.value)} value={filters.studentId}>
          <option value="">All Students</option>
          {Object.entries(students).map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>

        <select onChange={(e) => handleFilterChange("status", e.target.value)} value={filters.status}>
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Submitted">Submitted</option>
          <option value="Late">Late</option>
        </select>

        <input
          type="text"
          placeholder="Search Task Name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <button className="primary-button" onClick={handleDownloadCSV}>
          ⬇ Download CSV
        </button>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <p>No tasks found for the selected filters.</p>
      ) : (
        <ul className="task-list">
          {filteredTasks.map((task) => {
            const deadline = task.deadline?.seconds
              ? new Date(task.deadline.seconds * 1000).toLocaleString()
              : "No deadline";

            return (
              <li key={task.id} className="task-item">
                <h3>{task.name}</h3>
                <p><strong>Project:</strong> {projects[task.projectId] || "N/A"}</p>
                <p><strong>Assigned To:</strong> {students[task.studentId] || "N/A"}</p>
                <p><strong>Status:</strong> 
                  <span style={{ color: task.status === "Late" ? "red" : task.status === "Pending" ? "orange" : "green" }}>
                    {task.status}
                  </span>
                </p>
                <p><strong>Deadline:</strong> {deadline}</p>

                {task.fileUrl && (
                  <p>📄 <a href={task.fileUrl} target="_blank" rel="noopener noreferrer">View Task File</a></p>
                )}
                {task.submissionUrl && (
                  <p>📄 <a href={task.submissionUrl} target="_blank" rel="noopener noreferrer">View Submission</a></p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default FacultyTrackTasks;
