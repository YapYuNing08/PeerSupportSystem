import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase-config";
import { signOut, onAuthStateChanged } from "firebase/auth"; // Added onAuthStateChanged to fix crashing
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  getDoc,
  deleteDoc 
} from "firebase/firestore";
import { toast } from "react-toastify";

function AdminDashboard() {
  const [pendingCounselors, setPendingCounselors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This listener waits for Firebase to load the user session properly
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          
          if (userDoc.exists() && userDoc.data().role === "admin") {
            // User is a verified admin
            fetchPending();
          } else {
            // Logged in but not an admin
            toast.error("Access denied: Admins only.");
            window.location.href = "/home";
          }
        } catch (error) {
          console.error("Verification error:", error);
          window.location.href = "/login";
        }
      } else {
        // No user is logged in
        window.location.href = "/login";
      }
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

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
      toast.error("Error fetching pending counselors");
    }
    setLoading(false);
  };

  const handleApprove = async (userId) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { status: "approved" }); // Update status in Firestore
      toast.success("Counselor approved successfully!");
      fetchPending();
    } catch (error) {
      toast.error("Approval failed");
    }
  };

  const handleReject = async (userId) => {
    if (window.confirm("Are you sure you want to reject and delete this application?")) {
      try {
        await deleteDoc(doc(db, "users", userId)); // Remove invalid counselor application
        toast.warn("Application rejected and removed.");
        fetchPending();
      } catch (error) {
        toast.error("Rejection failed");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth); // Properly sign out from Firebase
      toast.success("Logged out successfully");
      window.location.href = "/login";
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  if (loading) return <div className="text-center mt-5"><h4>Verifying Admin Status...</h4></div>;

  return (
    <div className="container mt-5">
      {/* Admin Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Admin Dashboard</h2>
        <button className="btn btn-danger" onClick={handleLogout}>
          Logout
        </button>
      </div>
      
      <div className="card shadow p-4">
        <h4 className="mb-4">Pending Counselor Approvals</h4>
        <hr />
        
        {pendingCounselors.length === 0 ? (
          <div className="alert alert-info">No counselors currently awaiting approval.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-dark">
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Certificate Link</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingCounselors.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.username}</td>
                    <td>{c.email}</td>
                    <td>
                      <a href={c.certLink} target="_blank" rel="noreferrer" className="btn btn-link btn-sm p-0">
                        View Certificate
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
                        className="btn btn-outline-danger btn-sm"
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

export default AdminDashboard;