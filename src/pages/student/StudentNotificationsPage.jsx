import React, { useEffect, useState } from "react";
import { db, auth } from "../../firebase-config";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import "./StudentNotificationsPage.css"; 
import StudentLayout from "../../components/layout/StudentLayout"; 

function StudentNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "notifications"),
      where("targetRole", "==", "student"),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort by date (newest first)
      const sorted = list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setNotifications(sorted);
    });

    return () => unsubscribe();
  }, [currentUser]);

  if (!currentUser) return <div className="loader">Please log in to see your notifications.</div>;

  const getBadge = (type) => {
    const t = (type || "").toLowerCase();
    if (t === "warning") return "WARNING";
    if (t === "suspend") return "SUSPENDED";
    if (t === "reactivate") return "REACTIVATED";
    return "NOTICE";
  };

  return (
    <StudentLayout>
    <div className="page-wrapper">
      <div className="header">
        <h2 className="title">📢 Notifications</h2>
        <p className="subtitle">Important updates regarding your posts and forum conduct.</p>
      </div>

      <div className="list-container">
        {notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✨</div>
            <p>No notifications yet.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="notif-card">
              <div className="card-header">
                <div className="badge-row">
                  <span className="type-badge">{getBadge(n.type)}</span>
                  {n.read === false && <span className="new-dot">NEW</span>}
                </div>
                <span className="timestamp">
                  {n.createdAt?.toDate?.().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) || ""}
                </span>
              </div>

              {n.reason && (
                <div className="reason-row">
                  <strong className="reason-label">Issue:</strong> {n.reason}
                </div>
              )}

              <div className="moderator-box">
                <p className="message-text">{n.message || "No message."}</p>
              </div>

              {n.meta?.suspensionEnd && (
                <div className="content-review">
                  <span className="small-label">SUSPENSION ENDS</span>
                  <p className="flagged-text">
                    {new Date(n.meta.suspensionEnd).toLocaleString()}
                  </p>
                </div>
              )}

              {n.content && (
                <div className="content-review">
                  <span className="small-label">AFFECTED CONTENT</span>
                  <p className="flagged-text">"{n.content}"</p>
                </div>
              )}

              <div className="card-footer">
                <span className="footer-note">Please review our Forum Guidelines for more info.</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
    </StudentLayout>
  );
}

export default StudentNotificationsPage;