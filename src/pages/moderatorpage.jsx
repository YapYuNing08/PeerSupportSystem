import React from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase-config";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";
import "./ModeratorDashboard.css"; // 🔹 Import your CSS file

import FlaggedContentCard from "../components/moderator/FlaggedContentCard";
import WarningMessageCard from "../components/moderator/WarningMessageCard";
import AutoModerationCard from "../components/moderator/AutoModerationCard";

function ModeratorDashboard() {
  const navigate = useNavigate();

  const handleLogout = async () => {
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
      {/* 🔹 Header Section matched to Admin Style */}
      <div className="admin-main-header">
        <h1>Moderator Dashboard</h1>
        <p>Review community flags, issue student warnings, and manage AI filters.</p>
        <button 
          className="btn-outline-secondary" 
          style={{ marginTop: '15px', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', background: 'white' }} 
          onClick={handleLogout}
        >
          Logout Session
        </button>
      </div>

      {/* 🔹 Grid using the Flex Row style */}
      <div className="admin-cards-row">
        <div onClick={() => navigate("/moderator/flagged")} className="admin-card">
          <FlaggedContentCard />
        </div>

        <div onClick={() => navigate("/moderator/warnings")} className="admin-card">
          <WarningMessageCard />
        </div>

        <div onClick={() => navigate("/moderator/auto-moderation")} className="admin-card">
          <AutoModerationCard />
        </div>
      </div>
    </div>
  );
}

export default ModeratorDashboard;