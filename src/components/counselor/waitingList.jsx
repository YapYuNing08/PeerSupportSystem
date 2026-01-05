import React from "react";
import "./waitinglist.css";

function WaitingList({ isOpen, onClose, requests, onAccept }) {
  if (!isOpen) return null;

  // Helper function to calculate "time ago"
  const getRelativeTime = (timestamp) => {
    if (!timestamp) return "Just now";
    
    const now = new Date();
    const requestDate = timestamp.toDate();
    const diffInSeconds = Math.floor((now - requestDate) / 1000);

    if (diffInSeconds < 60) return "Just now";
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    return `${diffInHours}h ago`;
  };

  return (
    <div className="waiting-list-overlay">
      <div className="waiting-list-content">
        <div className="overlay-header">
          <h3>Pending Chat Requests</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div className="requests-scroll-area">
          {requests.length === 0 ? (
            <p className="empty-msg">No students are currently waiting.</p>
          ) : (
            requests.map((req) => (
              <div key={req.id} className="student-request-item">
                <div className="student-details">
                  <div className="name-time-row">
                    <span className="student-name">{req.studentName}</span>
                    <span className="request-time">{getRelativeTime(req.createdAt)}</span>
                  </div>
                  <span className={`priority-badge p-${req.priority}`}>
                    {req.reasonTag}
                  </span>
                </div>
                
                <button 
                  className="btn-primary" 
                  onClick={() => onAccept(req.id)}
                >
                  Accept
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default WaitingList;