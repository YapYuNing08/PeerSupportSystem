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

  // 🔹 Load forums + joined forums
  useEffect(() => {
    const fetchData = async () => {
      const forumSnap = await getDocs(collection(db, "forums"));
      setForums(
        forumSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );

      const memberQuery = query(
        collection(db, "forumMembers"),
        where("userId", "==", auth.currentUser.uid)
      );
      const memberSnap = await getDocs(memberQuery);
      setJoinedForumIds(memberSnap.docs.map((d) => d.data().forumId));
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
      setJoinedForumIds((prev) => [...prev, forum.id]);
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
