import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../../firebase-config";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc
} from "firebase/firestore";

const CreatePostPage = () => {
  const { forumId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [username, setUsername] = useState("");

  // 🔹 Fetch username once
  useEffect(() => {
    const fetchUsername = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        setUsername(snap.data().username);
      }
    };

    fetchUsername();
  }, []);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;

    await addDoc(collection(db, "posts"), {
      forumId,
      title,
      content,
      isAnonymous,
      authorId: auth.currentUser.uid,
      authorName: isAnonymous ? "Anonymous" : username,
      createdAt: serverTimestamp(),
    });

    navigate(`/forum/${forumId}`);
  };

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "0 auto" }}>
      <h2>Create Post</h2>

      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: "100%", marginBottom: 10 }}
      />

      <textarea
        placeholder="Content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{ width: "100%", height: 120 }}
      />

      <label style={{ display: "block", marginTop: 10 }}>
        <input
          type="checkbox"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
        />{" "}
        Post anonymously
      </label>

      <button style={{ marginTop: 15 }} onClick={handleSubmit}>
        Post
      </button>
    </div>
  );
};

export default CreatePostPage;
