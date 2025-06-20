import React from "react";
import { NavLink } from "react-router-dom";

const Sidebar = ({ role }) => {
  return (
    <div className="sidebar">
      <h2>IdeaHive</h2>

      {/* Student Sidebar */}
      {role === "Student" && (
        <>
          <NavLink to="/student" end>Dashboard</NavLink>
          <NavLink to="/student/track-task">Tasks</NavLink>
          <NavLink to="/student/upcoming-interviews">Interviews</NavLink>
          <NavLink to="/student/available-projects">Explore Projects</NavLink>
          <NavLink to="/student/my-projects">My Projects</NavLink>
          <NavLink to="/student/activity-log">Activity Log</NavLink>
          <NavLink to="/student/edit-profile">Edit Profile</NavLink>
        </>
      )}

      {/* Faculty Sidebar */}
      {role === "Faculty" && (
        <>
          <NavLink to="/faculty" end>Dashboard</NavLink>
          <NavLink to="/faculty/my-projects">My Projects</NavLink>
          <NavLink to="/faculty/schedule-interview">Schedule Interview</NavLink>
          <NavLink to="/faculty/manage-requests">Manage Requests</NavLink>
          <NavLink to="/faculty/assign-task">Assign Tasks</NavLink>
          <NavLink to="/faculty/project-overview">Project Overview</NavLink>
          <NavLink to="/faculty/feedback-summary">Interview Feedback</NavLink>
          <NavLink to="/faculty/edit-profile">Edit Profile</NavLink>
        </>
      )}
    </div>
  );
};

export default Sidebar;
