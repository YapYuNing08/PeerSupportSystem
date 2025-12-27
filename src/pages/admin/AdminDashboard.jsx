import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import { auth } from "../../firebase-config";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";

import PendingApprovalCard from "../../components/admin/PendingApprovalcard";
import CounselorListCard from "../../components/admin/counselorlistcard";
import ReportCard from "../../components/admin/reportcard";

import { getOpenIssues } from "../../models/TechnicalIssue";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [issues, setIssues] = useState([]);
  const navigate = useNavigate(); 

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const issuesData = await getOpenIssues();
        setIssues(issuesData);
      } catch (error) {
        console.error("Error fetching issues: ", error);
      }
    };
    fetchIssues();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
      window.location.href = "/login";
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  return (
    <div className="admin-dashboard-container">
      <div className="admin-main-header">
        <h1>Admin Dashboard</h1>
        <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
      </div>

      <div className="admin-cards-row">
        <PendingApprovalCard />
        <CounselorListCard />
        <ReportCard />

        <div 
          className="admin-card"
          onClick={() => navigate("/admin/technical-issues")} 
          style={{ cursor: "pointer" }}
        >
          <div className="card-icon">🛠️</div>
          <div className="card-info text-center">

            <h3>{issues.length}</h3>
            <p>TECHNICAL ISSUES</p>
          </div>
        </div>
      </div>

    </div>
  );
}

export default AdminDashboard;