import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./StudentNavbar.css"; 
import { auth, db } from "../../firebase-config";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, orderBy, query, where, getDocs } from "firebase/firestore";
import { format, startOfMonth, endOfMonth, getDate } from "date-fns";

function StudentNavbar({ handleLogout }) {
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasAnalysisAlert, setHasAnalysisAlert] = useState(false);
  const INTERVENTION_DISMISSED_KEY = "moodInterventionDismissed";

  useEffect(() => {
    let unsubNotifications = null;
    let moodCheckInterval = null;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      // Clean up old listeners when user changes/logs out
      if (unsubNotifications) {
        unsubNotifications();
        unsubNotifications = null;
      }
      if (moodCheckInterval) {
        clearInterval(moodCheckInterval);
        moodCheckInterval = null;
      }

      if (!user) {
        setUnreadCount(0);
        setHasAnalysisAlert(false);
        return;
      }

      const q = query(
        collection(db, "notifications"),
        where("targetRole", "==", "student"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      unsubNotifications = onSnapshot(q, (snap) => {
        // treat missing "read" as unread (backwards compatible)
        const unread = snap.docs.reduce((acc, d) => {
          const data = d.data();
          return data.read === true ? acc : acc + 1;
        }, 0);
        setUnreadCount(unread);
      });

      // check for mood intervention alert
      const checkMoodAlert = async () => {
        try {
          const currentDate = new Date();
          const start = startOfMonth(currentDate);
          const end = endOfMonth(currentDate);
          const startStr = format(start, "yyyy-MM-01");
          const endStr = format(end, "yyyy-MM-31");

          const moodQuery = query(
            collection(db, "mood_logs"),
            where("userId", "==", user.uid),
            where("date", ">=", startStr),
            where("date", "<=", endStr),
            orderBy("date", "asc")
          );

          const moodSnapshot = await getDocs(moodQuery);
          const dailyLatest = {};

          moodSnapshot.forEach((doc) => {
            const data = doc.data();
            const dayOfMonth = getDate(new Date(data.date));
            dailyLatest[dayOfMonth] = data.mood;
          });

          const uniqueLogs = Object.keys(dailyLatest).map((day) => ({
            day: Number(day),
            mood: dailyLatest[day],
          }));

          const recentLogs = uniqueLogs.slice(-7);
          let recentNegatives = 0;
          recentLogs.forEach((log) => {
            if (log.mood <= 2) recentNegatives++;
          });

          const isRecentCrisis =
            recentLogs.length >= 7 &&
            recentNegatives / recentLogs.length >= 0.5;

          const dismissed = localStorage.getItem(INTERVENTION_DISMISSED_KEY) === "true";
          setHasAnalysisAlert(isRecentCrisis && !dismissed);
        } catch (error) {
          console.error("Error checking mood alert:", error);
          setHasAnalysisAlert(false);
        }
      };

      checkMoodAlert();
      // re-check every 30 seconds to catch new mood logs
      moodCheckInterval = setInterval(checkMoodAlert, 30000);
    });

    return () => {
      if (unsubNotifications) unsubNotifications();
      if (moodCheckInterval) clearInterval(moodCheckInterval);
      unsubAuth();
    };
  }, []);

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
          <Link to="/student/analysis">
            <span className="nav-link-text">📊 Analysis</span>
            {hasAnalysisAlert && (
              <span className="nav-alert-badge">!</span>
            )}
          </Link>
        </li>
        <li className={location.pathname === "/student/counselor-support" ? "active" : ""}>
          <Link to="/student/counselor-support">💬 Counselor</Link>
        </li>
        <li className={location.pathname === "/my-forums" ? "active" : ""}>
          <Link to="/my-forums">📢 Forum</Link>
        </li>
        <li className={location.pathname === "/profile" ? "active" : ""}>
          <Link to="/profile">
            <span className="nav-link-text">👤 Profile</span>
            {unreadCount > 0 && (
              <span className="nav-notif-badge">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
        </li>
      </ul>
    </nav>
  );
}

export default StudentNavbar;