import React from "react";
import "./sessionNotes.css";

function SessionNotes({ isOpen, onClose, sessionNotes, setSessionNotes, onSave, onSubmit, studentName, history }) {
  if (!isOpen) return null;

  return (
    <div className="notes-modal-overlay">
      <div className="notes-modal-content">
        <div className="notes-header">
          <h2>Session Notes: {studentName}</h2>
          <button className="btn-close-x" onClick={onClose}>&times;</button>
        </div>
        
        <div className="notes-history-section">
          <h3>Previous Session History</h3>
          <div className="history-scroll-area">
            {history && history.length > 0 ? (
              history.map((record) => (
                <div key={record.id} className="history-card">
                  <div className="history-meta">
                    {/* Displaying (Date) followed by (Tag) */}
                    <span className="history-date">
                      ({record.endedAt?.toDate().toLocaleDateString()})
                    </span>
                    <span className="history-tag-label">
                      ({record.reasonTag || "General"})
                    </span>
                  </div>
                  <p className="history-text">{record.sessionNotes}</p>
                </div>
              ))
            ) : (
              <p className="no-history-text">No previous session notes found.</p>
            )}
          </div>
        </div>

        <div className="current-notes-section">
          <label>Current Session Observations</label>
          <textarea
            className="notes-textarea"
            placeholder="Record key takeaways, student mood, and recommendations..."
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            required
          />
        </div>
        
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