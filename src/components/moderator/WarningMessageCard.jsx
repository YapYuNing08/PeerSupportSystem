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
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "32px" }}>⚠️</span>
        <strong style={{ fontSize: "23px", color: "#2a4365" }}>
          Warning Messages
        </strong>
      </div>

      {/* Number */}
      <h3 style={{ marginTop: "15px" }}>{count}</h3>

      {/* Description */}
      <p>Pending warnings not yet sent</p>
    </div>
  );
}

export default WarningMessageCard;
