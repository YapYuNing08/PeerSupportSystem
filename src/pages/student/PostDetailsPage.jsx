import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../../firebase-config";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot
} from "firebase/firestore";
import StudentLayout from "../../components/layout/StudentLayout"; 

const PostDetailsPage = () => {
  const { postId } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [replyTo, setReplyTo] = useState(null);

  const currentUser = auth.currentUser;

  useEffect(() => {
    const postRef = doc(db, "posts", postId);
    const unsub = onSnapshot(postRef, (snap) => {
      if (snap.exists()) setPost({ id: snap.id, ...snap.data() });
    });
    return () => unsub();
  }, [postId]);

  useEffect(() => {
    const q = query(
      collection(db, "comments"),
      where("postId", "==", postId),
      orderBy("createdAt", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setComments(list);
    });
    return () => unsubscribe();
  }, [postId]);

  const handleAddComment = async () => {
    if (!commentText.trim() || !currentUser) return;
    let authorName = "Anonymous";
    if (!isAnonymous) {
      const userSnap = await getDoc(doc(db, "users", currentUser.uid));
      if (userSnap.exists()) authorName = userSnap.data().username;
    }
    await addDoc(collection(db, "comments"), {
      postId, content: commentText, parentCommentId: replyTo,
      isAnonymous, authorId: currentUser.uid, authorName, createdAt: serverTimestamp(),
    });
    setCommentText(""); setReplyTo(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this comment?")) await deleteDoc(doc(db, "comments", id));
  };

  const getAvatarStyle = (name) => {
    const gradients = [
      'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
      'linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%)',
      'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    ];
    const index = name ? name.length % gradients.length : 0;
    return { background: gradients[index] };
  };

  const parentComments = comments.filter((c) => !c.parentCommentId);
  const getReplies = (id) => comments.filter((c) => c.parentCommentId === id);

  if (!post) return <div style={s.loader}>Loading conversation...</div>;

  return (
    <StudentLayout>
    <div style={s.pageWrapper}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
        .back-circle:hover { background-color: #f1f5f9; transform: scale(1.05); }
        textarea:focus { border-color: #6366f1 !important; }
      `}</style>

      {/* 🔹 Left-aligned Back Button */}
      <div style={s.navRow}>
        <button 
          className="back-circle" 
          style={s.backBtnCircle} 
          onClick={() => navigate(`/forum/${post.forumId}`)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
      </div>

      <div style={s.postHeader}>
        <h1 style={s.postTitle}>{post.title}</h1>
        <div style={s.postAuthorRow}>
           <div style={{ ...s.avatar, ...getAvatarStyle(post.authorName), width: '26px', height: '26px', fontSize: '11px' }}>
              {post.authorName?.[0]}
           </div>
           <span style={s.postAuthorName}>{post.isAnonymous ? "Anonymous" : post.authorName}</span>
        </div>
        <p style={s.postContent}>{post.content}</p>
      </div>

      <div style={s.commentBigBox}>
        <div style={s.boxHeader}>
          <span>Discussion</span>
          <span style={s.commentCountBadge}>{comments.length}</span>
        </div>
        
        <div style={s.commentsList}>
          {parentComments.length === 0 && (
            <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "14px", padding: '20px' }}>No comments yet.</p>
          )}

          {parentComments.map((c) => (
            <div key={c.id} style={s.thread}>
              <div style={s.commentLine}>
                <div style={{ ...s.avatar, ...getAvatarStyle(c.authorName) }}>{c.authorName?.[0] || "A"}</div>
                <div style={s.bubbleContainer}>
                  <div style={s.bubble}>
                    <span style={s.authorName}>{c.isAnonymous ? "Anonymous" : c.authorName}</span>
                    <span style={s.text}>{c.content}</span>
                  </div>
                  <div style={s.actions}>
                    <span style={s.actionLink} onClick={() => setReplyTo(c.id)}>Reply</span>
                    {currentUser?.uid === c.authorId && (
                      <span style={{ ...s.actionLink, color: "#f87171" }} onClick={() => handleDelete(c.id)}>Delete</span>
                    )}
                  </div>
                </div>
              </div>

              {getReplies(c.id).map((r) => (
                <div key={r.id} style={s.replyLine}>
                  <div style={{ ...s.avatar, width: "24px", height: "24px", fontSize: "10px", ...getAvatarStyle(r.authorName) }}>{r.authorName?.[0] || "A"}</div>
                  <div style={s.bubbleContainer}>
                    <div style={{ ...s.bubble, backgroundColor: "#f8fafc" }}>
                      <span style={s.authorName}>{r.isAnonymous ? "Anonymous" : r.authorName}</span>
                      <span style={s.text}>{r.content}</span>
                    </div>
                    {currentUser?.uid === r.authorId && (
                      <span style={{ ...s.actionLink, color: "#f87171", marginLeft: "12px", marginTop: '4px' }} onClick={() => handleDelete(r.id)}>Delete</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={s.inputSection}>
          {replyTo && (
            <div style={s.replyIndicator}>
              Replying to <b>{comments.find(c => c.id === replyTo)?.authorName}</b>
              <span style={s.cancelReply} onClick={() => setReplyTo(null)}>✕</span>
            </div>
          )}
          <div style={s.inputRow}>
            <textarea
              style={s.textarea}
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button style={s.sendBtn} onClick={handleAddComment}>Send</button>
          </div>
          <label style={s.anonLabel}>
            <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />
            Post anonymously
          </label>
        </div>
      </div>
    </div>
    </StudentLayout>
  );
};

const s = {
  pageWrapper: { backgroundColor: "#f8fafc", minHeight: "100vh", padding: "20px 24px 80px 24px", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1e293b", boxSizing: "border-box" },
  loader: { textAlign: "center", padding: "100px", color: "#64748b" },
  
  // 🔹 New Navigation Row
  navRow: { display: 'flex', justifyContent: 'flex-start', marginBottom: '20px' },
  backBtnCircle: { 
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '42px', height: '42px', borderRadius: '50%', 
    backgroundColor: '#ffffff', border: '1px solid #f1f5f9',
    color: '#64748b', cursor: 'pointer', transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
  },
  
  postHeader: { marginBottom: "32px", padding: '0 8px' },
  postTitle: { fontSize: "30px", fontWeight: "800", color: "#0f172a", marginBottom: "12px", letterSpacing: '-0.03em' },
  postAuthorRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' },
  postAuthorName: { fontSize: '14px', fontWeight: '600', color: '#64748b' },
  postContent: { fontSize: "17px", color: "#475569", lineHeight: "1.7", marginBottom: "16px" },
  
  commentBigBox: { backgroundColor: "#ffffff", borderRadius: "24px", border: "1px solid #f1f5f9", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.04)", overflow: "hidden" },
  boxHeader: { padding: "20px 24px", borderBottom: "1px solid #f1f5f9", fontWeight: "700", fontSize: "17px", color: "#1e293b", display: 'flex', alignItems: 'center', gap: '10px' },
  commentCountBadge: { backgroundColor: '#f1f5f9', color: '#6366f1', padding: '2px 10px', borderRadius: '12px', fontSize: '12px' },
  commentsList: { padding: "24px", maxHeight: "600px", overflowY: "auto" },
  thread: { marginBottom: "24px" },
  commentLine: { display: "flex", gap: "12px", marginBottom: "4px" },
  replyLine: { display: "flex", gap: "10px", marginLeft: "44px", marginTop: "12px" },
  avatar: { width: "32px", height: "32px", borderRadius: "10px", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", flexShrink: 0 },
  bubbleContainer: { display: "flex", flexDirection: "column", alignItems: "flex-start" },
  bubble: { padding: "10px 16px", borderRadius: "18px", backgroundColor: "#fff", border: "1px solid #f1f5f9", display: "flex", gap: "8px", alignItems: "baseline" },
  authorName: { fontWeight: "700", fontSize: "13px", color: "#1e293b" },
  text: { fontSize: "14px", color: "#475569", wordBreak: "break-word", lineHeight: '1.5' },
  actions: { paddingLeft: "12px", marginTop: "6px", display: "flex", gap: "12px" },
  actionLink: { fontSize: "11px", color: "#94a3b8", fontWeight: "700", cursor: "pointer", textTransform: 'uppercase' },
  
  inputSection: { padding: "24px", borderTop: "1px solid #f1f5f9", backgroundColor: "#fcfdfe" },
  inputRow: { display: "flex", gap: "12px", alignItems: "flex-end" },
  textarea: { flex: 1, height: "46px", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "12px 20px", fontSize: "14px", fontFamily: "inherit", outline: "none", resize: "none" },
  sendBtn: { backgroundColor: "#6366f1", color: "white", border: "none", padding: "12px 24px", borderRadius: "16px", fontWeight: "700", cursor: "pointer" },
  anonLabel: { display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#64748b", marginTop: "12px" },
  replyIndicator: { fontSize: "12px", color: "#6366f1", marginBottom: "12px", display: "flex", justifyContent: "space-between", padding: "0 10px" },
  cancelReply: { cursor: "pointer", fontWeight: "bold", color: '#94a3b8' }
};

export default PostDetailsPage;