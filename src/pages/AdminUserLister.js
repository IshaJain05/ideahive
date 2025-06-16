import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const AdminUserLister = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        const data = snap.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        }));
        setUsers(data);
        console.log("📋 All Users:", data);
      } catch (err) {
        console.error("❌ Failed to fetch users:", err);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="page-container">
      <h2 className="page-title">📋 User List (Admin Utility)</h2>
      <ul style={{ paddingLeft: "0" }}>
        {users.map(user => (
          <li
            key={user.uid}
            style={{
              border: "1px solid #ccc",
              margin: "10px 0",
              padding: "10px",
              borderRadius: "8px"
            }}
          >
            <strong>UID:</strong> {user.uid} <br />
            <strong>Name:</strong> {user.name || "N/A"} <br />
            <strong>Email:</strong> {user.email || "N/A"} <br />
            <strong>Role:</strong> {user.role || "N/A"}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminUserLister;
