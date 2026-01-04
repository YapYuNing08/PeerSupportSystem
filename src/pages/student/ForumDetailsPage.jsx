import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../firebase-config";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc
} from "firebase/firestore";

const ForumDetailsPage = () => {
  const { forumId } = useParams();
  const navigate = useNavigate();

  const [forum, setForum] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Fetch forum info
  useEffect(() => {
    const fetchForum = async () => {
      const forumRef = doc(db, "forums", forumId);
      const forumSnap = await getDoc(forumRef);
      if (forumSnap.exists()) {
        setForum(forumSnap.data());
      }
    };
    fetchForum();
  }, [forumId]);

  // 🔹 Real-time posts
  useEffect(() => {
    const q = query(
      collection(db, "posts"),
      where("forumId", "==", forumId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(postList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [forumId]);

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "0 auto" }}>

      {/* 🔹 Back to Forums */}
      <button
        onClick={() => navigate("/my-forums")}
        style={{
          background: "none",
          border: "none",
          color: "#4f46e5",
          fontWeight: 600,
          cursor: "pointer",
          padding: 0,
          marginBottom: 10
        }}
      >
        ← Back to Forums
      </button>

      {/* 🔹 Forum Header */}
      <h2>{forum ? forum.name : "Forum"}</h2>
      {forum?.description && (
        <p style={{ color: "#666" }}>{forum.description}</p>
      )}

      <button
        style={{ marginBottom: 20 }}
        onClick={() => navigate(`/forum/${forumId}/new-post`)}
      >
        ➕ Create Post
      </button>

      {loading && <p>Loading posts...</p>}
      {!loading && posts.length === 0 && <p>No posts yet.</p>}

      {posts.map((post) => (
        <div
          key={post.id}
          className="forum-card"
          style={{ cursor: "pointer", marginBottom: 15 }}
          onClick={() => navigate(`/post/${post.id}`)}
        >
          <h3>{post.title}</h3>

          <small style={{ color: "#666" }}>
            Posted by{" "}
            <strong>
              {post.isAnonymous ? "Anonymous" : post.authorName}
            </strong>
          </small>

          <p style={{ marginTop: 8 }}>
            {post.content.length > 100
              ? post.content.substring(0, 100) + "..."
              : post.content}
          </p>
        </div>
      ))}
    </div>
  );
};

export default ForumDetailsPage;
