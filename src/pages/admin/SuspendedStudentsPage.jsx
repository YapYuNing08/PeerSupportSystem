import React, { useEffect, useState } from "react";
import { db } from "../../firebase-config";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  query,
  where,
  getDoc
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./AdminNotificationsPage.css";
import { toast } from "react-toastify";

function SuspendedStudentsPage() {
  const [suspendedStudents, setSuspendedStudents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // query for all suspended students
    const q = query(
      collection(db, "users"),
      where("status", "==", "suspended")
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const list = snapshot.docs.map(d => {
        const data = { id: d.id, ...d.data() };
        return data;
      });
      setSuspendedStudents(list);
    });

    return () => unsubscribe();
  }, []);

  // adjust suspension days for a specific student
  const adjustSuspensionDays = async (studentId, delta) => {
    try {
      const userRef = doc(db, "users", studentId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        toast.error("Student not found.");
        return;
      }

      const userData = userSnap.data();
      const currentEndDate = new Date(userData.suspensionEnd);
      const today = new Date();
      
      // calculate remaining days
      const remainingDays = Math.ceil((currentEndDate - today) / (1000 * 60 * 60 * 24));
      const newRemainingDays = remainingDays + delta;

      // prevent negative days (can't extend past today)
      if (newRemainingDays < 0) {
        toast.error("Cannot reduce suspension below 0 days.");
        return;
      }

      // update suspension end date
      const newEndDate = new Date();
      newEndDate.setDate(newEndDate.getDate() + newRemainingDays);

      await updateDoc(userRef, {
        suspensionEnd: newEndDate.toISOString()
      });

      const action = delta > 0 ? "extended" : "reduced";
      const daysText = Math.abs(delta) === 1 ? "day" : "days";
      toast.success(`Suspension ${action} by ${Math.abs(delta)} ${daysText}.`);
    } catch (error) {
      console.error("Error adjusting suspension:", error);
      toast.error(`Failed to adjust suspension: ${error.message}`);
    }
  };

  // calculate remaining suspension days
  const getRemainingDays = (suspensionEnd) => {
    const endDate = new Date(suspensionEnd);
    const today = new Date();
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
      <h2 className="admin-title">🔴 Suspended Students</h2>
      <p className="admin-subtitle">
        Manage and adjust suspension periods for suspended students.
      </p>

      {suspendedStudents.length === 0 ? (
        <div className="empty-state">No suspended students.</div>
      ) : (
        suspendedStudents.map(student => {
          const remainingDays = getRemainingDays(student.suspensionEnd);
          return (
            <div key={student.id} className="admin-card">
              <div className="card-header">
                <strong>🔴 Suspended Student</strong>
                <span className="badge" style={{ backgroundColor: "#dc2626" }}>
                  {remainingDays} {remainingDays === 1 ? "day" : "days"} remaining
                </span>
              </div>

              <div className="card-body">
                <p><strong>Username:</strong> {student.username || "N/A"}</p>
                <p><strong>Name:</strong> {student.name || "N/A"}</p>
                <p><strong>Email:</strong> {student.email || "N/A"}</p>
                <p><strong>Suspension Ends:</strong> {formatDate(student.suspensionEnd)}</p>
                <p className="timestamp">
                  Suspended until: {new Date(student.suspensionEnd).toLocaleDateString()}
                </p>
              </div>

              <div className="button-group" style={{ flexDirection: "column", gap: "10px" }}>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "10px", 
                  justifyContent: "center",
                  marginBottom: "10px"
                }}>
                  <label style={{ fontWeight: "500", fontSize: "14px" }}>Adjust Suspension:</label>
                  <button
                    type="button"
                    onClick={() => adjustSuspensionDays(student.id, -1)}
                    disabled={remainingDays <= 0}
                    style={{
                      width: "35px",
                      height: "35px",
                      borderRadius: "5px",
                      border: "1px solid #ddd",
                      backgroundColor: remainingDays <= 0 ? "#f0f0f0" : "#fff",
                      cursor: remainingDays <= 0 ? "not-allowed" : "pointer",
                      fontSize: "20px",
                      fontWeight: "bold",
                      color: "#dc2626"
                    }}
                    title="Reduce by 1 day"
                  >
                    −
                  </button>
                  <span style={{ 
                    minWidth: "50px", 
                    textAlign: "center", 
                    fontWeight: "bold",
                    fontSize: "16px"
                  }}>
                    {remainingDays} {remainingDays === 1 ? "day" : "days"}
                  </span>
                  <button
                    type="button"
                    onClick={() => adjustSuspensionDays(student.id, 1)}
                    style={{
                      width: "35px",
                      height: "35px",
                      borderRadius: "5px",
                      border: "1px solid #ddd",
                      backgroundColor: "#fff",
                      cursor: "pointer",
                      fontSize: "20px",
                      fontWeight: "bold",
                      color: "#2563eb"
                    }}
                    title="Add 1 day"
                  >
                    +
                  </button>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    className="btn-suspend"
                    onClick={() => adjustSuspensionDays(student.id, -7)}
                    disabled={remainingDays < 7}
                    style={{
                      flex: 1,
                      opacity: remainingDays < 7 ? 0.5 : 1,
                      cursor: remainingDays < 7 ? "not-allowed" : "pointer"
                    }}
                  >
                    −7 Days
                  </button>
                  <button
                    className="btn-suspend"
                    onClick={() => adjustSuspensionDays(student.id, 7)}
                    style={{ flex: 1 }}
                  >
                    +7 Days
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default SuspendedStudentsPage;
