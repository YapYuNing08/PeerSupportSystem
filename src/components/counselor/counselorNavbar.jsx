import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./counselorNavbar.css";

function CounselorNavbar({ handleLogout }) {
  const location = useLocation();

  return (
    <nav className="side-nav">
      <div className="nav-header">
        <h2>PeerSupportSystem</h2>
      </div>
      
      <ul className="nav-links">
        <li className={location.pathname === "/chat" ? "active" : ""}>
          <Link to="/chat">💬 Chat</Link>
        </li>
        <li className={location.pathname === "/notes" ? "active" : ""}>
          <Link to="/notes">✨ Notes</Link>
        </li>
        <li className={location.pathname === "/profile" ? "active" : ""}>
          <Link to="/profile">👤 Profile</Link>
        </li>
      </ul>

      <div className="nav-footer">
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}

export default CounselorNavbar;