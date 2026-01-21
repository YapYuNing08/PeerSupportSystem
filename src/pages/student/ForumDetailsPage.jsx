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

  const getAvatarStyle = (name) => {
    const gradients = [
      "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
      "linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%)",
      "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)"
    ];
    const index = name ? name.length % gradients.length : 0;
    return { background: gradients[index] };
  };

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

  useEffect(() => {
    const postQuery = query(
      collection(db, "posts"),
      where("forumId", "==", forumId),
      orderBy("createdAt", "desc")
    );

    const unsubscribePosts = onSnapshot(postQuery, (snapshot) => {
      const visiblePosts = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(post => !post.isHidden);

      setPosts(visiblePosts);
      setLoading(false);

      visiblePosts.forEach(post => {
        const commentQuery = query(
          collection(db, "comments"),
          where("postId", "==", post.id)
        );

        onSnapshot(commentQuery, (commentSnap) => {
          const visibleComments = commentSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(c => !c.isHidden);

          setCommentCounts(prev => ({
            ...prev,
            [post.id]: visibleComments.length
          }));
        });
      });
    });

    return () => unsubscribePosts();
  }, [forumId]);

  return (
    <StudentLayout>
      <div className="forum-page-wrapper">
        <div className="forum-page-container">
          
          <nav className="forum-nav">
            <button className="back-btn" onClick={() => navigate("/my-forums")}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              <span className="back-text">Back</span>
            </button>
            <div className="nav-title">{forum?.name || "Forum"}</div>
            <div className="nav-spacer"></div>
          </nav>

          <header className="forum-header">
            <h1 className="forum-title">{forum?.name || "Loading..."}</h1>
            <p className="forum-description">
              {forum?.description || "Welcome to our shared space for growth and discussion."}
            </p>
            <div className="badge-row">
              <span className="pill-badge">{posts.length} Posts</span>
              <span className="pill-badge active">Public Forum</span>
            </div>
          </header>

          <div className="masonry-grid">
            {loading && <p className="status-text">Curating your feed...</p>}

            {!loading && posts.length === 0 && (
              <div className="empty-state">
                <p>No posts yet. Be the first to start a conversation!</p>
              </div>
            )}

            {posts.map(post => (
              <div key={post.id} className="post-card" onClick={() => navigate(`/post/${post.id}`)}>
                <div className="card-body">
                  <h3 className="card-title">{post.title}</h3>
                  <p className="card-content">
                    {post.content.length > 110
                      ? post.content.substring(0, 110) + "..."
                      : post.content}
                  </p>
                </div>

                <div className="card-footer">
                  <div className="user-info">
                    <div className="user-avatar" style={getAvatarStyle(post.authorName)}>
                      {post.authorName?.[0] || "A"}
                    </div>
                    <span className="user-name">
                      {post.isAnonymous ? "Anonymous" : post.authorName}
                    </span>
                  </div>
                  <div className="comment-tag">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <span>{commentCounts[post.id] || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button 
            className="fab-button" 
            onClick={() => navigate(`/forum/${forumId}/new-post`)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

        </div>
      </div>
    </StudentLayout>
  );
};

export default ForumDetailsPage;