import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase-config";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom"; // To navigate when clicking cards
import { signOut, onAuthStateChanged } from "firebase/auth";
import { toast } from "react-toastify";

function AdminDashboard() {
  const [pendingCount, setPendingCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const getPendingCount = async () => {
      const q = query(
        collection(db, "users"),
        where("role", "==", "counselor"),
        where("status", "==", "pending")
      );
      const snapshot = await getDocs(q);
      setPendingCount(snapshot.size); // snapshot.size gives you the total count
    };

    getPendingCount();
  }, []);

      const handleLogout = async () => {
        try {
          await signOut(auth); // Properly sign out from Firebase
          toast.success("Logged out successfully");
          window.location.href = "/login";
        } catch (error) {
          toast.error("Logout failed");
        }
      };

  return (
    <div className="admin-dashboard-container">
      {/* Big Horizontal Blue Header */}
      <div className="admin-main-header">
        <h1 style={{ margin: 0, fontSize: '28px' }}>Admin Dashboard</h1>
            <button className="btn btn-danger" onClick={handleLogout}>
               Logout
           </button>
      </div>

      {/* Horizontal Cards Row */}
      <div className="admin-cards-row">
        
        {/* Approve Counselors Card */}
        <div className="admin-card" onClick={() => navigate("/admin/approve-counselors")}>
          <div className="card-icon">👥</div>
          <div className="card-info text-center">
            <h3>{pendingCount}</h3>
            <p>Approve Counselors</p>
          </div>
        </div>

        {/* Settings Card */}
        <div className="admin-card">
          <div className="card-icon"></div>
          <div className="card-info text-center">
            <h3>-</h3>
            <p>---</p>
          </div>
        </div>

        {/* Analytics Card */}
        <div className="admin-card">
          <div className="card-icon"></div>
          <div className="card-info text-center">
            <h3>-</h3>
            <p>---</p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AdminDashboard;