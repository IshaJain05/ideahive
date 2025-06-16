const {onDocumentCreated, onDocumentUpdated} =
require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// Email transporter using Firebase secrets
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Utility function to send email
const sendEmail = async (recipient, subject, text) => {
  const mailOptions = {
    from: "IdeaHive <no-reply@ideahive.com>",
    to: recipient,
    subject,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${recipient}`);
  } catch (error) {
    console.error(`❌ Failed to send email:`, error);
  }
};

// Interview Notification Trigger
exports.sendInterviewNotification = onDocumentCreated(
    {
      document: "interviews/{interviewId}",
      region: "asia-south1",
      secrets: ["EMAIL_USER", "EMAIL_PASS"],
    },
    async (event) => {
      const interview = event.data.data();
      const studentRef = db.collection("users").doc(interview.studentId);
      const studentSnap = await studentRef.get();

      if (!studentSnap.exists) return;

      const student = studentSnap.data();
      const subject = "Interview Scheduled";
      const message = `Dear ${student.name},

Your interview is scheduled on ${new Date(interview.dateTime).toLocaleString()}.
Meeting Link: ${interview.meetingLink}

Best,
IdeaHive Team`;

      return sendEmail(student.email, subject, message);
    });

// Task Assigned Notification Trigger
exports.sendTaskNotification = onDocumentCreated({
  document: "tasks/{taskId}",
  region: "asia-south1",
  secrets: ["EMAIL_USER", "EMAIL_PASS"],
},
async (event) => {
  const task = event.data.data();
  const studentRef = db.collection("users").doc(task.studentId);
  const studentSnap = await studentRef.get();

  if (!studentSnap.exists) return;

  const student = studentSnap.data();
  const subject = "New Task Assigned";
  const message = `Dear ${student.name},

You have a new task: "${task.taskName}".
Deadline: ${new Date(task.deadline).toLocaleString()}

Best,
IdeaHive Team`;

  return sendEmail(student.email, subject, message);
});

// Overdue Task Alert Trigger
exports.sendOverdueTaskNotification = onDocumentUpdated({
  document: "tasks/{taskId}",
  region: "asia-south1",
  secrets: ["EMAIL_USER", "EMAIL_PASS"],
},
async (event) => {
  const newTask = event.data.after.data();
  if (newTask.status === "Completed") return;
  const deadline = new Date(newTask.deadline);
  const now = new Date();
  const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

  if (daysLeft <= 0) {
    const studentRef = db.collection("users").doc(newTask.studentId);
    const studentSnap = await studentRef.get();
    if (!studentSnap.exists) return;

    const student = studentSnap.data();
    const subject = "⏳ Overdue Task Alert";
    const message = `Dear ${student.name},

Your task "${newTask.taskName}" is overdue.
Please complete it as soon as possible.

Best,
IdeaHive Team`;
    return sendEmail(student.email, subject, message);
  }

  return null;
},
);
