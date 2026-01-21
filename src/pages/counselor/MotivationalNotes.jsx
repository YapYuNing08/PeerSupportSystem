import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase-config";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  where,
  serverTimestamp 
} from "firebase/firestore";
import { toast } from "react-toastify";
import CounselorLayout from "../../components/layout/counselorLayout";
import "./motivationalnotes.css"; 

function MotivationalNotes() {
  const [notes, setNotes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);

  // Listen for ALL notes from ALL counselors
  useEffect(() => {
    const q = query(
      collection(db, "motivationalNotes"),
      where("counselorId", "==", auth.currentUser.uid), // Filter for current counselor
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    // Alternate Flow 4a: Counselor leaves the text box empty
    if (!newNote.trim()) {
      toast.error("Note cannot be empty."); 
      return;
    }

    setLoading(true);
    try {
      // Store the note with author details for the collective view
      await addDoc(collection(db, "motivationalNotes"), {
        content: newNote,
        counselorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || "Counselor",
        createdAt: serverTimestamp(),
      });

      toast.success("Note posted successfully!");
      setNewNote("");
      setIsModalOpen(false); // Close modal after saving
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to save note.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CounselorLayout>
      <div className="notes-container">
        <header className="notes-header">
          <h2>Daily Encouragement Notes</h2>
          <button className="add-note-btn" onClick={() => setIsModalOpen(true)}>
            + Add New Note
          </button>
        </header>

        {/* Display list or empty state based on system storage */}
        {notes.length === 0 ? (
          <div className="empty-state">
            <p>No motivational notes found in the system.</p>
            <small>Be the first to encourage the students!</small>
          </div>
        ) : (
          <div className="notes-grid">
            {notes.map((note) => (
              <div key={note.id} className="note-card">
                <p className="note-content">"{note.content}"</p>
                <div className="note-footer">
                  {/* <span className="note-author">By {note.authorName}</span> */}
                  <span className="note-date">
                    {note.createdAt?.toDate().toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal for adding new short notes */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>New Motivational Note</h3>
              <p className="modal-subtitle">Write a supportive note to be shown to students.</p>
              
              <textarea
                rows="5"
                placeholder="Type your message here..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />

              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button 
                  className="save-note-btn" 
                  onClick={handleSave} 
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Note"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CounselorLayout>
  );
}

export default MotivationalNotes;