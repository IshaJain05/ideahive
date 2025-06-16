import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, "users", userCred.user.uid));
      const role = userDoc?.data()?.role;

      if (role === "Faculty") navigate("/faculty-dashboard");
      else navigate("/student");
    } catch (error) {
      alert("Login failed: " + error.message);
    }
  };

  return (
    <div
      className="auth-background"
      style={{
        backgroundImage: `url(${process.env.PUBLIC_URL}/pesbg.jpg)`,
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
          <form className="signup-form" onSubmit={handleLogin}>
            <h2>Log in to your account</h2>
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
            <button type="submit" className="create-account-button">Log In</button>
          </form>

          <div className="already-have-account">
            <p>Don’t have an account?</p>
            <button className="login-button" onClick={() => navigate("/signup")}>
              Create New Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
