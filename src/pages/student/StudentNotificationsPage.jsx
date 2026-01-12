import React, { useEffect, useState } from "react";
import { db, auth } from "../../firebase-config";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import "./StudentNotificationsPage.css"; // 🔹 Import CSS file

function StudentNotificationsPage() {
  const [warnings, setWarnings] = useState([]);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "userWarnings"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort by date (newest first)
      const sorted = list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setWarnings(sorted);
    });

    return () => unsubscribe();
  }, [currentUser]);

  if (!currentUser) return <div className="loader">Please log in to see your notifications.</div>;

  return (
    <div className="page-wrapper">
      <div className="header">
        <h2 className="title">📢 Notifications</h2>
        <p className="subtitle">Important updates regarding your posts and community conduct.</p>
      </div>

      <div className="list-container">
        {warnings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✨</div>
            <p>No warnings yet. Your account is in good standing!</p>
          </div>
        ) : (
          warnings.map(w => (
            <div key={w.id} className="notif-card">
              <div className="card-header">
                <div className="badge-row">
                  <span className="type-badge">{w.type?.toUpperCase() || "NOTICE"}</span>
                  {!w.read && <span className="new-dot">NEW</span>}
                </div>
                <span className="timestamp">
                  {w.createdAt?.toDate?.().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) || ""}
                </span>
              </div>

              <div className="reason-row">
                <strong className="reason-label">Issue:</strong> {w.reason || "Under Review"}
              </div>

              <div className="moderator-box">
                <p className="message-text">{w.moderatorMessage || "Your content has been flagged for a community guidelines violation."}</p>
              </div>

              {(w.content || w.contentText) && (
                <div className="content-review">
                  <span className="small-label">AFFECTED CONTENT</span>
                  <p className="flagged-text">"{w.content || w.contentText}"</p>
                </div>
              )}

              <div className="card-footer">
                <span className="footer-note">Please review our Community Guidelines for more info.</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default StudentNotificationsPage;