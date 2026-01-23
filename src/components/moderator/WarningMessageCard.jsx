import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../firebase-config";

function WarningMessageCard() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const q = query(
      collection(db, "warning"),
      where("status", "==", "pending")
    );

    const unsub = onSnapshot(q, (snap) => {
      setCount(snap.size);
    });

    return () => unsub();
  }, []);

  return (
    <div className="admin-card">
      <h3>⚠️ Warning Messages</h3>
      <p className="admin-card-number">{count}</p>
      <p className="admin-card-desc">
        Pending warnings not yet sent to students
      </p>
    </div>
  );
}

export default WarningMessageCard;
