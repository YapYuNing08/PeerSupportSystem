import React, { useEffect, useState } from "react";
import { db } from "../../firebase-config";
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp, getDoc, setDoc } from "firebase/firestore";
import "./WarningMessagePage.css"; 
import { useNavigate } from "react-router-dom";

function WarningMessagePage() {
  const [warnings, setWarnings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const fetchAuthorName = async (uid) => {
    if (!uid) return "Unknown";
    const userSnap = await getDoc(doc(db, "users", uid));
    return userSnap.exists() ? userSnap.data().username : "Unknown";
  };

  const fetchWarnings = async () => {
    const snapshot = await getDocs(collection(db, "warnings"));
    const list = await Promise.all(
      snapshot.docs.map(async (d) => {
        const data = d.data();
        const authorName = await fetchAuthorName(data.authorId);
        return { id: d.id, ...data, authorName };
      })
    );
    setWarnings(list);
  };

  useEffect(() => {
    fetchWarnings();
  }, []);

  const handleSelect = (warning) => {
    setSelected(warning);
    setMessage("");
  };

  const handleSend = async () => {
    if (!message.trim()) return alert("Message cannot be empty");
    if (!selected) return;

    try {
      // 1️⃣ Send warning to student
      await addDoc(collection(db, "userWarnings"), {
        userId: selected.authorId,
        authorName: selected.authorName,
        type: selected.type,
        reason: selected.reason,
        content: selected.contentText || "",
        moderatorMessage: message,
        createdAt: serverTimestamp(),
        read: false,
      });

      // 2️⃣ Mark warning as sent
      await updateDoc(doc(db, "warnings", selected.id), {
        sent: true,
        sentAt: serverTimestamp()
      });

      // 3️⃣ Get current warning count
      const statRef = doc(db, "userWarningStats", selected.authorId);
      const statSnap = await getDoc(statRef);

      let count = 1;
      if (statSnap.exists()) {
        count = statSnap.data().count + 1;
      }

      // 4️⃣ If count reaches 3 → notify admin & reset
      if (count === 3) {
        await addDoc(collection(db, "adminNotifications"), {
          studentId: selected.authorId,
          username: selected.authorName,
          reason: "Student received 3 warnings",
          createdAt: serverTimestamp(),
          handled: false,
        });

        // reset counter
        await setDoc(statRef, {
          count: 0,
          updatedAt: serverTimestamp(),
        });
      } else {
        // normal increment
        await setDoc(statRef, {
          count: count,
          updatedAt: serverTimestamp(),
        });
      }

      alert("Warning sent successfully");
      setSelected(null);
      setMessage("");
      fetchWarnings();

    } catch (err) {
      console.error(err);
      alert("Failed to send warning.");
    }
  };


  const pendingWarnings = warnings.filter(w => !w.sent);
  const sentWarnings = warnings.filter(w => w.sent);

  return (
    <div className="warning-page-container">
      <button className="btn-back" onClick={() => navigate("/moderator-dashboard")}>
          ← Back to Moderator Dashboard
        </button>
      <h2 className="warning-main-title">⚠️ Warning Queue</h2>

      <div className="warning-layout">
        {/* Left Column */}
        <div className="warning-list-column">
          <h3>Pending Warnings</h3>
          {pendingWarnings.length === 0 ? (
            <p>No pending warnings.</p>
          ) : (
            <ul className="warning-item-list">
              {pendingWarnings.map(w => (
                <li key={w.id}>
                  <button className="warning-select-btn" onClick={() => handleSelect(w)}>
                    <strong>[{w.type || "Unknown"}]</strong> {w.authorName} - {(w.contentText || "").slice(0, 40)}...
                  </button>
                </li>
              ))}
            </ul>
          )}

          <h3 style={{ marginTop: "40px" }}>Sent Warnings</h3>
          {sentWarnings.length === 0 ? (
            <p>No sent warnings yet.</p>
          ) : (
            <ul className="warning-item-list">
              {sentWarnings.map(w => (
                <li key={w.id}>
                  <button className="warning-select-btn" onClick={() => handleSelect(w)}>
                    <strong>[{w.type || "Unknown"}]</strong> {w.authorName} ✅ Sent
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right Column */}
        {selected && (
          <div className="warning-details-column">
            <h3>Warning Details</h3>
            <div className="warning-detail-row"><strong>Student:</strong> {selected.authorName}</div>
            <div className="warning-detail-row"><strong>Type:</strong> {selected.type || "Unknown"}</div>
            <div className="warning-detail-row"><strong>Reason:</strong> {selected.reason || "No reason"}</div>
            <div className="warning-detail-row">
                <strong>Flagged Content:</strong> 
                <p style={{fontStyle: 'italic', color: '#64748b', marginTop: '8px'}}>"{selected.contentText || ""}"</p>
            </div>

            {!selected.sent && (
              <>
                <textarea
                  className="warning-textarea"
                  rows={6}
                  placeholder="Provide guidance or a private message to the student explaining the violation..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
                <button className="warning-send-btn" onClick={handleSend}>Send Warning</button>
              </>
            )}

            <button className="warning-close-btn" onClick={() => setSelected(null)}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default WarningMessagePage;