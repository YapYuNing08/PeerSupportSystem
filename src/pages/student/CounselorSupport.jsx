import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase-config";
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import RequestChat from "../../components/student/RequestChat";
import { toast } from "react-toastify";
import "./counselorsupport.css";

function CounselorSupport() {
  const [showIntakeForm, setShowIntakeForm] = useState(false);
  const [requestStatus, setRequestStatus] = useState("none"); 
  const [currentRequestId, setCurrentRequestId] = useState(null);
  const [userData, setUserData] = useState({ username: "Student" }); // State to hold user info

  // 1. Fetch user data once on mount
  useEffect(() => {
    const fetchUser = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      }
    };
    fetchUser();
  }, []);

  // 2. Listen for real-time changes to the student's request status
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "chatRequests"),
      where("studentId", "==", user.uid),
      where("status", "in", ["waiting", "ongoing"])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const requestData = snapshot.docs[0];
        setRequestStatus(requestData.data().status === "waiting" ? "pending" : "ongoing");
        setCurrentRequestId(requestData.id);
      } else {
        setRequestStatus("none");
        setCurrentRequestId(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleCancel = async () => {
    if (!currentRequestId) return;
    try {
      const requestRef = doc(db, "chatRequests", currentRequestId);
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
            <button className="btn-request" onClick={() => setShowIntakeForm(true)}>
              Request Counseling Session
            </button>
          </div>
        )}

        {requestStatus === "pending" && (
          <div className="status-container">
            <div className="status-indicator pending">
              <span className="spinner">⏳</span>
              <p>Your request is <strong>Pending</strong>. A counselor will review your request shortly.</p>
            </div>
            <button className="btn-outline-danger" onClick={handleCancel}>Cancel Request</button>
          </div>
        )}

        {requestStatus === "ongoing" && (
          <div className="status-container">
            <div className="status-indicator active">
              <p>✅ A counselor has <strong>Accepted</strong> your request!</p>
            </div>
            <button className="btn-primary" onClick={() => window.location.href = "/chat"}>
              Go to Chat Room
            </button>
          </div>
        )}

        {showIntakeForm && (
          <RequestChat 
            onClose={() => setShowIntakeForm(false)} 
            onSuccess={() => setShowIntakeForm(false)} 
            // Pass the username from our state
            currentUsername={userData.username}
          />
        )}
      </main>
    </div>
  );
}

export default CounselorSupport;