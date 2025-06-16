// ASSIGN TASK (FACULTY SIDE)
import React, { useState, useEffect } from "react";
import { db, storage, auth } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast, ToastContainer } from "react-toastify";
import { onAuthStateChanged } from "firebase/auth";
import { logActivity } from "../utils/logActivity";
import "react-toastify/dist/ReactToastify.css";
import "../App.css";

const AssignTask = () => {
  const [taskName, setTaskName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [projects, setProjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      const q = query(collection(db, "projects"), where("facultyId", "==", user.uid));
      const snapshot = await getDocs(q);
      setProjects(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchProjects();
  }, [user]);

  const fetchStudents = async (projectId) => {
    if (!projectId) return;
    const q = query(
      collection(db, "projectRequests"),
      where("projectId", "==", projectId),
      where("status", "==", "Approved")
    );
    const snapshot = await getDocs(q);
    const studentIds = snapshot.docs.map((doc) => doc.data().studentId);

    const allStudentsSnap = await getDocs(
      query(collection(db, "users"), where("role", "==", "Student"))
    );
    const allStudents = allStudentsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const studentList = allStudents.filter((student) => studentIds.includes(student.id));
    setStudents(studentList);
  };

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const assignTask = async () => {
    if (!taskName || !deadline || !selectedStudent || !selectedProject) {
      toast.error("⚠️ Please fill out all required fields.");
      return;
    }

    setLoading(true);

    try {
      const duplicateQuery = query(
        collection(db, "tasks"),
        where("studentId", "==", selectedStudent),
        where("projectId", "==", selectedProject),
        where("name", "==", taskName)
      );
      const duplicateSnap = await getDocs(duplicateQuery);
      if (!duplicateSnap.empty) {
        toast.error("⚠️ This task already exists for the student in the selected project.");
        setLoading(false);
        return;
      }

      let fileUrl = "";
      if (file) {
        const storageRef = ref(storage, `tasks/${selectedStudent}/${file.name}`);
        await uploadBytes(storageRef, file);
        fileUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, "tasks"), {
        name: taskName,
        deadline: new Date(deadline),
        studentId: selectedStudent,
        projectId: selectedProject,
        fileUrl,
        status: "Pending",
        assignedBy: user.uid,
        createdAt: serverTimestamp(),
        progress: 0,
      });

      await logActivity(
        "Assigned a task",
        selectedProject,
        `Task: "${taskName}" to studentId: ${selectedStudent}`
      );

      toast.success("✅ Task Assigned Successfully!");
      setTaskName("");
      setDeadline("");
      setSelectedStudent("");
      setSelectedProject("");
      setFile(null);
    } catch (err) {
      console.error("❌ Task assignment error:", err);
      toast.error("❌ Unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="assign-task-container">
      <ToastContainer />
      <h1 className="assign-task-title">📌 Assign a Task</h1>

      <div className="assign-task-card">
        <label>Project</label>
        <select
          value={selectedProject}
          onChange={(e) => {
            setSelectedProject(e.target.value);
            fetchStudents(e.target.value);
          }}
        >
          <option value="">Select Project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.title}
            </option>
          ))}
        </select>

        <label>Student</label>
        <select
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
        >
          <option value="">Select Student</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name}
            </option>
          ))}
        </select>

        <label>Task Name</label>
        <input
          type="text"
          value={taskName}
          placeholder="Enter task name"
          onChange={(e) => setTaskName(e.target.value)}
        />

        <label>Deadline</label>
        <input
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />

        <label>Attach File</label>
        <input type="file" onChange={handleFileChange} />

        <button
          className="assign-task-btn"
          onClick={assignTask}
          disabled={loading}
        >
          {loading ? "Assigning..." : "✔ Assign Task"}
        </button>
      </div>
    </div>
  );
};

export default AssignTask;
