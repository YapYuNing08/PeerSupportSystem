import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./StudentNavbar.css"; 

function StudentNavbar({ handleLogout }) {
  const location = useLocation();

  return (
    <nav className="side-nav">
      <div className="nav-header">
        <h3>Peer Support System</h3>
      </div>
      
      <ul className="nav-links">
        <li className={location.pathname === "/student-page" ? "active" : ""}>
          <Link to="/student-page">📅 Tracker</Link>
        </li>
        <li className={location.pathname === "/student/analysis" ? "active" : ""}>
          <Link to="/student/analysis">📊 Analysis</Link>
        </li>
        <li className={location.pathname === "/student/counselor-support" ? "active" : ""}>
          <Link to="/student/counselor-support">💬 Counselor</Link>
        </li>
        <li className={location.pathname === "/my-forums" ? "active" : ""}>
          <Link to="/my-forums">📢 Forum</Link>
        </li>
        <li className={location.pathname === "/profile" ? "active" : ""}>
          <Link to="/profile">👤 Profile</Link>
        </li>
      </ul>
    </nav>
  );
}

export default StudentNavbar;