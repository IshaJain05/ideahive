import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { toast } from "react-toastify";

const JoinProject = () => {
  const [projects, setProjects] = useState([]);
  const user = auth.currentUser;

  useEffect(() => {
    const fetchProjects = async () => {
      const querySnapshot = await getDocs(collection(db, "projects"));
      setProjects(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    fetchProjects();
  }, []);

  const requestToJoin = async (projectId) => {
    if (!user) {
      toast.error("You must be logged in.");
      return;
    }

    try {
      await addDoc(collection(db, "projectRequests"), {
        studentId: user.uid,
        studentName: user.displayName || "Student",
        projectId,
        status: "Pending",
      });

      toast.success("✅ Request sent to faculty!");
    } catch (error) {
      console.error("Error requesting to join project:", error);
      toast.error("❌ Failed to send request.");
    }
  };

  return (
    <div className="page-container">
      <h1>Join a Project</h1>
      <ul>
        {projects.map((project) => (
          <li key={project.id}>
            <h3>{project.title}</h3>
            <p>{project.description}</p>
            <button onClick={() => requestToJoin(project.id)}>Request to Join</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default JoinProject;
