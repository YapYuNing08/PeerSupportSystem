import React, { useState, useEffect, useRef } from "react";
import { db, auth } from "../../firebase-config";
import { collection, getDocs } from "firebase/firestore";
import { FaLightbulb } from "react-icons/fa"; 
import "./dailynotecard.css";

const DailyNoteCard = () => {
  const [dailyNote, setDailyNote] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  const cardRef = useRef(null);

  useEffect(() => {
    // 1. Listen for Auth State to handle the "first login" race condition
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUserId(user.uid);
        fetchRandomNote(user.uid);
      } else {
        setDailyNote(null);
        setCurrentUserId(null);
      }
    });

    const fetchRandomNote = async (userId) => {
      const sessionKey = `dailyNoteSession_${userId}`;
      const seenNotesKey = `seenNotes_${userId}`;
      
      const savedSession = JSON.parse(localStorage.getItem(sessionKey));
      const todayDate = new Date().toDateString(); // e.g., "Wed Feb 04 2026"

      // 2. If a note was already picked today, use it immediately
      if (savedSession && savedSession.dateString === todayDate) {
        setDailyNote(savedSession.note);
        return;
      }

      try {
        // 3. New day or first time: fetch all notes from Firestore
        const querySnapshot = await getDocs(collection(db, "motivationalNotes"));
        const allNotes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (allNotes.length > 0) {
          const seenNotes = JSON.parse(localStorage.getItem(seenNotesKey) || "[]");

          // 4. Filter out notes already seen
          let availableNotes = allNotes.filter(note => !seenNotes.includes(note.id));

          // 5. If everything has been seen, reset the history
          if (availableNotes.length === 0) {
            availableNotes = allNotes;
            localStorage.setItem(seenNotesKey, JSON.stringify([]));
          }

          // 6. Pick a random one
          const randomIndex = Math.floor(Math.random() * availableNotes.length);
          const selectedNote = availableNotes[randomIndex];

          // 7. Save to local storage for the rest of today
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

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // If the card is open AND the clicked element is NOT inside the cardRef
      if (isOpen && cardRef.current && !cardRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    // Attach listener to the whole document
    document.addEventListener("mousedown", handleClickOutside);
    
    // Clean up listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    
    // 8. Add to "seenNotes" only when the student actually opens the bulb
    if (nextState && dailyNote && currentUserId) {
      const seenNotesKey = `seenNotes_${currentUserId}`;
      const seenNotes = JSON.parse(localStorage.getItem(seenNotesKey) || "[]");
      
      if (!seenNotes.includes(dailyNote.id)) {
        seenNotes.push(dailyNote.id);
        localStorage.setItem(seenNotesKey, JSON.stringify(seenNotes));
      }
    }
  };

  // Don't render anything if the note hasn't loaded yet
  if (!dailyNote) return null;

  return (
    <div className="daily-note-container">
      <div 
        ref ={cardRef}
        className={`minimal-note-card ${isOpen ? 'expanded' : ''}`} 
        onClick={handleToggle}
        style={{ cursor: 'pointer' }}
      >
        <div className="icon-wrapper">
          <FaLightbulb 
            size={30} 
            className={isOpen ? "bulb-on" : "bulb-off"} 
          />
        </div>
        
        {isOpen && (
          <div className="note-text-area">
            <p className="note-body">"{dailyNote.content}"</p>
            <span className="note-footer">— Counselor Encouragement</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyNoteCard;