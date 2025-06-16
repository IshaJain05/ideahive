import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import "react-toastify/dist/ReactToastify.css";

const ScheduleInterview = () => {
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchApprovedStudents(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchApprovedStudents = async (facultyUid) => {
    try {
      const approvedRequestsQuery = query(
        collection(db, "projectRequests"),
        where("facultyId", "==", facultyUid),
        where("status", "==", "Approved")
      );
      const approvedSnap = await getDocs(approvedRequestsQuery);
      const approvedStudentIds = approvedSnap.docs.map((doc) => doc.data().studentId);

      if (approvedStudentIds.length === 0) {
        setStudents([]);
        return;
      }

      const studentQuery = query(
        collection(db, "users"),
        where("role", "==", "Student")
      );
      const studentSnap = await getDocs(studentQuery);
      const matchedStudents = studentSnap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((student) => approvedStudentIds.includes(student.id));

      setStudents(matchedStudents);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("❌ Failed to load student list.");
    }
  };

  const sendEmailToStudent = async (studentEmail, studentName, dateTime, meetingLink) => {
    const formattedDate = new Date(dateTime).toLocaleString();
    const emailData = {
      to: studentEmail,
      message: {
        subject: "📅 Interview Scheduled - IdeaHive",
        html: `
          <p>Hello ${studentName || studentEmail},</p>
          <p>You have been scheduled for an interview.</p>
          <p><strong>Date & Time:</strong> ${formattedDate}</p>
          <p><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>
          <p>Regards,<br/>IdeaHive Team</p>
        `,
      },
    };

    try {
      await addDoc(collection(db, "mail"), emailData);
    } catch (err) {
      console.error("❌ Email scheduling failed:", err);
    }
  };

  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    if (!studentId || !dateTime || !meetingLink) {
      toast.error("⚠️ Please fill in all fields");
      return;
    }

    try {
      const studentRef = doc(db, "users", studentId);
      const studentSnap = await getDoc(studentRef);
      const studentData = studentSnap.data();

      await addDoc(collection(db, "interviews"), {
        studentId,
        facultyId: user.uid,
        timestamp: new Date(dateTime),
        link: meetingLink,
      });

      await sendEmailToStudent(
        studentData.email,
        studentData.name,
        dateTime,
        meetingLink
      );

      toast.success("✅ Interview Scheduled & Email Sent!");
      setStudentId("");
      setDateTime("");
      setMeetingLink("");
      navigate("/faculty-dashboard");
    } catch (error) {
      console.error("Interview scheduling failed:", error);
      toast.error("❌ Failed to schedule interview");
    }
  };

  return (
    <div className="page-container">
      <ToastContainer />
      <h1 className="page-title">📅 Schedule an Interview</h1>

      <div style={styles.card}>
        <form onSubmit={handleScheduleInterview}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Select Student</label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
              style={styles.input}
            >
              <option value="">-- Select a Student --</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name || student.email}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Date & Time</label>
            <input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Meeting Link</label>
            <input
              type="url"
              placeholder="Enter Zoom/Google Meet Link"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          <button type="submit" style={styles.button}>
            ✔ Schedule Interview
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  card: {
    maxWidth: "480px",
    margin: "2rem auto",
    padding: "2rem",
    background: "#f0f4ff",
    borderRadius: "12px",
    boxShadow: "0 0 12px rgba(0,0,0,0.1)",
  },
  formGroup: {
    marginBottom: "1rem",
  },
  label: {
    fontWeight: "600",
    marginBottom: "0.5rem",
    display: "block",
  },
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "1rem",
  },
  button: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#1976d2",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontWeight: "bold",
    fontSize: "1rem",
    cursor: "pointer",
    marginTop: "1rem",
  },
};

export default ScheduleInterview;
