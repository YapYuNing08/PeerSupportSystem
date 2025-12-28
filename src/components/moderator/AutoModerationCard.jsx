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
      <h3>⚙️ Auto-Moderation</h3>
      <p className="admin-card-number">{count}</p>
      <p className="admin-card-desc">Active banned keywords</p>
    </div>
  );
}

export default AutoModerationCard;
