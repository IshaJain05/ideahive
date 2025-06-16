import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

export const logActivity = async (action, relatedProjectId = null, details = "") => {
  const user = auth.currentUser;
  if (!user) return;

  const logEntry = {
    userId: user.uid,
    userRole: user.email.includes("@pes.edu") ? "faculty" : "student",
    action,
    timestamp: serverTimestamp(),
    relatedProjectId,
    details,
  };

  try {
    await addDoc(collection(db, "activity_logs"), logEntry);
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};
