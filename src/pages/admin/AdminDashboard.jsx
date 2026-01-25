import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import { auth } from "../../firebase-config";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";

import PendingApprovalCard from "../../components/admin/PendingApprovalcard";
import CounselorListCard from "../../components/admin/counselorlistcard";
import AddModerator from "../../components/admin/addModeratorcard";

import { getOpenIssues } from "../../models/TechnicalIssue";
import { db } from "../../firebase-config";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [issues, setIssues] = useState([]);
  const [suspendedCount, setSuspendedCount] = useState(0);
  const navigate = useNavigate(); 
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

  useEffect(() => {
    // Listen for suspended students count
    const q = query(
      collection(db, "users"),
      where("status", "==", "suspended")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSuspendedCount(snapshot.size);
    });

    return () => unsubscribe();
  }, []);

  const handleLogoutClick = () => setShowLogoutConfirm(true);

  const confirmLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
      window.location.href = "/login";
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  return (
    <div className="admin-dashboard-container">
      <div className="admin-main-header">
        <h1>Admin Dashboard</h1>
        <button className="btn btn-danger" onClick={handleLogoutClick}>Logout</button>
      </div>

      <div className="admin-cards-row">
        <PendingApprovalCard />
        <CounselorListCard />
        <AddModerator/>

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

        <div
          className="admin-card"
          onClick={() => navigate("/admin/create-forum")}
          style={{ cursor: "pointer" }}
        >
          <div className="card-icon">📢</div>
          <div className="card-info text-center">
            <h3>+</h3>
            <p>CREATE FORUM</p>
          </div>
        </div>
      
        <div
            className="admin-card"
            onClick={() => navigate("/admin/notifications")}
            style={{ cursor: "pointer" }}
          >
            <div className="card-icon">🚨</div>
            <div className="card-info text-center">
              <h3>!</h3>
              <p>ALERT</p>
            </div>
          </div>

        <div
            className="admin-card"
            onClick={() => navigate("/admin/suspended-students")}
            style={{ cursor: "pointer" }}
          >
            <div className="card-icon">🔴</div>
            <div className="card-info text-center">
              <h3>{suspendedCount}</h3>
              <p>SUSPENDED STUDENTS</p>
            </div>
          </div>
        </div>

      {showLogoutConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Log Out</h3>
            <p>Are you sure you want to log out?</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
              <button className="btn-confirm-logout" onClick={confirmLogout}>Yes, Log Out</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminDashboard;
