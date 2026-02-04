import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../../firebase-config";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  getDoc,
  serverTimestamp, 
  doc,
  updateDoc
} from "firebase/firestore";
import { toast } from "react-toastify";
import "./studentchat.css";

function StudentChatRoom() {
  const { requestId } = useParams(); // Gets ID from /student/chat/:requestId
  const navigate = useNavigate();
  const scrollRef = useRef();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sessionData, setSessionData] = useState(null);

  // 1. Listen for Session Status (Auto-close if counselor ends chat)
  useEffect(() => {
    if (!requestId) return;

    const requestRef = doc(db, "counselingSessions", requestId);
    const unsubscribeStatus = onSnapshot(requestRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSessionData(data);

        // If counselor ends the chat, redirect student
        if (data.status === "completed") {
          toast.info("The counseling session has ended.");
          navigate("/student-page");
        }
      }
    });

    return () => unsubscribeStatus();
  }, [requestId, navigate]);

  // 2. Listen for Messages in real-time
  useEffect(() => {
    if (!requestId) return;

    const messagesRef = collection(db, "counselingSessions", requestId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribeMessages = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });

    return () => unsubscribeMessages();
  }, [requestId]);

  // 3. Auto-scroll to bottom on new message
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      // 1) Get student's FULL name from users collection
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      const fullName = userSnap.exists() ? userSnap.data().name : "Student";

      // 2) Add message
      const messagesRef = collection(db, "counselingSessions", requestId, "messages");

      await addDoc(messagesRef, {
        text: newMessage.trim(),
        createdAt: serverTimestamp(),
        senderId: auth.currentUser.uid,
        senderName: fullName, 
      });

      setNewMessage("");
    } catch (error) {
      console.error("Student send message error:", error);
      toast.error("Message failed to send.");
    }
  };

  const endSession = async () => {
    // Confirm with the student before closing
    const confirmEnd = window.confirm("Are you sure you want to end this counseling session?");
    
    if (confirmEnd) {
      try {
        const requestRef = doc(db, "counselingSessions", requestId);
        
        // Update the status to 'completed'
        await updateDoc(requestRef, {
          status: "pending-notes",
          endedAt: serverTimestamp(),
          endedBy: "student" // Optional: track who ended the session
        });

        toast.success("Session ended.");
        navigate("/student-page"); // Redirect to the support landing page
      } catch (error) {
        console.error("Error ending chat:", error);
        toast.error("Failed to end the session. Please try again.");
      }
    }
  };

  const formatTime = (ts) => {
    if (!ts) return ""; // while waiting serverTimestamp
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (ts) => {
    if (!ts) return "";
    const d = ts.toDate();
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  return (
    <div className="student-chat-wrapper">
      <header className="student-chat-header">
        {/* Left side: stays on the left */}
        <div className="header-left">
          <button className="btn-exit" onClick={() => navigate("/student-page")}>
            Leave Chat
          </button>
        </div>

        {/* Center: absolutely centered so pop-ups won't move it */}
        <div className="header-center-absolute">
          <div className="online-dot"></div>
          <h2>Counseling Session</h2>
        </div>

        {/* Right side: stays on the right */}
        <div className="header-right">
          <button className="btn-end-chat" onClick={endSession}>
            End Session
          </button>
        </div>
      </header>

      <div className="student-messages-container">
        {messages.map((msg, i) => {
          const isMe = msg.senderId === auth.currentUser.uid;

          const prev = messages[i - 1];
          const showDate =
            !prev || formatDate(prev.createdAt) !== formatDate(msg.createdAt);

          return (
            <React.Fragment key={msg.id}>
              {showDate && (
                <div className="date-divider">
                  {formatDate(msg.createdAt)}
                </div>
              )}

              <div className={`msg-row ${isMe ? "student-me" : "counselor-them"}`}>
                <div className="msg-bubble">
                  {!isMe && <div className="msg-meta">{msg.senderName}</div>}

                  <div className="msg-text">{msg.text}</div>

                  <div className="msg-time">
                    {formatTime(msg.createdAt)}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}

        <div ref={scrollRef} />
      </div>

      <form className="student-chat-input" onSubmit={handleSendMessage}>
        <input 
          type="text" 
          placeholder="Type your message..." 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button type="submit" className="student-send-btn" disabled={!newMessage.trim()}>
          ➤
        </button>
      </form>
    </div>
  );
}

export default StudentChatRoom;