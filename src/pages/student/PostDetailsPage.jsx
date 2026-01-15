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
import { reportContent } from "../../utils/reportContent";
import { checkAutoModeration } from "../../utils/checkAutoModeration";
import "./PostDetailsPage.css"; // 🔹 Standard CSS Import

const PostDetailsPage = () => {
  const { postId } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [replyTo, setReplyTo] = useState(null);

  const currentUser = auth.currentUser;

  const getAvatarStyle = (name) => {
    const gradients = [
      'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
      'linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%)',
      'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    ];
    const index = name ? name.length % gradients.length : 0;
    return { background: gradients[index] };
  };

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "posts", postId), (snap) => {
      if (snap.exists()) setPost({ id: snap.id, ...snap.data() });
    });
    return () => unsub();
  }, [postId]);

  useEffect(() => {
    if (post?.isHidden) {
      alert("This post is under moderation.");
      navigate(`/forum/${post.forumId}`);
    }
  }, [post, navigate]);

  useEffect(() => {
    const q = query(
      collection(db, "comments"),
      where("postId", "==", postId),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(c => !c.isHidden);
      setComments(list);
    });

    return () => unsub();
  }, [postId]);

  const handleAddComment = async () => {
    if (!commentText.trim() || !currentUser || !post) return;

    let authorName = "Anonymous";
    if (!isAnonymous) {
      const userSnap = await getDoc(doc(db, "users", currentUser.uid));
      if (userSnap.exists()) authorName = userSnap.data().username;
    }

    let isHarmful = await checkAutoModeration(commentText);
    if (post.approved === true) isHarmful = false;

    const commentRef = await addDoc(collection(db, "comments"), {
      postId,
      forumId: post.forumId,
      content: commentText,
      parentCommentId: replyTo || null,
      isAnonymous,
      authorId: currentUser.uid,
      authorName,
      createdAt: serverTimestamp(),
      isHidden: isHarmful,
      isFlagged: isHarmful,
      approved: isHarmful ? null : true
    });

    if (isHarmful) {
      await reportContent({
        type: "comment",
        content: commentText,
        reason: "Auto moderation detected harmful content",
        reporterId: "SYSTEM",
        authorId: currentUser.uid,
        postId,
        forumId: post.forumId,
        commentId: commentRef.id
      });
      alert("Your comment is under moderation.");
    }

    setCommentText("");
    setReplyTo(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this comment?")) {
      await deleteDoc(doc(db, "comments", id));
    }
  };

  const handleReport = (type, content, targetAuthorId, commentId = null) => {
    if (!currentUser) return alert("Please login");
    const reason = prompt(`Why are you reporting this ${type}?`);
    if (!reason) return;

    reportContent({
      type,
      content,
      reason,
      reporterId: currentUser.uid,
      authorId: targetAuthorId,
      postId: post.id,
      forumId: post.forumId,
      commentId
    });
    alert(`${type.charAt(0).toUpperCase() + type.slice(1)} reported.`);
  };

  const parentComments = comments.filter(c => !c.parentCommentId);
  const getReplies = (id) => comments.filter(c => c.parentCommentId === id);

  if (!post) return <div className="loader">Loading conversation...</div>;

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
    <div className="page-wrapper">
      <div className="nav-row">
        <button className="back-circle" onClick={() => navigate(`/forum/${post.forumId}`)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
      </div>

      <div className="post-header">
        <h1 className="post-title">{post.title}</h1>
        <div className="post-author-row">
          <div className="avatar" style={{ ...getAvatarStyle(post.authorName), width: '26px', height: '26px', fontSize: '11px' }}>
            {post.authorName?.[0]}
          </div>
          <span className="post-author-name">{post.isAnonymous ? "Anonymous" : post.authorName}</span>
          <span className="action-link" style={{marginLeft: 'auto', color: '#f87171'}} onClick={() => handleReport('post', post.content, post.authorId)}>🚩 Report</span>
        </div>
        <p className="post-content">{post.content}</p>
      </div>

      <div className="comment-big-box">
        <div className="box-header">
          <span>Discussion</span>
          <span className="comment-count-badge">{comments.length}</span>
        </div>

        <div className="comments-list">
          {parentComments.length === 0 && <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>No comments yet.</p>}

          {parentComments.map((c) => (
            <div key={c.id} className="thread">
              <div className="comment-line">
                <div className="avatar" style={getAvatarStyle(c.authorName)}>{c.authorName?.[0]}</div>
                <div className="bubble-container">
                  <div className="bubble">
                    <span className="author-name">{c.isAnonymous ? "Anonymous" : c.authorName}</span>
                    <span className="text">{c.content}</span>
                  </div>
                  <div className="actions">
                    <span className="action-link" onClick={() => setReplyTo(c.id)}>Reply</span>
                    <span className="action-link" onClick={() => handleReport('comment', c.content, c.authorId, c.id)}>Report</span>
                    {currentUser?.uid === c.authorId && (
                      <span className="action-link" style={{ color: "#f87171" }} onClick={() => handleDelete(c.id)}>Delete</span>
                    )}
                  </div>
                </div>
              </div>

              {getReplies(c.id).map((r) => (
                <div key={r.id} className="reply-line">
                  <div className="avatar" style={{ ...getAvatarStyle(r.authorName), width: "24px", height: "24px", fontSize: "10px" }}>{r.authorName?.[0]}</div>
                  <div className="bubble-container">
                    <div className="bubble" style={{ backgroundColor: "#f8fafc" }}>
                      <span className="author-name">{r.isAnonymous ? "Anonymous" : r.authorName}</span>
                      <span className="text">{r.content}</span>
                    </div>
                    <div className="actions">
                        <span className="action-link" onClick={() => handleReport('comment', r.content, r.authorId, r.id)}>Report</span>
                        {currentUser?.uid === r.authorId && (
                            <span className="action-link" style={{ color: "#f87171" }} onClick={() => handleDelete(r.id)}>Delete</span>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="input-section">
          {replyTo && (
            <div className="reply-indicator">
              <span>Replying to <b>{comments.find(c => c.id === replyTo)?.authorName}</b></span>
              <span className="cancel-reply" onClick={() => setReplyTo(null)}>✕</span>
            </div>
          )}
          <div className="input-row">
            <textarea
              className="textarea"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button className="send-btn" onClick={handleAddComment}>Send</button>
          </div>
          <label className="anon-label">
            <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />
            Post anonymously
          </label>
        </div>
      </div>
    </div>
    </StudentLayout>
  );
};

export default PostDetailsPage;