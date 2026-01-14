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
      const postList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPosts(postList);
      setLoading(false);

      postList.forEach((post) => {
        const commentQuery = query(collection(db, "comments"), where("postId", "==", post.id));
        onSnapshot(commentQuery, (snap) => {
          setCommentCounts(prev => ({ ...prev, [post.id]: snap.size }));
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
        </button>
        <div style={s.navTitle}>{forum?.name || "Community"}</div>
        <div style={{ width: 40 }} /> 
      </nav>

      {/* 🔹 Forum Header */}
      <div style={s.header}>
        <h1 style={s.forumTitle}>{forum?.name}</h1>
        <p style={s.description}>{forum?.description || "A space for thoughtful discussion and sharing."}</p>
        <div style={s.badgeRow}>
          <span style={s.pillBadge}>{posts.length} Posts</span>
          <span style={s.pillBadge}>Active Community</span>
        </div>
      </div>

      {/* 🔹 Grid Feed with Bigger Boxes */}
      <div className="masonry-grid">
        {posts.map((post) => (
          <div
            key={post.id}
            className="post-card"
            style={s.card}
            onClick={() => navigate(`/post/${post.id}`)}
          >
            <div style={s.cardBody}>
              <h3 style={s.cardTitle}>{post.title}</h3>
              <p style={s.cardContent}>
                {post.content.length > 120 ? post.content.substring(0, 120) + "..." : post.content}
              </p>
            </div>
            
            <div style={s.cardFooter}>
              <div style={s.userInfo}>
                <div style={s.avatar}>{post.authorName?.[0] || "U"}</div>
                <span style={s.userName}>{post.isAnonymous ? "Anonymous" : post.authorName}</span>
              </div>
              <div style={s.commentTag}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: 6}}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                {commentCounts[post.id] || 0}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 🔹 Floating Action Button (Indigo instead of Red) */}
      <button 
        style={s.fab} 
        onClick={() => navigate(`/forum/${forumId}/new-post`)}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </button>
    </div>
    </StudentLayout>
  );
};

const s = {
  pageWrapper: {
    backgroundColor: "#f8fafc", // Very soft slate tint
    minHeight: "100vh",
    padding: "0 24px 120px 24px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 0",
    position: "sticky",
    top: 0,
    backgroundColor: "rgba(248, 250, 252, 0.8)",
    backdropFilter: "blur(10px)",
    zIndex: 10
  },
  backBtn: { background: "none", border: "none", cursor: "pointer", color: "#64748b" },
  navTitle: { fontSize: "16px", fontWeight: "700", color: "#1e293b" },
  header: { textAlign: "left", padding: "20px 0 40px 0" },
  forumTitle: { fontSize: "36px", fontWeight: "800", color: "#0f172a", marginBottom: "12px", letterSpacing: "-0.03em" },
  description: { color: "#64748b", fontSize: "16px", marginBottom: "18px", maxWidth: "600px", lineHeight: "1.6" },
  badgeRow: { display: "flex", gap: "10px" },
  pillBadge: { 
    backgroundColor: "#f1f5f9", color: "#475569", 
    padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" 
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    cursor: "pointer",
    height: "220px", // Consistent larger box height
  },
  cardBody: { flex: 1 },
  cardTitle: { 
    fontSize: "20px", 
    fontWeight: "700", 
    color: "#1e293b", 
    margin: "0 0 12px 0",
    lineHeight: "1.3",
  },
  cardContent: { fontSize: "14px", color: "#64748b", lineHeight: "1.6", margin: 0 },
  cardFooter: { 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginTop: "20px",
    paddingTop: "16px",
    borderTop: "1px solid #f1f5f9"
  },
  userInfo: { display: "flex", alignItems: "center", gap: "10px" },
  avatar: { 
    width: "28px", height: "28px", borderRadius: "8px", backgroundColor: "#6366f1", 
    color: "#FFF", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold"
  },
  userName: { fontSize: "13px", color: "#334155", fontWeight: "600" },
  commentTag: { fontSize: "13px", color: "#6366f1", fontWeight: "700", display: "flex", alignItems: "center" },
  fab: {
    position: "fixed",
    bottom: "40px",
    right: "40px",
    width: "60px",
    height: "60px",
    borderRadius: "20px",
    backgroundColor: "#6366f1", // Indigo
    color: "white",
    border: "none",
    boxShadow: "0 15px 30px rgba(99, 102, 241, 0.3)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    transition: "transform 0.2s ease"
  }
};

export default ForumDetailsPage;