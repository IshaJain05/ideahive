import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import "../App.css";

const EditProfile = () => {
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    role: "",
    department: "",
    srn: "",
    about: "",
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return navigate("/login");

      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) setUserData(snap.data());
      } catch (err) {
        console.error("Error fetching user:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    try {
      const ref = doc(db, "users", user.uid);
      await updateDoc(ref, {
        name: userData.name,
        department: userData.department,
        about: userData.about,
        ...(userData.role === "Student" && { srn: userData.srn }),
      });
      alert("✅ Profile updated!");
      navigate("/faculty-dashboard");
    } catch (err) {
      console.error("Error updating:", err);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="page-container" style={{ maxWidth: "700px" }}>
      <h2 className="page-title"> Edit Profile</h2>
      <form className="auth-form" onSubmit={handleUpdate} style={{ gap: "1.5rem" }}>
        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            value={userData.name}
            placeholder="Enter your full name"
            onChange={(e) => setUserData({ ...userData, name: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input type="email" value={userData.email} disabled />
        </div>

        <div className="form-group">
          <label>Role</label>
          <input type="text" value={userData.role} disabled />
        </div>

        <div className="form-group">
          <label>Department</label>
          <input
            type="text"
            placeholder="e.g. CSE, MBA, ECE"
            value={userData.department}
            onChange={(e) => setUserData({ ...userData, department: e.target.value })}
          />
        </div>

        {userData.role === "Student" && (
          <div className="form-group">
            <label>SRN</label>
            <input
              type="text"
              value={userData.srn || ""}
              onChange={(e) => setUserData({ ...userData, srn: e.target.value })}
            />
          </div>
        )}

        <div className="form-group">
          <label>About</label>
          <textarea
            placeholder="Your teaching interests, qualifications, etc..."
            rows={4}
            value={userData.about || ""}
            onChange={(e) => setUserData({ ...userData, about: e.target.value })}
          />
        </div>

        <button type="submit" className="primary-button" style={{ width: "100%", fontSize: "1.1rem" }}>
          Update
        </button>
      </form>
    </div>
  );
};

export default EditProfile;
