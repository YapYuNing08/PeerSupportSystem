import React, { useEffect, useState } from "react";
import { db } from "../../firebase-config";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  orderBy,
  query,
  getDoc
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./AdminNotificationsPage.css";
import { toast } from "react-toastify";

function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(
      collection(db, "adminNotifications"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const list = snapshot.docs.map(d => {
        const data = { id: d.id, ...d.data() };
        console.log("Admin notification data:", data);
        return data;
      });
      setNotifications(list);
    });

    return () => unsubscribe();
  }, []);

  //suspend student: actually suspend
  const handleSuspend = async (notificationId, studentId) => {
    console.log("Suspend called with:", { notificationId, studentId });
    if (!studentId) {
      toast.error("Error: Student ID is missing.");
      return;
    }

    if (!window.confirm("Are you sure you want to SUSPEND this student for 3 days?")) return;

      try {
        // First, verify the student document exists
        const userRef = doc(db, "users", studentId);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          toast.error(`Error: Student with ID "${studentId}" not found in database.`);
          console.error("Student document does not exist:", studentId);
          return;
        }

        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 3);

        await updateDoc(userRef, {
          status: "suspended",
          suspensionEnd: endDate.toISOString()
        });

        //mark notification as handled
        await updateDoc(doc(db, "adminNotifications", notificationId), {
          handled: true
        });

        toast.success("🔴Student has been suspended for 3 days.");
      } catch (error) {
        console.error("Suspend error:", error);
        if (error.code === "not-found") {
          toast.error(`Error: Student ID "${studentId}" not found in database.`);
        } else {
          toast.error(`Error: Failed to suspend student. ${error.message}`);
        }
      }
  };

  //suspend student: dismiss
  const handleDismiss = async (notificationId) => {
    if (!window.confirm("Close this alert without suspending the student?")) return;

    try {
      await updateDoc(doc(db, "adminNotifications", notificationId), {
        handled: true
      });

      toast.info("⚪ Alert dismissed. Student remains active.");
    } catch (error) {
      console.error(error);
    }
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
        Decide weather to suspend students who reached the warning limits.
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
              <div className="button-group">
                <button
                  className="btn-suspend"
                  onClick={() => handleSuspend(n.id, n.studentId || n.userId)}
                >
                  🔴 Suspend (3 Days)
                </button>

                <button
                  className="btn-dismiss"
                  onClick={() => handleDismiss(n.id)}
                >
                  ⚪ Dismiss (No Action)
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default AdminNotificationsPage;