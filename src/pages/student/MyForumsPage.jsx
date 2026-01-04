import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase-config";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import JoinForumCard from "../../components/student/JoinForumCard";

const MyForumsPage = () => {
  const [forums, setForums] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyForums = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, "forumMembers"),
        where("userId", "==", user.uid)
      );

      const snapshot = await getDocs(q);

      const forumPromises = snapshot.docs.map(async (m) => {
        const forumRef = doc(db, "forums", m.data().forumId);
        const forumSnap = await getDoc(forumRef);
        return forumSnap.exists()
          ? { id: forumSnap.id, ...forumSnap.data() }
          : null;
      });

      const forumResults = (await Promise.all(forumPromises)).filter(Boolean);
      setForums(forumResults);
    };

    fetchMyForums();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>My Forums</h2>

      {/* Join Forum Card */}
      <JoinForumCard />

      {/* Joined Forums */}
      {forums.length === 0 ? (
        <p>You haven’t joined any forums yet.</p>
      ) : (
        forums.map((forum) => (
          <div
            key={forum.id}
            className="forum-card"
            onClick={() => navigate(`/forum/${forum.id}`)}
          >
            <h3>{forum.name}</h3>
            <p>{forum.description}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default MyForumsPage;
