import React from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase-config";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";

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
      <div className="admin-main-header">
        <h1>Moderator Dashboard</h1>
        <button className="btn btn-danger" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="admin-cards-row">
        <div onClick={() => navigate("/moderator/flagged")} className="clickable-card">
          <FlaggedContentCard />
        </div>

        <div onClick={() => navigate("/moderator/warnings")} className="clickable-card">
          <WarningMessageCard />
        </div>

        <div onClick={() => navigate("/moderator/auto-moderation")} className="clickable-card">
          <AutoModerationCard />
        </div>
      </div>
    </div>
  );
}

export default ModeratorDashboard;
