import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const ProtectedRoute = ({ allowedRoles, children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const docSnap = await getDoc(doc(db, "users", u.uid));
        setRole(docSnap.exists() ? docSnap.data().role : null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (!allowedRoles.includes(role)) return <Navigate to="/" />;

  return children;
};

export default ProtectedRoute;
