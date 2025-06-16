import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import Chat from "./Chat"; // Import Chat Component

const FacultyConnect = () => {
  const [faculty, setFaculty] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(null);

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "faculty"));
        const facultyData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFaculty(facultyData);
      } catch (error) {
        console.error("Error fetching faculty:", error);
      }
    };

    fetchFaculty();
  }, []);

  return (
    <div className="page-container">
      <h1>Faculty Connect</h1>
      {faculty.length === 0 ? (
        <p>No faculty members available to display.</p>
      ) : (
        <ul>
          
          {faculty.map((prof) => (
          <li key={prof.id}>
            <p>
              <strong>{prof.name}</strong> - {prof.department}
            </p>
            <button onClick={() => setSelectedFaculty(prof.id)}>Message</button>
          </li>
        ))}
        </ul>
      )}
          {selectedFaculty && <Chat receiverId={selectedFaculty} />}
    </div>
  );
  
};

export default FacultyConnect;
