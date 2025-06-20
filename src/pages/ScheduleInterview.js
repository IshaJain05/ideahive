import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  addDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ScheduleInterview = () => {
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        await fetchApprovedStudents(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchApprovedStudents = async (facultyUid) => {
    try {
      setLoading(true);

      // Step 1: Get all projectIds created by this faculty
      const projectSnap = await getDocs(
        query(collection(db, "projects"), where("facultyId", "==", facultyUid))
      );
      const projectIds = projectSnap.docs.map(doc => doc.id);
      if (projectIds.length === 0) return setStudents([]);

      // Step 2: Get approved project requests for those projects
      const requestSnap = await getDocs(
        query(collection(db, "projectRequests"), where("status", "==", "Approved"))
      );
      const approvedStudentIds = requestSnap.docs
        .filter(req => projectIds.includes(req.data().projectId))
        .map(req => req.data().studentId);

      if (approvedStudentIds.length === 0) return setStudents([]);

      // Step 3: Get student details
      const usersSnap = await getDocs(
        query(collection(db, "users"), where("role", "==", "Student"))
      );
      const matchedStudents = usersSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(s => approvedStudentIds.includes(s.id));

      setStudents(matchedStudents);
    } catch (err) {
      console.error("❌ Error loading approved students:", err);
      toast.error("Error loading students.");
    } finally {
      setLoading(false);
    }
  };

  const sendEmailToStudent = async (studentEmail, studentName, dateTime, link) => {
    const formattedDate = new Date(dateTime).toLocaleString();
    const emailData = {
      to: studentEmail,
      message: {
        subject: "📅 Interview Scheduled - IdeaHive",
        html: `
          <p>Dear ${studentName},</p>
          <p>You have been scheduled for an interview.</p>
          <p><strong>Date & Time:</strong> ${formattedDate}</p>
          <p><strong>Meeting Link:</strong> <a href="${link}">${link}</a></p>
          <p>Regards,<br/>IdeaHive Team</p>
        `
      }
    };
    await addDoc(collection(db, "mail"), emailData);
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    if (!studentId || !dateTime || !meetingLink) {
      toast.error("⚠️ Please fill in all fields");
      return;
    }

    try {
      const user = auth.currentUser;
      const studentRef = doc(db, "users", studentId);
      const studentSnap = await getDoc(studentRef);
      const student = studentSnap.data();

      await addDoc(collection(db, "interviews"), {
        facultyId: user.uid,
        studentId,
        timestamp: new Date(dateTime),
        link: meetingLink,
      });

      await sendEmailToStudent(student.email, student.name || "Student", dateTime, meetingLink);

      toast.success("✅ Interview scheduled & email sent!");
      setStudentId("");
      setDateTime("");
      setMeetingLink("");
      navigate("/faculty-dashboard");
    } catch (err) {
      console.error("❌ Scheduling failed:", err);
      toast.error("Interview scheduling failed");
    }
  };

  return (
    <div className="page-container">
      <ToastContainer />
      <h1 className="page-title">📅 Schedule an Interview</h1>

      <div className="card" style={{ maxWidth: "500px", margin: "auto" }}>
        {loading ? (
          <p>Loading approved students...</p>
        ) : students.length === 0 ? (
          <p style={{ textAlign: "center", fontStyle: "italic" }}>
            No approved students available.
          </p>
        ) : (
          <form onSubmit={handleSchedule} className="auth-form">
            <div className="form-group">
              <label>Select Student</label>
              <select value={studentId} onChange={(e) => setStudentId(e.target.value)} required>
                <option value="">-- Select a Student --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name || s.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Date & Time</label>
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Meeting Link</label>
              <input
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="Zoom/Google Meet"
                required
              />
            </div>

            <button className="primary-button" type="submit">
              ✔ Schedule Interview
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ScheduleInterview;
