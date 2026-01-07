import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../firebase-config";

function FlaggedContentCard() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "flaggedContent"), (snap) => {
      setCount(snap.docs.length);
    });
    return () => unsub();
  }, []);

  return (
    <div className="admin-card">
      <h3>🚩 Flagged Content</h3>
      <p className="admin-card-number">{count}</p>
      <p className="admin-card-desc">Posts & comments pending review</p>
    </div>
  );
}

export default FlaggedContentCard;
