import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminUserLister from "./pages/AdminUserLister";

import AdminDashboard from "./pages/AdminDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import EditProfile from "./pages/EditProfile";
import './App.css';
import MyProjects from "./pages/MyProjects";
import UpcomingInterviews from "./pages/UpcomingInterviews";
//import ResearchDomain from "./pages/ResearchDomain";
import FacultyConnect from "./pages/FacultyConnect";
import TrackTask from "./pages/TrackTask";
import AssignTask from "./pages/AssignTask";
import ScheduleInterview from "./pages/ScheduleInterview";
import ScheduledInterview from "./pages/ScheduledInterview";
import Chat from "./pages/Chat";
import JoinProject from "./pages/JoinProject";
import ManageRequests from "./pages/ManageRequests";
import AvailableProjects from "./pages/AvailableProjects";
import TrackProgress from "./pages/TrackProgress";
import ProjectOverview from "./pages/ProjectOverview";
import ActivityLog from "./components/ActivityLog";
import FacultyTrackTasks from "./pages/FacultyTrackTasks";
import StudentPerformance from "./pages/StudentPerformance";
import InterviewFeedbackSummary from "./pages/InterviewFeedbackSummary";
import FacultyTasksOverview from "./components/FacultyTasksOverview";



const App = () => {
    return (
            <Routes>
                {/* Redirect to SignUp by default */}
                <Route path="/" element={<Navigate to="/signup" />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/faculty" element={<FacultyDashboard />} />
                <Route path="/student" element={<StudentDashboard />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/edit-profile" element={<EditProfile />} />
                <Route path="/my-projects" element={<MyProjects />} />
                <Route path="/upcoming-interviews" element={<UpcomingInterviews />} />
                <Route path="/faculty-connect" element={<FacultyConnect />} />
                <Route path="/faculty-dashboard" element={<FacultyDashboard />} />
                <Route path="/track-task" element={<TrackTask />} />
                <Route path="/assign-task" element={<AssignTask />} />
                <Route path="/schedule-interview" element={<ScheduleInterview />} />
                <Route path="/scheduled-interview" element={<ScheduledInterview />} />
                <Route path="/chat/:receiverId" element={<Chat />} />
                <Route path="/join-project" element={<JoinProject />} />
                <Route path="/manage-requests" element={<ManageRequests />} />
                <Route path="/available-projects" element={<AvailableProjects />} />
                <Route path="/track-progress" element={<TrackProgress />} />
                <Route path="/project/:projectId" element={<ProjectOverview />} />
                <Route path="/activity-log" element={<ActivityLog />} />
                <Route path="/track-assigned-tasks" element={<FacultyTrackTasks />} />
                <Route path="/student-performance" element={<StudentPerformance />} />
                <Route path="/interview-feedback-summary" element={<InterviewFeedbackSummary />} />
                <Route path="/project/:projectId" element={<ProjectOverview />} />
                <Route path="/faculty-tasks" element={<FacultyTasksOverview />} />
                <Route path="/admin-users" element={<AdminUserLister />} />


                {/* Redirect to SignUp for any other route */}


            </Routes>
    );
};

export default App;
