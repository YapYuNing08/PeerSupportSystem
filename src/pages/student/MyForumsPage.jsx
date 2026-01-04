import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase-config";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import JoinForumCard from "../../components/student/JoinForumCard";

const MyForumsPage = () => {
  const [forums, setForums] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyForums = async () => {
      const user = auth.currentUser;
      if (!user) return;

      // 🔹 get joined forums
      const q = query(
        collection(db, "forumMembers"),
        where("userId", "==", user.uid)
      );

      const snapshot = await getDocs(q);

      const forumPromises = snapshot.docs.map(async (m) => {
        const forumId = m.data().forumId;

        // 🔹 get forum info
        const forumRef = doc(db, "forums", forumId);
        const forumSnap = await getDoc(forumRef);
        if (!forumSnap.exists()) return null;

        // 🔹 count members
        const memberQuery = query(
          collection(db, "forumMembers"),
          where("forumId", "==", forumId)
        );
        const memberSnap = await getDocs(memberQuery);

        return {
          id: forumSnap.id,
          ...forumSnap.data(),
          memberCount: memberSnap.size,
        };
      });

      const forumResults = (await Promise.all(forumPromises)).filter(Boolean);
      setForums(forumResults);
    };

    fetchMyForums();
  }, []);

  return (
    <div style={{ padding: "20px", maxWidth: 900, margin: "0 auto" }}>
      <h2>My Forums</h2>

      {/* 🔹 Join Forum */}
      <JoinForumCard />

      {/* 🔹 Joined Forums */}
      {forums.length === 0 ? (
        <p>You haven’t joined any forums yet.</p>
      ) : (
        forums.map((forum) => (
          <div
            key={forum.id}
            className="forum-card"
            style={{ cursor: "pointer", marginBottom: 15 }}
            onClick={() => navigate(`/forum/${forum.id}`)}
          >
            <h3>{forum.name}</h3>
            <p>{forum.description}</p>

            {/* 🔹 Member count */}
            <small style={{ color: "#666" }}>
              👥 {forum.memberCount} member
              {forum.memberCount !== 1 && "s"}
            </small>
          </div>
        ))
      )}
    </div>
  );
};

export default MyForumsPage;
