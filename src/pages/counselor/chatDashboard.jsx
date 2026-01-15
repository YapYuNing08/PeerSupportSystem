import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase-config";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import WaitingList from "../../components/counselor/waitingList";
import CounselorLayout from "../../components/layout/counselorLayout";
import "./chatdashboard.css";

function ChatDashboard() {
  const [isListOpen, setIsListOpen] = useState(false); 
  const [waitingRequests, setWaitingRequests] = useState([]);
  const [ongoingChats, setOngoingChats] = useState([]);
  const navigate = useNavigate();

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
      where("status", "in", ["ongoing", "pending-notes"]),
      where("counselorId", "==", auth.currentUser.uid)
    );
    return onSnapshot(q, (snapshot) => {
      setOngoingChats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  const [completedCount, setCompletedCount] = useState(0);

  // 3. Listen for Completed Chats for THIS counselor
  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, "chatRequests"),
      where("status", "==", "completed"), // or "resolved"
      where("counselorId", "==", auth.currentUser.uid)
    );
    
    return onSnapshot(q, (snapshot) => {
      setCompletedCount(snapshot.size); // .size gives you the total number of docs
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
    <CounselorLayout>   
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
            <h3>{completedCount}</h3>
            <p>Completed</p>
          </div>
        </div>

        <WaitingList 
          isOpen={isListOpen} 
          onClose={() => setIsListOpen(false)} 
          requests={waitingRequests}
          onAccept={handleAccept}
        />

        
        {/* <section className="urgency-container">
          <div className="section-header">
            <h2>Urgent Chat Requests</h2>
            <p>Priority based on student mood alerts</p>
          </div>

          <div className="urgency-list-placeholder">
            <p className="empty-msg">No active requests at the moment.</p>
          </div>
        </section> */}
      </main>
    </CounselorLayout>
  );
}
export default ChatDashboard;