import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase-config";
import { collection, getDocs } from "firebase/firestore";
import { FaLightbulb } from "react-icons/fa"; 
import "./dailynotecard.css";

const DailyNoteCard = () => {
  const [dailyNote, setDailyNote] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchRandomNote = async () => {
      if (!auth.currentUser) return;

      const userId = auth.currentUser.uid;
      const sessionKey = `dailyNoteSession_${userId}`;
      const seenNotesKey = `seenNotes_${userId}`;
      
      const savedSession = JSON.parse(localStorage.getItem(sessionKey));
      const todayDate = new Date().toDateString(); // Formats as: "Mon Jan 19 2026"

      // 1. Check if the saved note is from today. If yes, use it and skip fetching.
      if (savedSession && savedSession.dateString === todayDate) {
        setDailyNote(savedSession.note);
        return;
      }

      try {
        // 2. If it's a new day or no session exists, fetch all notes
        const querySnapshot = await getDocs(collection(db, "motivationalNotes"));
        const allNotes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (allNotes.length > 0) {
          const seenNotes = JSON.parse(localStorage.getItem(seenNotesKey) || "[]");

          // 3. Filter out notes already seen by the student
          let availableNotes = allNotes.filter(note => !seenNotes.includes(note.id));

          // 4. If all notes have been seen, reset the "seen" list to start over
          if (availableNotes.length === 0) {
            availableNotes = allNotes;
            localStorage.setItem(seenNotesKey, JSON.stringify([]));
          }

          // 5. Select a random note from the available ones
          const randomIndex = Math.floor(Math.random() * availableNotes.length);
          const selectedNote = availableNotes[randomIndex];

          // 6. Save the note and current date to the daily session
          localStorage.setItem(sessionKey, JSON.stringify({
            note: selectedNote,
            dateString: todayDate
          }));

          setDailyNote(selectedNote);
        }
      } catch (error) {
        console.error("Error fetching notes:", error);
      }
    };

    fetchRandomNote();
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    
    // Add the note to the "seen" list when first opened so it won't repeat tomorrow
    if (!isOpen && dailyNote) {
      const seenNotesKey = `seenNotes_${auth.currentUser?.uid}`;
      const seenNotes = JSON.parse(localStorage.getItem(seenNotesKey) || "[]");
      if (!seenNotes.includes(dailyNote.id)) {
        seenNotes.push(dailyNote.id);
        localStorage.setItem(seenNotesKey, JSON.stringify(seenNotes));
      }
    }
  };

  if (!dailyNote) return null;

  return (
    <div className="daily-note-container">
      <div 
        className={`minimal-note-card ${isOpen ? 'expanded' : ''}`} 
        onClick={handleToggle}
      >
        <div className="icon-wrapper">
          <FaLightbulb 
            size={30} 
            className={isOpen ? "bulb-on" : "bulb-off"} 
          />
        </div>
        
        {isOpen && (
          <div className="note-text-area">
            <p>"{dailyNote.content}"</p>
            <span>— Counselor Encouragement</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyNoteCard;