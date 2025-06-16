import React from "react";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const Logout = () => {
  const navigate = useNavigate();
  const auth = getAuth(); // Get Firebase Authentication instance

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        // Redirect to login page after successful logout
        navigate("/login");
      })
      .catch((error) => {
        console.error("Error logging out:", error);
      });
  };

  const handleSignUp = () => {
    navigate("/signup"); // Redirect to the signup page
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>You have been logged out.</h1>
      <button onClick={handleLogout}>Log In</button>
      <button onClick={handleSignUp} style={{ marginLeft: "10px" }}>
        Sign Up
      </button>
    </div>
  );
};

export default Logout;
