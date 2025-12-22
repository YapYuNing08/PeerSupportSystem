import React, { useEffect, useState } from "react";
import { db } from "../../firebase-config";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function PendingApprovalCard() {
  const [count, setCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCount = async () => {
      const q = query(
        collection(db, "users"),
        where("role", "==", "counselor"),
        where("status", "==", "pending")
      );
      const snapshot = await getDocs(q);
      setCount(snapshot.size);
    };
    fetchCount();
  }, []);

  return (
    <div className="admin-card" onClick={() => navigate("/admin/approve-counselors")}>
      <div className="card-icon">👥</div>
      <div className="card-info text-center">
        <h3>{count}</h3>
        <p>Approve Counselors</p>
      </div>
    </div>
  );
}

export default PendingApprovalCard;