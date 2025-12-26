import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase-config";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import WaitingList from "../../components/counselor/waitingList";
import CounselorNavbar from "../../components/counselor/counselorNavbar";
import "./chatdashboard.css";

function ChatDashboard() {
  const [isListOpen, setIsListOpen] = useState(false); 
  const [waitingRequests, setWaitingRequests] = useState([]);
  const [ongoingChats, setOngoingChats] = useState([]);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth); // Properly sign out from Firebase
      toast.success("Logged out successfully");
      window.location.href = "/login";
    } catch (error) {
      toast.error("Logout failed");
    }
  };

// 1. Listen for Waiting Requests
  useEffect(() => {
    const q = query(
      collection(db, "chatRequests"), 
      where("status", "==", "waiting"),
      orderBy("priority", "desc"),
      orderBy("createdAt", "asc")
    );
    return onSnapshot(q, (snapshot) => {
      setWaitingRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  // 2. Listen for Ongoing Chats for THIS counselor
  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, "chatRequests"),
      where("status", "==", "ongoing"),
      where("counselorId", "==", auth.currentUser.uid)
    );
    return onSnapshot(q, (snapshot) => {
      setOngoingChats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
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
      setIsListOpen(false);
      navigate(`/chat/${requestId}`);
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
            <h3>{waitingRequests.length}</h3>
            <p>Waiting</p>
          </div>
          <div className="status-card ongoing" onClick={() => navigate(`/chat/${ongoingChats[0]?.id}`)}>
            <h3>{ongoingChats.length}</h3>
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
export default ChatDashboard;