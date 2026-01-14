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
import StudentLayout from "../../components/layout/StudentLayout"; 

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
    <div style={s.pageWrapper}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
        .back-circle:hover { background-color: #f1f5f9; transform: scale(1.05); }
        input:focus, textarea:focus { border-color: #6366f1 !important; outline: none; }
        .post-btn:active { transform: scale(0.98); }
      `}</style>

      {/* 🔹 Back Button */}
      <div style={s.navRow}>
        <button 
          className="back-circle" 
          style={s.backBtnCircle} 
          onClick={() => navigate(`/forum/${forumId}`)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
      </div>

      {/* 🔹 Header */}
      <div style={s.header}>
        <h1 style={s.titleText}>Create Post</h1>
        <p style={s.subtitle}>Share your thoughts with the community</p>
      </div>

      {/* 🔹 Form Big Box */}
      <div style={s.formBox}>
        <input
          placeholder="Give your post a title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={s.input}
        />

        <div style={s.divider} />

        <textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={s.textarea}
        />

        <div style={s.footer}>
          <label style={s.anonLabel}>
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              style={s.checkbox}
            />
            Post anonymously
          </label>

          <button 
            className="post-btn" 
            style={{ 
                ...s.postBtn, 
                opacity: (title.trim() && content.trim()) ? 1 : 0.6 
            }} 
            onClick={handleSubmit}
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
};

const s = {
  pageWrapper: { 
    backgroundColor: "#f8fafc", 
    minHeight: "100vh", 
    padding: "20px 24px 80px 24px", 
    fontFamily: "'Plus Jakarta Sans', sans-serif", 
    color: "#1e293b" 
  },
  navRow: { display: 'flex', justifyContent: 'flex-start', marginBottom: '32px' },
  backBtnCircle: { 
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '42px', height: '42px', borderRadius: '50%', 
    backgroundColor: '#ffffff', border: '1px solid #f1f5f9',
    color: '#64748b', cursor: 'pointer', transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
  },
  header: { marginBottom: '32px' },
  titleText: { fontSize: "32px", fontWeight: "800", color: "#0f172a", marginBottom: "8px", letterSpacing: '-0.03em' },
  subtitle: { fontSize: '15px', color: '#64748b', fontWeight: '500' },
  
  formBox: { 
    backgroundColor: "#ffffff", 
    borderRadius: "24px", 
    border: "1px solid #f1f5f9", 
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.04)", 
    padding: '24px',
    display: 'flex',
    flexDirection: 'column'
  },
  input: {
    width: '100%',
    border: 'none',
    fontSize: '22px',
    fontWeight: '700',
    color: '#1e293b',
    padding: '12px 0',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box'
  },
  divider: {
    height: '1px',
    backgroundColor: '#f1f5f9',
    margin: '12px 0'
  },
  textarea: {
    width: '100%',
    height: '240px',
    border: 'none',
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#475569',
    padding: '12px 0',
    fontFamily: 'inherit',
    outline: 'none',
    resize: 'none',
    boxSizing: 'border-box'
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '24px',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '20px'
  },
  anonLabel: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '10px', 
    fontSize: '14px', 
    color: '#64748b',
    fontWeight: '600',
    cursor: 'pointer'
  },
  checkbox: {
    width: '18px',
    height: '18px',
    borderRadius: '4px',
    accentColor: '#6366f1'
  },
  postBtn: { 
    backgroundColor: "#6366f1", 
    color: "white", 
    border: "none", 
    padding: "12px 32px", 
    borderRadius: "16px", 
    fontWeight: "700", 
    fontSize: "15px",
    cursor: "pointer",
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
  },
};

export default CreatePostPage;