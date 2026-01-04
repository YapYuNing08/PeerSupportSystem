import React, { useEffect, useState } from "react";
import { db, auth } from "../../firebase-config";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./JoinForumPage.css";

function JoinForumPage() {
  const [forums, setForums] = useState([]);
  const [joinedForumIds, setJoinedForumIds] = useState([]);
  const navigate = useNavigate();

  // 🔹 Load forums + joined forums + member count
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1️⃣ Load all forums
        const forumSnap = await getDocs(collection(db, "forums"));

        // 2️⃣ Load joined forums for current user
        const memberQuery = query(
          collection(db, "forumMembers"),
          where("userId", "==", auth.currentUser.uid)
        );
        const memberSnap = await getDocs(memberQuery);
        const joinedIds = memberSnap.docs.map((d) => d.data().forumId);
        setJoinedForumIds(joinedIds);

        // 3️⃣ Attach member count to each forum
        const forumsWithCount = await Promise.all(
          forumSnap.docs.map(async (docSnap) => {
            const forumId = docSnap.id;

            const countQuery = query(
              collection(db, "forumMembers"),
              where("forumId", "==", forumId)
            );
            const countSnap = await getDocs(countQuery);

            return {
              id: forumId,
              ...docSnap.data(),
              memberCount: countSnap.size,
            };
          })
        );

        setForums(forumsWithCount);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load forums");
      }
    };

    fetchData();
  }, []);

  // 🔹 Join forum
  const handleJoinForum = async (forum) => {
    if (joinedForumIds.includes(forum.id)) {
      toast.info("You already joined this forum");
      return;
    }

    try {
      await addDoc(collection(db, "forumMembers"), {
        forumId: forum.id,
        forumName: forum.name,
        userId: auth.currentUser.uid,
        joinedAt: new Date(),
      });

      toast.success(`Joined ${forum.name}`);

      // update UI immediately
      setJoinedForumIds((prev) => [...prev, forum.id]);
      setForums((prev) =>
        prev.map((f) =>
          f.id === forum.id
            ? { ...f, memberCount: f.memberCount + 1 }
            : f
        )
      );
    } catch (error) {
      toast.error("Failed to join forum");
    }
  };

  // 🔹 Continue only if joined at least one forum
  const handleContinue = () => {
    if (joinedForumIds.length === 0) {
      toast.error("You must join at least one forum");
      return;
    }
    navigate("/student-page");
  };

  return (
    <div className="join-forum-container">
      <h2>Join a Forum</h2>
      <p className="subtitle">
        You must join at least one forum to continue
      </p>

      <div className="forum-grid">
        {forums.map((forum) => (
          <div key={forum.id} className="forum-card">
            <h4>{forum.name}</h4>
            <p>{forum.description}</p>

            {/* 🔹 Member count */}
            <small style={{ color: "#666" }}>
              👥 {forum.memberCount} member
              {forum.memberCount !== 1 && "s"}
            </small>

            {joinedForumIds.includes(forum.id) ? (
              <button className="btn joined" disabled>
                Joined
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => handleJoinForum(forum)}
              >
                Join
              </button>
            )}
          </div>
        ))}
      </div>

      <button className="btn btn-success continue-btn" onClick={handleContinue}>
        Continue
      </button>
    </div>
  );
}

export default JoinForumPage;
