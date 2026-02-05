import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../../firebase-config";
import {
  doc,
  collection,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  getDoc
} from "firebase/firestore";
import StudentLayout from "../../components/layout/StudentLayout";
import { reportContent } from "../../utils/reportContent";
import { checkAutoModeration } from "../../utils/checkAutoModeration";
import "./PostDetailsPage.css";

const PostDetailsPage = () => {
  const { postId } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [replyTo, setReplyTo] = useState(null);

  const currentUser = auth.currentUser;

  /* ================= AVATAR STYLE ================= */
  const getAvatarStyle = (name) => {
    const gradients = [
      "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
      "linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%)",
      "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)"
    ];
    const index = name ? name.length % gradients.length : 0;
    return { background: gradients[index] };
  };

  /* ================= POST LISTENER ================= */
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "posts", postId), (snap) => {
      if (snap.exists()) setPost({ id: snap.id, ...snap.data() });
    });
    return () => unsub();
  }, [postId]);

  /* ================= MODERATION REDIRECT ================= */
  // useEffect(() => {
  //   if (!post) return;

  //   if (post.status === "hidden" || post.status === "rejected") {
  //     navigate(`/forum/${post.forumId}`);
  //   }
  // }, [post, navigate]);


  /* ================= COMMENTS LISTENER ================= */
  useEffect(() => {
    const q = query(
      collection(db, "comments"),
      where("postId", "==", postId),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(c => c.status === "active" || c.status === "approved");
      setComments(list);
    });

    return () => unsub();
  }, [postId]);

  /* ================= ADD COMMENT ================= */
  const handleAddComment = async () => {
    if (!commentText.trim() || !currentUser || !post) return;

    // Check if user is suspended
    const userRef = doc(db, "users", currentUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists() && userSnap.data().status === "suspended") {
      const endDate = new Date(userSnap.data().suspensionEnd).toLocaleDateString();
      alert(`⛔ You cannot comment while suspended until ${endDate}.`);
      return;
    }

    let authorName = "Anonymous";
    if (!isAnonymous) {
      const userSnap = await getDoc(doc(db, "users", currentUser.uid));
      if (userSnap.exists()) authorName = userSnap.data().username;
    }

    const isHarmful = await checkAutoModeration(commentText);

    const ref = await addDoc(collection(db, "comments"), {
      postId,
      forumId: post.forumId,
      content: commentText,
      parentCommentId: replyTo || null,
      isAnonymous,
      authorId: currentUser.uid,
      authorName,
      createdAt: serverTimestamp(),
      status: isHarmful ? "hidden" : "active",
      reportCount: 0
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
        commentId: ref.id
      });
      alert("Your comment is under moderation.");
    }

    setCommentText("");
    setReplyTo(null);
  };

  /* ================= ACTIONS ================= */
  const handleDelete = async (id) => {
    if (window.confirm("Delete this comment?")) {
      await deleteDoc(doc(db, "comments", id));
    }
  };

  const handleReport = async (type, content, authorId, commentId = null) => {
    if (!currentUser) return alert("Please login");

    const userRef = doc(db, "users", currentUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists() && userSnap.data().status === "suspended") {
      const endDate = new Date(userSnap.data().suspensionEnd).toLocaleDateString();
      alert(`⛔ You cannot report content while suspended until ${endDate}.`);
      return;
    }

    const reason = prompt(`Why are you reporting this ${type}?`);
    if (!reason) return;

    await reportContent({
      type,
      content,
      reason,
      reporterId: currentUser.uid,
      authorId,
      postId: post.id,
      forumId: post.forumId,
      commentId
    });

    alert(`${type.charAt(0).toUpperCase() + type.slice(1)} reported.`);
  };

  const parentComments = comments.filter(c => !c.parentCommentId);
  const getReplies = (id) => comments.filter(c => c.parentCommentId === id);

  if (!post) return <div className="loader">Loading conversation...</div>;

  // If post is hidden, show "Under Review" page (author can't view content)
  if (post.status === "hidden") {
    return (
      <StudentLayout>
        <div className="review-page-wrapper">
          <button className="review-back" onClick={() => navigate(`/forum/${post.forumId}`)}>
            ← Back
          </button>

          <div className="review-card">
            <div className="spinner">⏳</div>
            <h2>Your post is under review</h2>
            <p>
              This post is temporarily hidden while a moderator reviews it.
            </p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="page-wrapper">
        <div className="page-container">

          {/* Navigation */}
          <div className="nav-row">
            <button className="back-circle" onClick={() => navigate(`/forum/${post.forumId}`)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
          </div>

          {/* Post Header */}
          <div className="post-header">
            <h1 className="post-title">{post.title}</h1>
            <div className="post-author-row">
              <div className="avatar" style={getAvatarStyle(post.authorName)}>
                {post.authorName?.[0] || "A"}
              </div>
              <span className="post-author-name">
                {post.isAnonymous ? "Anonymous" : post.authorName}
              </span>
              <span className="action-link report" style={{ marginLeft: 'auto' }} onClick={() => handleReport("post", post.content, post.authorId)}>
                🚩 Report
              </span>
            </div>
            <p className="post-content">{post.content}</p>
          </div>

          {/* Comments Section */}
          <div className="comment-big-box">
            <div className="box-header">
              <span>Discussion</span>
              <span className="comment-count-badge">{comments.length}</span>
            </div>

            <div className="comments-list">
              {parentComments.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>No comments yet.</p>}
              
              {parentComments.map(c => (
                <div key={c.id} className="thread">
                  {/* Parent Comment */}
                  <div className="comment-line">
                    <div className="avatar" style={getAvatarStyle(c.authorName)}>{c.authorName?.[0]}</div>
                    <div className="bubble-container">
                      <div className="bubble">
                        <span className="author-name">{c.isAnonymous ? "Anonymous" : c.authorName}</span>
                        <span className="text">{c.content}</span>
                      </div>
                      <div className="actions">
                        <span className="action-link" onClick={() => setReplyTo(c.id)}>Reply</span>
                        <span className="action-link report" onClick={() => handleReport("comment", c.content, c.authorId, c.id)}>Report</span>
                        {currentUser?.uid === c.authorId && (
                          <span className="action-link delete" onClick={() => handleDelete(c.id)}>Delete</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Replies */}
                  {getReplies(c.id).map(r => (
                    <div key={r.id} className="reply-line">
                      <div className="avatar small" style={getAvatarStyle(r.authorName)}>{r.authorName?.[0]}</div>
                      <div className="bubble-container">
                        <div className="bubble reply">
                          <span className="author-name">{r.isAnonymous ? "Anonymous" : r.authorName}</span>
                          <span className="text">{r.content}</span>
                        </div>
                        <div className="actions">
                           <span className="action-link report" onClick={() => handleReport("comment", r.content, r.authorId, r.id)}>Report</span>
                           {currentUser?.uid === r.authorId && (
                             <span className="action-link delete" onClick={() => handleDelete(r.id)}>Delete</span>
                           )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Input Area */}
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
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                />
                <button className="send-btn" onClick={handleAddComment}>Send</button>
              </div>
              <label className="anon-label">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={e => setIsAnonymous(e.target.checked)}
                />
                Post anonymously
              </label>
            </div>
          </div>

        </div>
      </div>
    </StudentLayout>
  );
};

export default PostDetailsPage;