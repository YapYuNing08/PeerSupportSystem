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
import StudentLayout from "../../components/layout/StudentLayout"; 
import "./ForumDetailsPage.css"; 

const ForumDetailsPage = () => {
  const { forumId } = useParams();
  const navigate = useNavigate();

  const [forum, setForum] = useState(null);
  const [posts, setPosts] = useState([]);
  const [commentCounts, setCommentCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForum = async () => {
      const forumRef = doc(db, "forums", forumId);
      const forumSnap = await getDoc(forumRef);
      if (forumSnap.exists()) setForum(forumSnap.data());
    };
    fetchForum();
  }, [forumId]);

  useEffect(() => {
    const q = query(
      collection(db, "posts"),
      where("forumId", "==", forumId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // 1️⃣ Get only visible posts
      const postList = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((p) => !p.isHidden);

      setPosts(postList);
      setLoading(false);

      // 2️⃣ For each post, count only visible comments
      postList.forEach((post) => {
        const commentQuery = query(
          collection(db, "comments"),
          where("postId", "==", post.id),
          orderBy("createdAt", "asc")
        );
        onSnapshot(commentQuery, (snap) => {
          const visibleComments = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter(c => !c.isHidden); // <-- hide flagged comments

          setCommentCounts(prev => ({ ...prev, [post.id]: visibleComments.length }));
        });
      });
    });

    return () => unsubscribe();
  }, [forumId]);

  return (
    <StudentLayout>
    <div style={s.pageWrapper}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
        
        .post-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: 1px solid #f1f5f9; }
        .post-card:hover { transform: translateY(-6px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05); border-color: #6366f1; }
        
        .masonry-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); /* Bigger Boxes */
          gap: 24px;
        }

        @media (max-width: 700px) {
          .masonry-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* 🔹 Minimal Top Nav */}
      <nav style={s.nav}>
        <button style={s.backBtn} onClick={() => navigate("/my-forums")}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
    <div className="forum-page-wrapper">
      {/* Top Nav */}
      <nav className="forum-nav">
        <button className="back-btn" onClick={() => navigate("/my-forums")}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <div className="nav-title">{forum?.name || "Forum"}</div>
        <div style={{ width: 40 }} /> 
      </nav>

      {/* Forum Header */}
      <div className="forum-header">
        <h1 className="forum-title">{forum?.name}</h1>
        <p className="forum-description">{forum?.description || "A space for thoughtful discussion and sharing."}</p>
        <div className="badge-row">
          <span className="pill-badge">{posts.length} Posts</span>
          <span className="pill-badge">Active Community</span>
        </div>
      </div>

      {/* Grid Feed */}
      <div className="masonry-grid">
        {posts.map((post) => (
          <div
            key={post.id}
            className="post-card"
            onClick={() => navigate(`/post/${post.id}`)}
          >
            <div className="card-body">
              <h3 className="card-title">{post.title}</h3>
              <p className="card-content">
                {post.content.length > 120 ? post.content.substring(0, 120) + "..." : post.content}
              </p>
            </div>
            
            <div className="card-footer">
              <div className="user-info">
                <div className="user-avatar">{post.authorName?.[0] || "U"}</div>
                <span className="user-name">{post.isAnonymous ? "Anonymous" : post.authorName}</span>
              </div>
              <div className="comment-tag">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: 6}}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                {commentCounts[post.id] || 0}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Action Button */}
      <button 
        className="fab-button"
        onClick={() => navigate(`/forum/${forumId}/new-post`)}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    </div>
    </StudentLayout>
  );
};

export default ForumDetailsPage;
