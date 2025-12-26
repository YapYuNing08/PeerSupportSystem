import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase-config"; 
import { 
  collection, query, where, doc, setDoc, addDoc, serverTimestamp, onSnapshot 
} from "firebase/firestore";
import "./MoodTracker.css"; 

const MoodTracker = () => {
  const [view, setView] = useState("calendar"); 
  const [loading, setLoading] = useState(false);
  
  // calender state
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [moodHistory, setMoodHistory] = useState({}); 
  const [targetDate, setTargetDate] = useState(null); 
  const [isReadOnly, setIsReadOnly] = useState(false);

  // form state
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedEmotions, setSelectedEmotions] = useState([]);
  const [note, setNote] = useState("");
  const [existingDocId, setExistingDocId] = useState(null);

  // mood options
  const moodOptions = [
    { value: 1, label: "Awful", color: "#FF6B6B", icon: "😡" },
    { value: 2, label: "Bad", color: "#FFD93D", icon: "😞" },
    { value: 3, label: "Neutral", color: "#A8A8A8", icon: "😐" },
    { value: 4, label: "Good", color: "#6BCB77", icon: "🙂" },
    { value: 5, label: "Great", color: "#4D96FF", icon: "🤩" },
  ];

  const emotionTags = [
    "excited", "depressed", "proud", "lonely", 
    "calm", "angry", "grateful", "tired"
  ];

  
  const getLocalTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMonthYearString = (date) => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  // get history mood logs
  useEffect(() => {
    let unsubscribeSnapshot = null;
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const q = query(
          collection(db, "mood_logs"), 
          where("userId", "==", user.uid)
        );
        unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
          const history = {};
          snapshot.forEach((doc) => {
            const data = doc.data();
            // store the doc.id inside the history object
            history[data.date] = { ...data, id: doc.id }; 
          });
          setMoodHistory(history);
        });
      } else {
        setMoodHistory({});
      }
    });
    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  // calendaer logic
  const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const changeMonth = (offset) => {
    const newDate = new Date(currentDate.getTime());
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };


  // open the form, regardless of where the click came from
  const openFormForDate = (dateStr) => {
    const todayStr = getLocalTodayString();

    // 1. Prevent future dates
    if (dateStr > todayStr) {
      alert("You cannot record mood for the future!");
      return;
    }

    setTargetDate(dateStr);
    const existingData = moodHistory[dateStr];

    if (existingData) {
        // PRE-FILL DATA
        setSelectedMood(existingData.mood);
        setSelectedEmotions(existingData.emotions || []);
        setNote(existingData.note || "");
        
        // logic check:
        // if it is TODAY -> allow Edit (update Mode)
        // if it is PAST(recorded) -> read Only (view Mode)
        // if it is PAST (not recorded yet) -> allow edit (new entry)
        if (dateStr === todayStr) {
            setIsReadOnly(false);
            setExistingDocId(existingData.id); // Update mode
        } else {
            setIsReadOnly(true);
            setExistingDocId(null); // View mode
        }
    } else {
        // new entry
        setSelectedMood(null);
        setSelectedEmotions([]);
        setNote("");
        setIsReadOnly(false);
        setExistingDocId(null); 
    }
    
    setView("input");
  };

  // get date based on the CURRENTLY VIEWED MONTH
  const handleDayClick = (day) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayString = String(day).padStart(2, '0');
    const clickedDateStr = `${year}-${month}-${dayString}`;
    
    openFormForDate(clickedDateStr);
  };

  // record for today button
  // get date based on REAL TIME (ignoring the calendar view)
  const handleLogToday = () => {
    const todayStr = getLocalTodayString(); // always returns actual today
    openFormForDate(todayStr); 
  };

  const toggleEmotion = (emotion) => {
    if (isReadOnly) return;
    if (selectedEmotions.includes(emotion)) {
        setSelectedEmotions(selectedEmotions.filter((e) => e !== emotion));
    } else {
        setSelectedEmotions([...selectedEmotions, emotion]);
    }
  };

  // save the record
  const handleSave = async () => {
    if (isReadOnly) return;
    if (!selectedMood) { alert("Please select a mood first!"); return; }
    
    setLoading(true);
    const dateToSave = targetDate || getLocalTodayString();
    
    const moodData = {
      userId: auth.currentUser.uid,
      date: dateToSave,
      mood: selectedMood,
      emotions: selectedEmotions,
      note: note,
      updatedAt: serverTimestamp(),
    };

    try {
      if (existingDocId) {
        // if an entry exists, updates the existing record.
        await setDoc(doc(db, "mood_logs", existingDocId), moodData, { merge: true });
        alert("Mood updated successfully!");
      } else {
        // create new entry
        await addDoc(collection(db, "mood_logs"), { ...moodData, createdAt: serverTimestamp() });
        alert("Mood recorded successfully!");
      }
      setView("calendar");
    } catch (error) {
      console.error(error);
      alert("Failed to save.");
    }
    setLoading(false);
  };

  // view the calender
  const renderCalendarGrid = () => {
    const totalDays = daysInMonth(currentDate);
    const startDay = firstDayOfMonth(currentDate);
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const todayStr = getLocalTodayString();

    const days = [];
    
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let d = 1; d <= totalDays; d++) {
      const dayString = String(d).padStart(2, '0');
      const dateKey = `${year}-${month}-${dayString}`;
      const log = moodHistory[dateKey];
      const isFuture = dateKey > todayStr;
      
      let dayStyle = {};
      let dayContent = d; 
      
      if (log) {
        const moodObj = moodOptions.find(m => m.value === log.mood);
        if (moodObj) {
            dayStyle = { backgroundColor: moodObj.color, borderColor: moodObj.color };
            dayContent = <span className="calendar-emoji">{moodObj.icon}</span>;
        }
      }

      days.push(
        <div 
            key={d} 
            className={`calendar-day ${log ? 'has-mood' : ''} ${isFuture ? 'future-day' : ''}`} 
            style={dayStyle}
            onClick={() => handleDayClick(d)}
        >
          {dayContent}
        </div>
      );
    }
    return days;
  };

  const renderCalendarView = () => (
    <div className="screen-container">
      <header className="calendar-header">
        <button className="nav-btn" onClick={() => changeMonth(-1)}>←</button>
        <h2>{getMonthYearString(currentDate)}</h2>
        <button className="nav-btn" onClick={() => changeMonth(1)}>→</button>
      </header>

      <div className="weekdays-grid">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
            <div key={day} className="weekday-label">{day}</div>
        ))}
      </div>

      <div className="days-grid">
        {renderCalendarGrid()}
      </div>
      
      <button 
        className="floating-action-btn"
        onClick={handleLogToday}
      >
        Record for Today
      </button>
    </div>
  );

  const renderInputView = () => (
    <div className="screen-container input-view">
      <button className="back-btn" onClick={() => setView("calendar")}>← Back</button>
      
      <div className="section-header">
        <h3>{isReadOnly ? "View Entry" : (existingDocId ? "Update Mood" : "Log Mood")}</h3>
        <span className="date-badge">{targetDate}</span>
      </div>

      <div className="section">
        <h3>How was your day?</h3>
        <div className="mood-selector">
          {moodOptions.map((option) => (
            <button
              key={option.value}
              className={`mood-btn ${selectedMood === option.value ? "selected" : ""}`}
              onClick={() => !isReadOnly && setSelectedMood(option.value)}
              disabled={isReadOnly}
              style={{ 
                  backgroundColor: selectedMood === option.value ? option.color : "#f0f0f0",
                  opacity: isReadOnly && selectedMood !== option.value ? 0.3 : 1 
              }}
            >
              <span className="emoji">{option.icon}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="section">
        <h3>Emotions</h3>
        <div className="emotion-grid">
          {emotionTags.map((tag) => (
            <label key={tag} className={`checkbox-container ${isReadOnly ? 'disabled' : ''}`}>
              <input 
                type="checkbox" 
                checked={selectedEmotions.includes(tag)}
                onChange={() => toggleEmotion(tag)}
                disabled={isReadOnly}
              />
              <span className="checkmark"></span>
              {tag}
            </label>
          ))}
        </div>
      </div>

      <div className="section">
        <h3>Note</h3>
        <textarea 
          placeholder={isReadOnly ? "No note recorded." : "Enter here..."}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={isReadOnly}
        />
      </div>

      {!isReadOnly && (
          <button className="done-btn" onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Done"}
          </button>
      )}
    </div>
  );

  return (
    <div className="app-wrapper">
      {view === "calendar" ? renderCalendarView() : renderInputView()}
    </div>
  );
};

export default MoodTracker;