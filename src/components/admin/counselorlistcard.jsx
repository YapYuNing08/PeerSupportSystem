import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase-config";

function CounselorListCard() {
  const navigate = useNavigate();
  const [count, setCount] = useState(0);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const filtered = snapshot.docs.filter(
        doc =>
          doc.data().role === "counselor" ||
          doc.data().role === "moderator" ||
          doc.data().role === "student"
      );

      setCount(filtered.length);
    });

    return () => unsub();
  }, []);

  return (
    <div
      className="admin-card"
      style={{ cursor: "pointer" }}
      onClick={() => navigate("/admin/users")}
    >
      <div className="card-icon"></div>

      <div className="card-info text-center">
        <h3>{count}</h3>
        <p>Total Users</p>
        <p>Student • Counselor • Moderator</p>
      </div>
    </div>
  );
}

export default CounselorListCard;
