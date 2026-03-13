import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../firebase-config";

function FlaggedContentCard() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "reports"), async (snap) => {
      const results = await Promise.all(
        snap.docs.map(async (d) => {
          const data = d.data();

          // SYSTEM always appears
          if (data.reporterId === "SYSTEM") return true;

          // otherwise: only appear if target reportCount >= 3
          try {
            if (data.type === "post" && data.postId) {
              const postSnap = await getDoc(doc(db, "posts", data.postId));
              return postSnap.exists() && (postSnap.data().reportCount || 0) >= 3;
            }

            if (data.type === "comment" && data.commentId) {
              const commentSnap = await getDoc(doc(db, "comments", data.commentId));
              return commentSnap.exists() && (commentSnap.data().reportCount || 0) >= 3;
            }
          } catch (err) {
            console.error("Error checking target reportCount:", err);
          }

          return false;
        })
      );

      // count how many TRUE (same as how many report docs will show)
      setCount(results.filter(Boolean).length);
    });

    return () => unsub();
  }, []);
  
  return (
    <div className="admin-card">
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "32px" }}>🚩</span>
        <strong style={{ fontSize: "23px", color: "#2a4365" }}>
          Flagged Content
        </strong>
      </div>

      {/* number */}
      <h3 style={{ marginTop: "15px" }}>{count}</h3>

      {/* description */}
      <p>Posts & comments pending review </p>
    </div>
  );
}

export default FlaggedContentCard;
