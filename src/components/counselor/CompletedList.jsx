import React, { useState, useEffect } from "react";
import { db } from "../../firebase-config";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import "./completedlist.css";

function CompletedList({ isOpen, onClose, sessions }) {
  const [selectedSession, setSelectedSession] = useState(null);
  const [historyMessages, setHistoryMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // fetch messages only when a session is selected
  useEffect(() => {
    if (!selectedSession) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const msgRef = collection(
          db,
          "counselingSessions",
          selectedSession.id,
          "messages"
        );
        const q = query(msgRef, orderBy("createdAt", "asc"));
        const querySnapshot = await getDocs(q);

        setHistoryMessages(
          querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
        );
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [selectedSession]);

  if (!isOpen) return null;

  return (
    <div className="waiting-list-overlay">
      <div className={`waiting-list-content ${selectedSession ? "wide-view" : ""}`}>
        {/* header*/}
        <div className="overlay-header">
          {selectedSession ? (
            <button className="back-link" onClick={() => setSelectedSession(null)}>
              ← Back to List
            </button>
          ) : (
            <h3>Completed Sessions</h3>
          )}
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* view 1: the list */}
        {!selectedSession ? (
          <div className="requests-scroll-area">
            {sessions.length === 0 ? (
              <p className="empty-msg">No completed sessions found.</p>
            ) : (
              sessions.map((sess) => (
                <div key={sess.id} className="completed-session-item">
                  <div className="session-info-main">
                    {/* student name + endedAt */}
                    <div className="name-date-row">
                    <div className="name-tag-wrap">
                        <strong>{sess.studentName || "Unknown Student"}</strong>
                        <div className="reason-tag-small">{sess.reasonTag || "No Tag"}</div>
                    </div>

                    <span className="date-text">
                        {sess.endedAt?.toDate ? sess.endedAt.toDate().toLocaleString() : "-"}
                    </span>
                    </div>

                    {/* session notes */}
                    <p className="notes-preview">
                      {sess.sessionNotes || "No session notes."}
                    </p>
                  </div>

                  {/* button only for view history */}
                  <button
                    type="button"
                    className="view-chat-btn"
                    onClick={() => setSelectedSession(sess)}
                  >
                    View Chat
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          /* view 2: chat history and notes */
          <div className="history-detail-view">
            <div className="history-chat-log">
              {loading ? (
                <p>Loading chat...</p>
              ) : historyMessages.length === 0 ? (
                <p style={{ color: "#777" }}>No chat history found.</p>
              ) : (
                historyMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`msg-bubble-hist ${
                      m.senderId === selectedSession.counselorId ? "me" : "them"
                    }`}
                  >
                    <small>{m.senderName || "Unknown"}</small>
                    <p>{m.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CompletedList;
