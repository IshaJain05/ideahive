import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
  addDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ManageRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const facultyId = auth.currentUser?.uid;

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const q = query(collection(db, "projectRequests"), where("status", "==", "Pending"));
        const snapshot = await getDocs(q);
        const allRequests = [];

        for (let docSnap of snapshot.docs) {
          const data = docSnap.data();

          const projectRef = doc(db, "projects", data.projectId);
          const projectSnap = await getDoc(projectRef);
          if (!projectSnap.exists() || projectSnap.data().facultyId !== facultyId) continue;

          const studentRef = doc(db, "users", data.studentId);
          const studentSnap = await getDoc(studentRef);
          const studentData = studentSnap.exists() ? studentSnap.data() : { name: "Unknown", email: "" };

          allRequests.push({
            id: docSnap.id,
            studentName: studentData.name || studentData.email,
            studentEmail: studentData.email,
            studentId: data.studentId,
            studentInfo: studentData,
            projectId: data.projectId,
            projectTitle: projectSnap.data().title,
          });
        }

        setRequests(allRequests);
      } catch (err) {
        console.error("Error fetching requests:", err);
        toast.error("❌ Failed to load join requests.");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [facultyId]);

  const handleApprove = async (request) => {
    try {
      const projectRef = doc(db, "projects", request.projectId);
      const projectSnap = await getDoc(projectRef);

      if (!projectSnap.exists()) {
        toast.error("❌ Project not found.");
        return;
      }

      // 🔒 Ensure members array exists
      //const projectData = projectSnap.data();
      //const existingMembers = projectData.members || [];

      // ✅ Add student to project members
      await updateDoc(projectRef, {
        members: arrayUnion(request.studentId),
      });

      // ✅ Update project request
      await updateDoc(doc(db, "projectRequests", request.id), {
        status: "Approved",
        approvedAt: new Date(),
      });

      // ✅ Notification
      await addDoc(collection(db, "notifications"), {
        to: request.studentId,
        message: `🎉 Your request to join "${request.projectTitle}" was approved.`,
        type: "joinRequestApproved",
        timestamp: new Date(),
        read: false,
      });

      // ✅ Email
      await addDoc(collection(db, "mail"), {
        to: request.studentEmail,
        message: {
          subject: `You're approved to join "${request.projectTitle}"!`,
          html: `
            <p>Hello ${request.studentName},</p>
            <p>Your join request to <strong>${request.projectTitle}</strong> has been approved.</p>
            <p>You can now access all features inside the IdeaHive platform.</p>
            <p>Best,<br/>IdeaHive Team</p>
          `,
        },
      });

      toast.success("✅ Student approved and notified!");
      setRequests(prev => prev.filter(r => r.id !== request.id));
    } catch (err) {
      console.error("❌ Approve Error:", err.message, err);
      toast.error("❌ Failed to approve request.");
    }
  };

  const handleReject = async (request) => {
    try {
      await updateDoc(doc(db, "projectRequests", request.id), {
        status: "Rejected",
      });

      toast.info(`❌ Rejected ${request.studentName}`);
      setRequests(prev => prev.filter(r => r.id !== request.id));
    } catch (err) {
      console.error("Reject Error:", err);
      toast.error("❌ Failed to reject request.");
    }
  };

  return (
    <div className="page-container">
      <ToastContainer />
      <h2>📋 Manage Join Requests</h2>

      {loading ? (
        <p>Loading requests...</p>
      ) : requests.length === 0 ? (
        <p>No pending join requests.</p>
      ) : (
        <ul className="request-list">
          {requests.map((req) => (
            <li key={req.id} className="request-item" style={styles.requestCard}>
              <p>
                <strong>{req.studentName}</strong> requested to join{" "}
                <em>{req.projectTitle}</em>
              </p>
              {req.studentEmail && <p>📧 {req.studentEmail}</p>}
              <div className="actions" style={styles.actions}>
                <button style={styles.profileBtn} onClick={() => setSelectedStudent(req)}>
                  👤 View Profile
                </button>
                <button style={styles.approveBtn} onClick={() => handleApprove(req)}>
                  ✅ Approve
                </button>
                <button style={styles.rejectBtn} onClick={() => handleReject(req)}>
                  ❌ Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {selectedStudent && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3>👤 Student Profile</h3>
            <p><strong>Name:</strong> {selectedStudent.studentInfo.name || selectedStudent.studentEmail}</p>
            <p><strong>Email:</strong> {selectedStudent.studentEmail}</p>
            {selectedStudent.studentInfo.department && (
              <p><strong>Department:</strong> {selectedStudent.studentInfo.department}</p>
            )}
            {selectedStudent.studentInfo.bio && (
              <p><strong>About:</strong> {selectedStudent.studentInfo.bio}</p>
            )}
            <button style={styles.closeBtn} onClick={() => setSelectedStudent(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  requestCard: {
    background: "#f9f9f9",
    padding: "1rem",
    borderRadius: "10px",
    marginBottom: "1rem",
    boxShadow: "0 0 4px rgba(0,0,0,0.05)",
  },
  actions: {
    marginTop: "10px",
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  approveBtn: {
    background: "#2e7d32",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  rejectBtn: {
    background: "#c62828",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  profileBtn: {
    background: "#1976d2",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  modal: {
    background: "white",
    padding: "2rem",
    borderRadius: "12px",
    width: "400px",
    maxWidth: "90%",
    boxShadow: "0 0 10px rgba(0,0,0,0.2)",
  },
  closeBtn: {
    marginTop: "1rem",
    background: "#aaa",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  },
};

export default ManageRequests;
