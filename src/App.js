import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";

// Student Pages
import StudentDashboard from "./pages/StudentDashboard";
import AvailableProjects from "./pages/AvailableProjects";
import MyProjects from "./pages/MyProjects";
import TrackTask from "./pages/TrackTask";
import ActivityLog from "./components/ActivityLog";
import UpcomingInterviews from "./pages/UpcomingInterviews";
import EditProfile from "./pages/EditProfile";
import Chat from "./pages/Chat";

// Faculty Pages
import FacultyDashboard from "./pages/FacultyDashboard";
import ScheduleInterview from "./pages/ScheduleInterview";
import ManageRequests from "./pages/ManageRequests";
import AssignTask from "./pages/AssignTask";
import ProjectOverview from "./pages/ProjectOverview";
import InterviewFeedbackSummary from "./pages/InterviewFeedbackSummary";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />

      {/* Student Routes */}
      <Route
        path="/student/*"
        element={
          <ProtectedRoute allowedRoles={["Student"]}>
            <DashboardLayout role="Student" />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="available-projects" element={<AvailableProjects />} />
        <Route path="my-projects" element={<MyProjects />} />
        <Route path="track-task" element={<TrackTask />} />
        <Route path="activity-log" element={<ActivityLog />} />
        <Route path="upcoming-interviews" element={<UpcomingInterviews />} />
        <Route path="edit-profile" element={<EditProfile />} />
        <Route path="chat" element={<Chat />} />
      </Route>

      {/* Faculty Routes */}
      <Route
        path="/faculty/*"
        element={
          <ProtectedRoute allowedRoles={["Faculty"]}>
            <DashboardLayout role="Faculty" />
          </ProtectedRoute>
        }
      >
        <Route index element={<FacultyDashboard />} />
        <Route path="my-projects" element={<MyProjects />} />
        <Route path="schedule-interview" element={<ScheduleInterview />} />
        <Route path="manage-requests" element={<ManageRequests />} />
        <Route path="assign-task" element={<AssignTask />} />
        <Route path="project-overview" element={<ProjectOverview />} />
        <Route path="feedback-summary" element={<InterviewFeedbackSummary />} />
        <Route path="edit-profile" element={<EditProfile />} />
        <Route path="chat" element={<Chat />} />
      </Route>

      <Route
        path="*"
        element={
          <h2 style={{ textAlign: "center", marginTop: "2rem" }}>
            404 - Page Not Found
          </h2>
        }
      />
    </Routes>
  );
};

export default App;
