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
        <li className={location.pathname === "/tracker" ? "active" : ""}>
          <Link to="/student-page">📅 Tracker</Link>
        </li>
        <li className={location.pathname === "/analysis" ? "active" : ""}>
          <Link to="/student/analysis">📊 Analysis</Link>
        </li>
        <li className={location.pathname === "/counselor" ? "active" : ""}>
          <Link to="/counselor">💬 Counselor</Link>
        </li>
        <li className={location.pathname === "/forum" ? "active" : ""}>
          <Link to="/forum">📢 Forum</Link>
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

export default StudentNavbar;