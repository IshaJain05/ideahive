import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const DashboardLayout = ({ role }) => {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar role={role} />
      <div style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Header role={role} />
        <main style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
