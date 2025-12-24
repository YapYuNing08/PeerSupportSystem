import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase-config";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";

import WaitingList from "../../components/counselor/waitingList";
import CounselorNavbar from "../../components/counselor/counselorNavbar";
import "./counselorchat.css";

function CounselorChat() {
  const [isListOpen, setIsListOpen] = useState(false); // Controls the popup
  const [waitingRequests, setWaitingRequests] = useState([]);
  const [waitingCount, setWaitingCount] = useState(0);

  const handleLogout = async () => {
    try {
      await signOut(auth); // Properly sign out from Firebase
      toast.success("Logged out successfully");
      window.location.href = "/login";
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  useEffect(() => {
    const q = query(
      collection(db, "chatRequests"), 
      where("status", "==", "waiting"),
      orderBy("priority", "desc"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWaitingRequests(requests);
      setWaitingCount(snapshot.size); 
    });

    return () => unsubscribe();
  }, []);

  const handleAccept = async (requestId) => {
    try {
      const requestRef = doc(db, "chatRequests", requestId);
      await updateDoc(requestRef, {
        status: "ongoing",
        counselorId: auth.currentUser.uid,
        acceptedAt: serverTimestamp()
      });
      toast.success("Student accepted!");
      setIsListOpen(false); // Close popup after accepting
    } catch (error) {
      toast.error("Error accepting chat.");
    }
  };
  
  return (
    <div className="counselor-layout">
      <CounselorNavbar handleLogout={handleLogout} />
      
      <main className="counselor-main-content">
        <div className="status-overview">
          <div className="status-card waiting" onClick={() => setIsListOpen(true)}>
            <h3>{waitingCount}</h3>
            <p>Waiting</p>
          </div>
          <div className="status-card ongoing">
            <h3>0</h3>
            <p>Ongoing</p>
          </div>
          <div className="status-card completed">
            <h3>0</h3>
            <p>Completed</p>
          </div>
        </div>

        <WaitingList 
          isOpen={isListOpen} 
          onClose={() => setIsListOpen(false)} 
          requests={waitingRequests}
          onAccept={handleAccept}
        />

        {/* BOTTOM SECTION: URGENCY LIST */}
        <section className="urgency-container">
          <div className="section-header">
            <h2>Urgent Chat Requests</h2>
            <p>Priority based on student mood alerts</p>
          </div>

          <div className="urgency-list-placeholder">
            {/* We will map Firebase data here later */}
            <p className="empty-msg">No active requests at the moment.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
export default CounselorChat;