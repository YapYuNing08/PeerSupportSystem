import React, { useState, useEffect, useRef } from "react";
import { db, auth } from "../../firebase-config";
import { 
  collection, query, where, onSnapshot, orderBy, 
  addDoc, serverTimestamp, doc, updateDoc, getDoc
} from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom"; 
import { toast } from "react-toastify";
import SessionNotes from "../../components/counselor/SessionNotes";
import "./counselorchatroom.css";

function CounselorChatRoom() {
  const { requestId } = useParams(); // get ID from URL (/chat/:requestId)
  const [ongoingStudents, setOngoingStudents] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");
  const [hasStudentEnded, setHasStudentEnded] = useState(false);

  const [history, setHistory] = useState([]);

  const scrollRef = useRef();
  const navigate = useNavigate();

  // 1. fetch all ongoing students
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "counselingSessions"),
      where("status", "in", ["ongoing", "pending-notes"]),
      where("counselorId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOngoingStudents(students);
    });

    return () => unsubscribe();
  }, []);

  // 2. sync selectedRequest with the URL requestId
useEffect(() => {
    if (ongoingStudents.length > 0 && requestId) {
      const current = ongoingStudents.find(s => s.id === requestId);
      if (current) {
        setSelectedRequest(current);
        setSessionNotes(current.sessionNotes || ""); // pre-fill notes if they exist
      }
    }

    // detect if student changes status to 'pending-notes'
    if (requestId) {
      const unsub = onSnapshot(doc(db, "counselingSessions", requestId), (docSnap) => {
        if (docSnap.exists() && docSnap.data().status === "pending-notes") {
          setHasStudentEnded(true);
        } else {
          setHasStudentEnded(false);
        }
      });
      return () => unsub();
    }
  }, [requestId, ongoingStudents]);

  useEffect(() => {
    // if no student is selected, clear history and stop
    if (!selectedRequest?.studentId) {
      setHistory([]);
      return;
    }

    // fetch ALL completed sessions for this student ID
    // show notes from Counselor A, Counselor B, etc.
    const q = query(
      collection(db, "counselingSessions"),
      where("studentId", "==", selectedRequest.studentId),
      where("status", "==", "completed"),
      orderBy("endedAt", "desc") // shows newest history first
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allPastSessions = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setHistory(allPastSessions);
    }, (error) => {
      console.error("Error fetching history:", error);
      toast.error("Could not load session history.");
    });

    return () => unsubscribe();
  }, [selectedRequest?.studentId]); 

  // 3. fetch messages for the SELECTED student
  useEffect(() => {
    if (!selectedRequest?.id) return;

    const messagesRef = collection(db, "counselingSessions", selectedRequest.id, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let msgs = [];
      snapshot.forEach((doc) => {
        msgs.push({ ...doc.data(), id: doc.id });
      });
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [selectedRequest]);

  // 4. auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRequest) return;

    try {
      // 1) get counselor FULL name from users collection
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      const fullName = userSnap.exists() ? userSnap.data().name : "Counselor";

      // 2) add message
      const messagesRef = collection(db, "counselingSessions", selectedRequest.id, "messages");

      await addDoc(messagesRef, {
        text: newMessage.trim(),
        createdAt: serverTimestamp(),
        senderId: auth.currentUser.uid,
        senderName: fullName, //
      });

      setNewMessage("");
    } catch (error) {
      console.error("Counselor send message error:", error);
      toast.error("Message failed to send.");
    }
  };


  // navigate when clicking a sidebar item
  const handleSelectStudent = (id) => {
    navigate(`/chat/${id}`);
  };

  const endSession = async () => {
    if (!selectedRequest) return;
    // instead of immediate complete, we open the notes modal
    setIsNotesOpen(true);
  };

  const handleSaveDraft = async () => {
    if (!sessionNotes.trim()) {
      toast.warning("Nothing to save.");
      return;
    }
    try {
      await updateDoc(doc(db, "counselingSessions", selectedRequest.id), {
        sessionNotes: sessionNotes // only update the notes field
      });
      toast.success("Draft saved!");
    } catch (error) {
      toast.error("Error saving draft.");
    }
  };

  const handleFinalSubmit = async () => {
    if (!sessionNotes.trim()) {
      toast.warning("Please enter session notes before completing.");
      return;
    }
    
    // the "Last Chance" confirmation message
    const isReady = window.confirm("Are you sure? Once completed, this session will be archived and you cannot edit the notes again.");
    
    if (isReady) {
      try {
        await updateDoc(doc(db, "counselingSessions", selectedRequest.id), {
          status: "completed",
          sessionNotes: sessionNotes, // saves the final version
          endedAt: serverTimestamp()
        });
        toast.success("Session successfully completed and archived!");
        setIsNotesOpen(false);
        navigate("/counselor/chat-dashboard");
      } catch (error) {
        console.error(error);
        toast.error("Error finalizing session.");
      }
    }
  }

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
    <div className="chat-dashboard-wrapper">
      <aside className="chat-sidebar">
        <div className="sidebar-header">
          <h3>Chat Room</h3>
          <button className="btn-dashboard" onClick={() => navigate("/counselor/chat-dashboard")}>Dashboard</button>
        </div>
        <div className="student-list">
          {ongoingStudents.map((student) => (
            <div 
              key={student.id} 
              className={`student-item ${requestId === student.id ? "active" : ""} ${student.status === 'pending-notes' ? 'needs-notes' : ''}`}
              onClick={() => handleSelectStudent(student.id)}
            >
              <div className="student-avatar">
                {student.studentName?.charAt(0).toUpperCase()}
              </div>
              <div className="student-info">
                <span className="student-name">{student.studentName}</span>
                <span className="last-reason">{student.reasonTag}</span>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main className="chat-main-area">
        {selectedRequest ? (
          <>
            <header className="chat-header">
              <div className="header-user">
                <h2>{selectedRequest.studentName}</h2>
                <span className={`status-tag ${hasStudentEnded ? 'offline' : 'online'}`}>
                  {hasStudentEnded ? "Disconnected" : "Active"}
                </span>
              </div>
              <div className="header-actions">
                <button className="btn-notes-icon" onClick={() => setIsNotesOpen(true)} title="Session Notes">📝</button>

                {!hasStudentEnded && <button className="btn-end-chat" onClick={() => setIsNotesOpen(true)}>End Session</button>}
              </div>
            </header>

            <div className="messages-display">
              {messages.map((m, i) => {
                const isMe = m.senderId === auth.currentUser.uid;

                const prev = messages[i - 1];
                const showDate =
                  !prev || formatDate(prev.createdAt) !== formatDate(m.createdAt);

                return (
                  <React.Fragment key={m.id}>
                    {showDate && (
                      <div className="date-divider">
                        {formatDate(m.createdAt)}
                      </div>
                    )}

                    <div className={`message-bubble ${isMe ? "me" : "them"}`}>
                      {!isMe && (
                        <div className="msg-meta">
                          {selectedRequest?.studentName}
                        </div>
                      )}

                      <p className="msg-text">{m.text}</p>

                      <div className="msg-time">
                        {formatTime(m.createdAt)}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}


              <div ref={scrollRef} />
            </div>

            <div className="chat-footer-area">
              {hasStudentEnded ? (
                <div className="system-notice-bottom" onClick={() => setIsNotesOpen(true)}>
                   <p>Student <strong>{selectedRequest.studentName}</strong> ended the session.</p>
                   <span>Click here to complete the <strong>Session Notes</strong> and close the case.</span>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="message-input-form">
                  <input 
                    type="text"
                    placeholder="Write something..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                <button type="submit" className="student-send-btn" disabled={!newMessage.trim()}>
                   ➤
                </button>
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="empty-state"><p>Select a student to start chatting</p></div>
        )}
      </main>

      <SessionNotes 
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        sessionNotes={sessionNotes}
        setSessionNotes={setSessionNotes}
        onSave={handleSaveDraft} 
        onSubmit={handleFinalSubmit}
        studentName={selectedRequest?.studentName}
        history={history}
      />
    </div>
  );
}

export default CounselorChatRoom;