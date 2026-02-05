import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase-config";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, orderBy, limit } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { FaUserClock, FaComments, FaCheckCircle } from "react-icons/fa";

import WaitingList from "../../components/counselor/waitingList";
import CompletedList from "../../components/counselor/CompletedList";
import CounselorLayout from "../../components/layout/counselorLayout";
import "./chatdashboard.css";

function ChatDashboard() {
  const [isListOpen, setIsListOpen] = useState(false); 
  const [waitingRequests, setWaitingRequests] = useState([]);
  const [ongoingChats, setOngoingChats] = useState([]);

  const [isCompletedOpen, setIsCompletedOpen] = useState(false);
  const [completedSessions, setCompletedSessions] = useState([]);
  const [selectedHistoryChat, setSelectedHistoryChat] = useState(null);
  const [activities, setActivities] = useState([]);
  const navigate = useNavigate();

// 1. Listen for Waiting Requests
  useEffect(() => {
    const q = query(
      collection(db, "counselingSessions"), 
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
      collection(db, "counselingSessions"),
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
      collection(db, "counselingSessions"),
      where("status", "==", "completed"),
      where("counselorId", "==", auth.currentUser.uid),
      orderBy("endedAt", "desc")
    );
    
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCompletedSessions(data);
      setCompletedCount(data.length); 
    });
  }, []);

  const handleAccept = async (requestId) => {
    try {
      const requestRef = doc(db, "counselingSessions", requestId);
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

  // 4. Activity Feed Logic (The "Notification" style feed)
  useEffect(() => {
    const q = query(
      collection(db, "counselingSessions"),
      orderBy("createdAt", "desc"),
      limit(10)
    );

    return onSnapshot(q, (snapshot) => {
      const feed = snapshot.docs.map(doc => {
        const data = doc.data();
        let actionText = "";
        let type = "";

        // Determine notification text based on status
        if (data.status === "waiting") {
          actionText = "requested a chat session";
          type = "request";
        } else if (data.status === "ongoing") {
          actionText = "started a conversation";
          type = "ongoing";
        } else if (data.status === "pending-notes" || data.status === "completed") {
          actionText = "ended the session";
          type = "end";
        }

        return {
          id: doc.id,
          studentName: data.studentName,
          text: actionText,
          time: data.createdAt || data.endedAt,
          type: type
        };
      });
      setActivities(feed);
    });
  }, []);

  const getRelativeTime = (timestamp) => {
    if (!timestamp) return "Just now";
    const now = new Date();
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
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
          <div className="status-card completed" onClick={() => setIsCompletedOpen(true)}>
            <h3>{completedCount}</h3>
            <p>Completed</p>
          </div>
        </div>

        <section className="activity-feed-container">
          <div className="section-header">
            <h2>Recent Activity</h2>
            <p>Real-time updates from students</p>
          </div>

          <div className="activity-list">
            {activities.length > 0 ? (
              activities.map((act) => (
                <div key={act.id} className={`activity-item ${act.type}`}>
                  <div className="activity-icon">
                    {act.type === "request" && <FaUserClock />}
                    {act.type === "ongoing" && <FaComments />}
                    {act.type === "end" && <FaCheckCircle />}
                  </div>

                  <div className="activity-content">
                    <p>
                      <strong>{act.studentName}</strong> {act.text}
                    </p>
                    <span className="activity-time">
                      {getRelativeTime(act.time)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-msg">No recent activity detected.</p>
            )}
          </div>
        </section>

        <WaitingList 
          isOpen={isListOpen} 
          onClose={() => setIsListOpen(false)} 
          requests={waitingRequests}
          onAccept={handleAccept}
        />

        <CompletedList 
          isOpen={isCompletedOpen}
          onClose={() => setIsCompletedOpen(false)}
          sessions={completedSessions}
          onViewChat={(session) => {
            // You can navigate to a history page or open another modal here
            setSelectedHistoryChat(session); 
          }}
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