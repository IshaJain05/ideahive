import React, { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("Student");
  const [department, setDepartment] = useState("");
  const navigate = useNavigate();

  const pesDepartments = [
    "Computer Science & Engineering",
    "Electronics & Communication Engineering",
    "Electrical & Electronics Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Biotechnology",
    "MBA",
    "MCA",
    "BBA",
    "Design",
    "Architecture",
    "Law"
  ];

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (!department) {
      alert("Please select a department.");
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", userCred.user.uid), {
        name,
        email,
        role,
        department
      });
      navigate(role === "Faculty" ? "/faculty-dashboard" : "/student");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        alert("This email is already registered. Please login instead.");
      } else {
        alert("Signup failed: " + err.message);
      }
    }
  };
  console.log("Departments:", pesDepartments);

  return (
    <div
      className="auth-background"
      style={{
        backgroundImage: 'url("/pesbg.jpg")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px 20px"
      }}
    >
      <div className="signup-container">
        <div className="signup-left">
          <img src="/logopes.png" alt="PES Logo" className="signup-logo" />
          <h1>Welcome to IdeaHive</h1>
        </div>

        <div className="signup-right">
          <form className="signup-form" onSubmit={handleSignUp}>
            <h2>Create your account</h2>

            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Role:</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="Student">Student</option>
                <option value="Faculty">Faculty</option>
              </select>
            </div>

            <div className="form-group">
              <label>Department:</label>
              <select
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="">Select Department</option>
                {pesDepartments.map((dept, index) => (
                  <option key={index} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="create-account-button">
              Sign Up
            </button>
          </form>

          <div className="already-have-account">
            <p>Already have an account?</p>
            <button
              onClick={() => navigate("/login")}
              className="login-button"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;