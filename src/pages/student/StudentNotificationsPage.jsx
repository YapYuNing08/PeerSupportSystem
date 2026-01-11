import React, { useEffect, useState } from "react";
import { db, auth } from "../../firebase-config";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import "./StudentNotificationsPage.css"; // 🔹 Import CSS file

function StudentNotificationsPage() {
  const [warnings, setWarnings] = useState([]);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "userWarnings"),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setWarnings(list);
    });

    return () => unsubscribe();
  }, [currentUser]);

  if (!currentUser) return <div className="loader">Please log in to see your notifications.</div>;

  return (
    <div className="page-wrapper">
      <div className="header">
        <h1 className="title">📢 Notifications</h1>
        <p className="subtitle">Important updates regarding your account and community activity.</p>
      </div>

      <div className="list-container">
        {warnings.length === 0 ? (
          <div className="empty-state">
            <div className="icon-circle">✨</div>
            <p className="empty-text">All clear! You don't have any warnings.</p>
            <span className="empty-sub">Keep contributing positively to the community.</span>
          </div>
        ) : (
          warnings.map((w) => (
            <div key={w.id} className="notification-card">
              <div className="card-header">
                <div className="badge-row">
                  <span className="warning-badge">COMMUNITY NOTICE</span>
                  <span className="date-text">
                    {w.createdAt?.toDate?.().toLocaleDateString(undefined, { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>
              </div>

              <div className="message-box">
                <h3 className="msg-title">Action required: {w.type || "Content Update"}</h3>
                <p className="moderator-text">{w.moderatorMessage}</p>
              </div>

              <div className="context-box">
                <span className="context-label">REFERENCED CONTENT</span>
                <p className="content-excerpt">"{w.content || w.contentText || "Content removed"}"</p>
                <div className="reason-row">
                  <strong>Reason:</strong> {w.reason || "Policy violation"}
                </div>
              </div>
              
              <div className="card-footer">
                If you have questions, please contact the support team.
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default StudentNotificationsPage;