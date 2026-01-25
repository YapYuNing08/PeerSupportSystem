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
import { toast } from "react-toastify";
import StudentLayout from "../../components/layout/StudentLayout"; 
import { checkAutoModeration } from "../../utils/checkAutoModeration";
import { reportContent } from "../../utils/reportContent";
import "./CreatePostPage.css";

const CreatePostPage = () => {
  const { forumId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [username, setUsername] = useState("");

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) return;

    //check if user is suspendded
    const userRef = doc(db, "users", auth.currentUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists() && userSnap.data().status === "suspended") {
      const endDate = new Date(userSnap.data().suspensionEnd).toLocaleDateString();
      toast.error(`⛔ You are suspended from posting until ${endDate}.`);
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // 🔍 AUTO MODERATION CHECK
    const isHarmful = await checkAutoModeration(`${title} ${content}`);

    // 📝 CREATE POST
    const postRef = await addDoc(collection(db, "posts"), {
      forumId,
      title,
      content,
      isAnonymous,
      authorId: currentUser.uid,
      authorName: isAnonymous ? "Anonymous" : username,
      createdAt: serverTimestamp(),
      status: isHarmful ? "hidden" : "active",
      reportCount: 0
    });

    // 🚩 AUTO REPORT IF HARMFUL
    if (isHarmful) {
      await reportContent({
        type: "post",
        content,
        reason: "Auto moderation keyword detected",
        reporterId: "SYSTEM",
        authorId: currentUser.uid,
        postId: postRef.id,
        forumId
      });
      toast.warning("⚠️ Your post has been flagged for review by moderators.");
    } else {
      toast.success("✅ Post created successfully!");
    }

    navigate(`/forum/${forumId}`);
  };

  const isFormValid = title.trim() && content.trim();

  return (
    <div className="page-wrapper">
      {/* 🔹 Back Button */}
      <div className="nav-row">
        <button
          className="back-circle"
          onClick={() => navigate(`/forum/${forumId}`)}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
      </div>

      {/* 🔹 Header */}
      <div className="header">
        <h1 className="title-text">Create Post</h1>
        <p className="subtitle">Share your thoughts with the forum</p>
      </div>

      {/* 🔹 Form */}
      <div className="form-box">
        <input
          placeholder="Give your post a title..."
          className="input-field"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="divider" />

        <textarea
          placeholder="What's on your mind?"
          className="textarea-field"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <div className="footer">
          <label className="anon-label">
            <input
              type="checkbox"
              className="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
            />
            Post anonymously
          </label>

          <button
            className="post-btn"
            style={{ opacity: isFormValid ? 1 : 0.6 }}
            onClick={handleSubmit}
            disabled={!isFormValid}
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePostPage;
