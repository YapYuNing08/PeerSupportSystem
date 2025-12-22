import React from "react";
import { auth } from "../../firebase-config";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";

import PendingApprovalCard from "../../components/admin/PendingApprovalcard";
import CounselorListCard from "../../components/admin/counselorlistcard";
import ReportCard from "../../components/admin/reportcard";


function AdminDashboard() {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
      window.location.href = "/login";
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  return (
    <div className="admin-dashboard-container">
      <div className="admin-main-header">
        <h1>Admin Dashboard</h1>
        <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
      </div>

      <div className="admin-cards-row">
        {/* Just call the specific card components here */}
        <PendingApprovalCard/>
        <CounselorListCard/>
        <ReportCard/>
      </div>
    </div>
  );
}

export default AdminDashboard;