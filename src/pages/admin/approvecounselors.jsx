import React, { useEffect, useState } from "react";
import { db } from "../../firebase-config";
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function ApproveCounselorPage() {
  const [pendingCounselors, setPendingCounselors] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchPending = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "users"),
        where("role", "==", "counselor"),
        where("status", "==", "pending")
      );
      const querySnapshot = await getDocs(q);
      const list = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPendingCounselors(list);
    } catch (error) {
      toast.error("Error fetching data");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (userId) => {
    try {
      await updateDoc(doc(db, "users", userId), { status: "approved" });
      toast.success("Counselor approved!");
      fetchPending(); // Refresh list
    } catch (error) {
      toast.error("Approval failed");
    }
  };

  const handleReject = async (userId) => {
    if (window.confirm("Are you sure you want to reject this application?")) {
      try {
        await deleteDoc(doc(db, "users", userId));
        toast.warn("Application removed.");
        fetchPending(); // Refresh list
      } catch (error) {
        toast.error("Rejection failed");
      }
    }
  };

  if (loading) return <div className="text-center mt-5">Loading...</div>;

  return (
    <div className="container mt-4">
      {/* Navigation Header */}
      <div className="d-flex align-items-center mb-4">
        <button 
          className="btn btn-outline-secondary me-3" 
          onClick={() => navigate("/admin/admin-dashboard")}
        >
          ← Back to Dashboard
        </button>
        <h2 className="m-0">Counselor Approvals</h2>
      </div>

      <div className="card shadow-sm p-4 border-0">
        {pendingCounselors.length === 0 ? (
          <div className="alert alert-info">No pending applications found.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Certificate</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingCounselors.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.email}</td>
                    <td>
                      <a href={c.certLink} target="_blank" rel="noreferrer" className="btn btn-sm btn-link">
                        View File
                      </a>
                    </td>
                    <td>
                      <button 
                        onClick={() => handleApprove(c.id)} 
                        className="btn btn-success btn-sm me-2"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleReject(c.id)} 
                        className="btn btn-danger btn-sm"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ApproveCounselorPage;