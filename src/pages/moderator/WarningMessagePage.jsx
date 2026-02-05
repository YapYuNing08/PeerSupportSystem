import React, { useEffect, useState } from "react";
import { db, auth} from "../../firebase-config";
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
    const snapshot = await getDocs(collection(db, "warning"));

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

    // forumId required (your rule)
    if (!selected.forumId) {
      alert("Error: forumId is missing in this warning.");
      return;
    }

    try {
      const studentId = selected.authorId;
      const studentName = selected.authorName;

     
      // 1) Create student notification 
      await addDoc(collection(db, "notifications"), {
        targetRole: "student",
        userId: studentId,
        type: "warning",
        authorName: studentName, // you requested authorName
        message: message,
        // optional extra info (safe to keep)
        forumId: selected.forumId,
        postId: selected.postId || null,
        commentId: selected.commentId || null,
        reason: selected.reason || null,
        content: selected.content || selected.contentText || "",
        createdAt: serverTimestamp()
      });


      // 2) Mark warning as sent (status)
      await updateDoc(doc(db, "warning", selected.id), {
        status: "sent",
        sentAt: serverTimestamp(),
        sentBy: auth.currentUser?.uid || null
      });


      // 3) Update user warningCount in users
      const userRef = doc(db, "users", studentId);
      const userSnap = await getDoc(userRef);

      const currentCount = userSnap.exists()
        ? (userSnap.data().warningCount ?? 0)
        : 0;

      const newCount = currentCount + 1;

      await updateDoc(userRef, {
        warningCount: newCount
      });


      // 4) If warningCount reaches 3 -> notify admins (multi-admin)
      if (newCount === 3) {
        await addDoc(collection(db, "notifications"), {
          targetRole: "admin",
          type: "warning_threshold",
          studentId: studentId,
          username: studentName,
          message: "Student received 3 warnings",
          handled: false,
          createdAt: serverTimestamp()
        });
      }

      alert("Warning sent successfully!");
      setSelected(null);
      setMessage("");
      fetchWarnings();
    } catch (err) {
      console.error(err);
      alert("Failed to send warning.");
    }
  };

  const pendingWarnings = warnings.filter((w) => w.status !== "sent");
  const sentWarnings = warnings.filter((w) => w.status === "sent");

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
                    <strong>[{w.type || "Unknown"}]</strong> {w.authorName} -{" "}
                    {((w.content || w.contentText || "").slice(0, 40))}...
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
                <p style={{fontStyle: 'italic', color: '#64748b', marginTop: '8px'}}>"{ selected.content|| selected.contentText || ""}"</p>
            </div>

            {selected.status !== "sent" && (
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