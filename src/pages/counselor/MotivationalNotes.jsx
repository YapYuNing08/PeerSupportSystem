import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase-config";
import { 
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  where,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { toast } from "react-toastify";
import CounselorLayout from "../../components/layout/counselorLayout";
import "./motivationalnotes.css"; 

function MotivationalNotes() {
  const [notes, setNotes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [editNoteId, setEditNoteId] = useState(null);
  const [editText, setEditText] = useState("");

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

  const openEditModal = (note) => {
    setEditNoteId(note.id);
    setEditText(note.content);
    setIsModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!editText.trim()) {
      toast.error("Note cannot be empty.");
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, "motivationalNotes", editNoteId), {
        content: editText,
        updatedAt: serverTimestamp()
      });

      toast.success("Note updated!");
      setEditNoteId(null);
      setEditText("");
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update note.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (noteId) => {
    const confirmDelete = window.confirm("Delete this note?");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "motivationalNotes", noteId));
      toast.success("Note deleted!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete note.");
    }
  };

  return (
    <CounselorLayout>
      <div className="notes-container">
        <header className="notes-header">
          <h2>Daily Encouragement Notes</h2>
          <button
            className="add-note-btn"
            onClick={() => {
              setIsModalOpen(true);
              setEditNoteId(null);
              setEditText("");
              setNewNote("");
            }}
          >
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
                    {note.createdAt?.toDate ? note.createdAt.toDate().toLocaleDateString() : ""}
                  </span>

                  {/* ADDED: Edit / Delete */}
                  <div className="note-actions">
                    <button className="edit-btn" onClick={() => openEditModal(note)}>
                      Edit
                    </button>
                    <button className="delete-btn" onClick={() => handleDelete(note.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal for adding/editing notes */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              {/* ADDED: inline title/subtitle for add vs edit */}
              <h3>{editNoteId ? "Edit Motivational Note" : "New Motivational Note"}</h3>
              <p className="modal-subtitle">
                {editNoteId
                  ? "Update your supportive note."
                  : "Write a supportive note to be shown to students."}
              </p>

              {/* ADDED: textarea switches between newNote / editText */}
              <textarea
                rows="5"
                placeholder="Type your message here..."
                value={editNoteId ? editText : newNote}
                onChange={(e) =>
                  editNoteId ? setEditText(e.target.value) : setNewNote(e.target.value)
                }
              />

              <div className="modal-actions">
                {/* ADDED: cancel resets edit state too */}
                <button
                  className="cancel-btn"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditNoteId(null);
                    setEditText("");
                  }}
                >
                  Cancel
                </button>

                {/* ADDED: save button switches between save/update */}
                <button
                  className="save-note-btn"
                  onClick={editNoteId ? handleUpdate : handleSave}
                  disabled={loading}
                >
                  {loading ? "Saving..." : editNoteId ? "Update Note" : "Save Note"}
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