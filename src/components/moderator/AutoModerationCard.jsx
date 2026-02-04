import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../firebase-config";

function AutoModerationCard() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "moderationKeywords"), (snap) => {
      setCount(snap.docs.length);
    });
    return () => unsub();
  }, []);

  return (
    <div className="admin-card">
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "32px" }}>⚙️</span>
        <strong style={{ fontSize: "23px", color: "#2a4365" }}>
          Auto-Moderation
        </strong>
      </div>

      {/* Number */}
      <h3 style={{ marginTop: "15px" }}>{count}</h3>

      {/* Description */}
      <p>Active banned keywords   </p>
    </div>
  );
}

export default AutoModerationCard;
