import React, { useEffect, useState } from "react";
import { db } from "../../firebase-config";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  orderBy,
  query
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./AdminNotificationsPage.css";

function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(
      collection(db, "adminNotifications"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const list = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      setNotifications(list);
    });

    return () => unsubscribe();
  }, []);

  const markHandled = async (id) => {
    await updateDoc(doc(db, "adminNotifications", id), {
      handled: true
    });
  };

  return (
    <div className="admin-page-wrapper">
        <button 
          onClick={() => navigate("/admin/admin-dashboard")}
          className="btn btn-sm btn-outline-danger" 
          style={{ marginBottom: "10px", backgroundColor: "white" }}
        >
          ← Back to Dashboard
        </button>
      <h2 className="admin-title">🚨 Admin Alerts</h2>
      <p className="admin-subtitle">
        Students who reached the warning threshold
      </p>

      {notifications.length === 0 ? (
        <div className="empty-state">No notifications.</div>
      ) : (
        notifications.map(n => (
          <div
            key={n.id}
            className={`admin-card ${n.handled ? "handled" : ""}`}
          >
            <div className="card-header">
              <strong>⚠️ Warning Threshold Reached</strong>
              {!n.handled && <span className="badge">NEW</span>}
            </div>

            <div className="card-body">
              <p><strong>Student Username:</strong> {n.username}</p>
              <p><strong>Reason:</strong> {n.reason}</p>
              <p className="timestamp">
                {n.createdAt?.toDate?.().toLocaleString()}
              </p>
            </div>

            {!n.handled && (
              <button
                className="handle-btn"
                onClick={() => markHandled(n.id)}
              >
                Mark as Handled
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default AdminNotificationsPage;
