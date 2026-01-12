import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../firebase-config";

function FlaggedContentCard() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const q = query(
      collection(db, "userReports"),
      where("approved", "==", null)
    );

    const unsub = onSnapshot(q, (snap) => {
      setCount(snap.size);
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
