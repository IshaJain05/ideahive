import React, { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "../App.css";

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [selectedRole, setSelectedRole] = useState("All");
  const [selectedDateRange, setSelectedDateRange] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // Real-time listener
  useEffect(() => {
    const q = query(collection(db, "activity_logs"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setLogs(data);
      setFilteredLogs(data);
    });
    return () => unsubscribe();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let filtered = [...logs];

    if (selectedRole !== "All") {
      filtered = filtered.filter((log) => log.userRole === selectedRole.toLowerCase());
    }

    if (selectedDateRange !== "All") {
      const now = new Date();
      filtered = filtered.filter((log) => {
        const ts = log.timestamp?.toDate?.();
        if (!ts) return false;

        if (selectedDateRange === "Today") {
          return ts.toDateString() === now.toDateString();
        }
        if (selectedDateRange === "Last7Days") {
          const lastWeek = new Date();
          lastWeek.setDate(now.getDate() - 7);
          return ts >= lastWeek;
        }
        return true;
      });
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.action?.toLowerCase().includes(term) ||
          log.details?.toLowerCase().includes(term) ||
          log.userRole?.toLowerCase().includes(term)
      );
    }

    setFilteredLogs(filtered);
  }, [logs, selectedRole, selectedDateRange, searchTerm]);

  const handleDownloadPDF = () => {
    if (filteredLogs.length === 0) {
      alert("No activities to export.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Activity Log", 14, 22);

    const tableRows = filteredLogs.map((log) => [
      log.userRole?.toUpperCase() || "-",
      log.action,
      log.details || "-",
      log.timestamp?.toDate()?.toLocaleString() || "-"
    ]);

    doc.autoTable({
      head: [["Role", "Action", "Details", "Time"]],
      body: tableRows,
      startY: 30,
      theme: "striped",
    });

    doc.save("activity_log.pdf");
  };

  return (
    <div className="page-container">
      <h1 className="page-title">📝 Activity Log</h1>

      {/* 🔍 Filters and Search */}
      <div className="filter-container" style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
        <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
          <option value="All">All Roles</option>
          <option value="Student">Student</option>
          <option value="Faculty">Faculty</option>
        </select>
        <select value={selectedDateRange} onChange={(e) => setSelectedDateRange(e.target.value)}>
          <option value="All">All Dates</option>
          <option value="Today">Today</option>
          <option value="Last7Days">Last 7 Days</option>
        </select>
        <input
          type="text"
          placeholder="Search activity..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flexGrow: 1, padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
        />
        <button onClick={handleDownloadPDF} className="primary-button">
          ⬇ Export PDF
        </button>
      </div>

      {/* Activity Cards */}
      <div className="activity-log-list">
        {filteredLogs.length === 0 ? (
          <p className="no-activity">No matching activity found.</p>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="activity-card">
              <div className="activity-role">{log.userRole?.toUpperCase()}</div>
              <div className="activity-action">{log.action}</div>
              {log.details && <div className="activity-details">{log.details}</div>}
              {log.timestamp?.toDate && (
                <div className="activity-time">
                  {log.timestamp.toDate().toLocaleString()}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
