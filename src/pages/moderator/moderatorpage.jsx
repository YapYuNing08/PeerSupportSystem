import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase-config";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";
import "./ModeratorDashboard.css"; 

import FlaggedContentCard from "../../components/moderator/FlaggedContentCard";
import WarningMessageCard from "../../components/moderator/WarningMessageCard";
import AutoModerationCard from "../../components/moderator/AutoModerationCard";

function ModeratorDashboard() {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = () => setShowLogoutConfirm(true);

  const confirmLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
      navigate("/login");
    } catch {
      toast.error("Logout failed");
    }
  };

  return (
    <div className="admin-dashboard-container">
      <div className="admin-main-header">
        <h1>Moderator Dashboard</h1>
        <p>Review forum flags, issue student warnings, and manage AI filters.</p>
        <button 
          className="btn-outline-secondary" 
          style={{ marginTop: '15px', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', background: 'white' }} 
          onClick={handleLogoutClick}
        >
          Logout Session
        </button>
      </div>

      <div className="admin-cards-row">
        <div onClick={() => navigate("/moderator/flagged")} >
          <FlaggedContentCard />
        </div>

        <div onClick={() => navigate("/moderator/warnings")} >
          <WarningMessageCard />
        </div>

        <div onClick={() => navigate("/moderator/auto-moderation")} >
          <AutoModerationCard />
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

export default ModeratorDashboard;