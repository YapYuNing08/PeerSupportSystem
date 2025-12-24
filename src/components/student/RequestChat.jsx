import React, { useState } from "react";
import { db, auth } from "../../firebase-config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "react-toastify";
import "./RequestChat.css";

function RequestChat({ onClose, onSuccess, currentUsername }) {
  const [selectedTag, setSelectedTag] = useState("");

  const priorityMap = {
    "Safety Concern": 3,
    "Academic Pressure": 2,
    "Family Issue": 2,
    "Loneliness": 1,
    "General Advice": 1
  };

  const handleRequest = async () => {
    if (!selectedTag) return toast.warning("Please select a reason");

    try {
      const user = auth.currentUser;
      if (!user) return toast.error("User not authenticated.");

      await addDoc(collection(db, "chatRequests"), {
        studentId: user.uid,
        // Use the prop passed from CounselorSupport
        studentName: currentUsername || "Anonymous Student", 
        reasonTag: selectedTag,
        priority: priorityMap[selectedTag] || 1,
        status: "waiting",
        createdAt: serverTimestamp(),
      });

      toast.success("Request sent!");
      onSuccess();
    } catch (error) {
      console.error("Error adding document: ", error);
      toast.error("Error submitting request.");
    }
  };

  return (
    <div className="request-chat-overlay">
      <div className="auth-inner">
        <h3>Support Intake</h3>
        <p className="auth-subtitle">Why are you reaching out today?</p>
        
        <div className="tag-selection-grid">
          {Object.keys(priorityMap).map((tag) => (
            <button
              key={tag}
              className={`tag-option ${selectedTag === tag ? "active" : ""}`}
              onClick={() => setSelectedTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="form-actions mt-4">
          <button className="btn-secondary" onClick={onClose}>Back</button>
          <button className="btn-request" onClick={handleRequest}>Confirm Request</button>
        </div>
      </div>
    </div>
  );
}

export default RequestChat;