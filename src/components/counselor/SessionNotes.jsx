import React from "react";
import "./sessionNotes.css";

function SessionNotes({ isOpen, onClose, sessionNotes, setSessionNotes, onSave, onSubmit, studentName }) {
  if (!isOpen) return null;

  return (
    <div className="notes-modal-overlay">
      <div className="notes-modal-content">
        <div className="notes-header">
          <h2>Session Notes: {studentName}</h2>
          <button className="btn-close-x" onClick={onClose}>&times;</button>
        </div>
        
        <textarea
          className="notes-textarea"
          placeholder="Record key takeaways, student mood, and recommendations..."
          value={sessionNotes}
          onChange={(e) => setSessionNotes(e.target.value)}
          required
        />
        
        <div className="modal-actions">
          {/* Note: changed OnClick to onClick */}
          <button type="button" className="btn-save-draft" onClick={onSave}>
            Save Draft
          </button>
          <button type="button" className="btn-complete" onClick={onSubmit}>
            Complete
          </button>
        </div>
      </div>
    </div>
  );
}

export default SessionNotes;