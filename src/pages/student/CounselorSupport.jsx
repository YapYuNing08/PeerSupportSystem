import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase-config";
import { onAuthStateChanged } from "firebase/auth"; // Correctly handles auth state
import { 
  collection, query, where, onSnapshot, 
  doc, getDoc, updateDoc, serverTimestamp 
} from "firebase/firestore";
import RequestChat from "../../components/student/RequestChat";
import { useNavigate } from "react-router-dom"; 
import { toast } from "react-toastify";
import "./counselorsupport.css";
import StudentLayout from "../../components/layout/StudentLayout"; 

function CounselorSupport() {
  const [showIntakeForm, setShowIntakeForm] = useState(false);
  const [requestStatus, setRequestStatus] = useState("none"); 
  const [currentRequestId, setCurrentRequestId] = useState(null);
  const [userData, setUserData] = useState(null); 
  const navigate = useNavigate();

  // 1. listen for auth state & fetch user data
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data()); 
          } else {
            console.error("No user profile found in Firestore.");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. listen for real-time changes to the student's request status
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "counselingSessions"),
      where("studentId", "==", user.uid),
      where("status", "in", ["waiting", "ongoing"])
    );

    const unsubscribeStatus = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const requestData = snapshot.docs[0];
        const status = requestData.data().status;
        
        setRequestStatus(status === "waiting" ? "pending" : "ongoing");
        setCurrentRequestId(requestData.id);

        // auto-navigate to chat if the counselor has accepted
        if (status === "ongoing") {
          toast.success("Counselor is ready! Redirecting...");
          navigate(`/student/chat/${requestData.id}`);
        }
      } else {
        setRequestStatus("none");
        setCurrentRequestId(null);
      }
    });

    return () => unsubscribeStatus();
  }, [navigate]);

  const handleCancel = async () => {
    if (!currentRequestId) return;
    try {
      const requestRef = doc(db, "counselingSessions", currentRequestId);
      await updateDoc(requestRef, {
        status: "cancelled",
        cancelledAt: serverTimestamp()
      });
      toast.info("Request cancelled.");
    } catch (error) {
      toast.error("Failed to cancel request.");
    }
  };

  return (
    <StudentLayout>
    <div className="counselor-support-page">
      <header className="support-header">
        <h1>Counselor Support</h1>
        <p>Get personalized tips and emotional support from our peer counselors.</p>
      </header>

      <main className="support-content">
        {requestStatus === "none" && (
          <div className="request-hero-card">
            <h3>Need to Talk? 💬</h3>
            <p>Select a reason and we'll match you with a counselor.</p>
            
            {userData ? (
              <button className="btn-request" onClick={() => setShowIntakeForm(true)}>
                Request Counseling Session
              </button>
            ) : (
              <div className="loading-profile">
                <span className="spinner-small"></span> Loading...
              </div>
            )}
          </div>
        )}

        {/* view: waiting for counselor */}
        {requestStatus === "pending" && (
          <div className="status-container">
            <div className="status-indicator pending">
              <span className="spinner">⏳</span>
              <p>Your request is <strong>Pending</strong>. A counselor will review your request shortly.</p>
            </div>
            <button className="btn-outline-danger" onClick={handleCancel}>Cancel Request</button>
          </div>
        )}

        {/* view: chat is active (in case auto-navigate fails) */}
        {requestStatus === "ongoing" && (
          <div className="status-container">
            <div className="status-indicator active">
              <p>✅ A counselor has <strong>Accepted</strong> your request!</p>
            </div>
            <button className="btn-primary" onClick={() => navigate(`/chat/${currentRequestId}`)}>
              Return to Chat Room
            </button>
          </div>
        )}

        {/* popup: intake form */}
        {showIntakeForm && (
          <RequestChat 
            onClose={() => setShowIntakeForm(false)} 
            onSuccess={() => setShowIntakeForm(false)} 
            currentUsername={userData?.name}
          />
        )}
      </main>
    </div>
    </StudentLayout>
  );
}

export default CounselorSupport;