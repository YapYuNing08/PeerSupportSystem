import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase-config";
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  getCountFromServer //for counting replies
} from "firebase/firestore";
import { toast } from "react-toastify";
import { FaBell, FaSignOutAlt, FaStickyNote, FaChalkboardTeacher, FaComment, FaUserSecret, FaChevronRight, FaQuoteLeft } from 'react-icons/fa';
import RequestChat from "../../components/student/RequestChat.jsx"; 
import "./StudentProfile.css"; 
import StudentLayout from "../../components/layout/StudentLayout"; 
import ReportIssueButton from "../../components/student/ReportIssueButton.jsx";

const StudentProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [showNotesModal, setShowNotesModal] = useState(false);
  const [unlockedNotes, setUnlockedNotes] = useState([]);


  useEffect(() => {
    let isMounted = true; 

    const fetchData = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        navigate("/login");
        return;
      }

      setLoading(true);

      // fetch user profile info
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userDocRef);
        
        if (isMounted) {
            if (userSnap.exists()) {
                setUser({ 
                    uid: currentUser.uid, 
                    ...userSnap.data(),
                    username: userSnap.data().username || currentUser.displayName || "Student"
                });
            } else {
                setUser({ uid: currentUser.uid, username: currentUser.displayName || "Student" });
            }
        }
      } catch (error) {
        console.error("Error fetching User Profile:", error);
      }

      // fetch forum posts
      try {
        const postsQuery = query(
          collection(db, "posts"),
          where("authorId", "==", currentUser.uid),
          orderBy("createdAt", "desc")
        );
        const postsSnap = await getDocs(postsQuery);
        
        if (isMounted) {
            // fetch forum name and reply count
            const enrichedPosts = await Promise.all(postsSnap.docs.map(async (postDoc) => {
                const postData = postDoc.data();
                let forumName = "General"; // Default
                let replyCount = 0;

                // fetch forum name
                if (postData.forumId) {
                    try {
                        const forumDoc = await getDoc(doc(db, "forums", postData.forumId));
                        if (forumDoc.exists()) {
                            // Check if your forum collection uses "name", "title", or "topic"
                            forumName = forumDoc.data().name || forumDoc.data().title || "General";
                        }
                    } catch (e) {
                        console.log("Could not fetch forum name", e);
                    }
                }

                // fetch reply count
                try {
                    const commentsQuery = query(
                        collection(db, "comments"), 
                        where("postId", "==", postDoc.id)
                    );
                    const countSnap = await getCountFromServer(commentsQuery);
                    replyCount = countSnap.data().count;
                } catch (e) {
                    console.log("Could not fetch comment count", e);
                }

                return { 
                    id: postDoc.id, 
                    ...postData, 
                    forumName, // Added
                    replyCount // Added
                };
            }));

            setPosts(enrichedPosts);
        }
      } catch (error) {
        console.error("Error fetching Posts:", error);
      }

      // --- 3. FETCH UNLOCKED MOTIVATIONAL NOTES ---
      try {
        const seenNotesKey = `seenNotes_${currentUser.uid}`;
        const seenIds = JSON.parse(localStorage.getItem(seenNotesKey) || "[]");

        if (seenIds.length > 0) {
          const notesSnap = await getDocs(collection(db, "motivationalNotes"));
          const filtered = notesSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(note => seenIds.includes(note.id));
          
          if (isMounted) setUnlockedNotes(filtered);
        }
      } catch (error) {
        console.error("❌ Error fetching Notes History:", error);
      }

      if (isMounted) setLoading(false);
    };

    fetchData();

    return () => { isMounted = false; };
  }, [navigate]);

  const handleLogoutClick = () => setShowLogoutConfirm(true);

  const confirmLogout = async () => {
    try {
      await auth.signOut();
      localStorage.removeItem("userRole"); 
      navigate("/login");
      toast.info("Logged out successfully");
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  // Helper function for date format dd/mm/yyyy
  const formatDate = (timestamp) => {
    if (!timestamp) return "Just now";
    const date = new Date(timestamp.seconds * 1000);
    // 'en-GB' format is dd/mm/yyyy
    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
  };

  if (loading) return <div className="loader-container">Loading Profile...</div>;

  return (
    <StudentLayout>
    <div className="profile-wrapper">
      <div className="profile-container">
        
        <header className="profile-header">
          <div 
            className="header-action" 
            onClick={() => navigate("/student/notifications")}
            style={{ cursor: "pointer" }}
          >
            <FaBell className="header-icon" />
            <span>Notification</span>
          </div>
          <h1 className="header-title">My Profile</h1>
          <div className="header-action" onClick={handleLogoutClick}>
            <FaSignOutAlt className="header-icon" />
            <span>Log out</span>
          </div>
        </header>

        <div className="profile-card account-card">
          <div className="profile-avatar">
            {user?.username ? user.username[0].toUpperCase() : "S"}
          </div>
          <div className="account-details">
            <h2>Name: {user?.username || "Student"}</h2>
          </div>
        </div>

          {/* Motivational Notes Banner (Clickable) */}
          <div 
            className="profile-card banner-card" 
            style={{ background: '#e8e6f3', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            onClick={() => setShowNotesModal(true)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <FaStickyNote className="banner-icon note-icon" />
              <span className="banner-text">My Motivation Notes</span>
            </div>
            <FaChevronRight style={{ color: '#6366f1', opacity: 0.5 }} />
          </div>       

        <section className="posts-section">
          <h3 className="section-title">My Posts</h3>
          {posts.length === 0 ? (
            <p className="no-posts-text" style={{color: 'gray'}}>
                {loading ? "Loading..." : "You haven't posted anything yet."}
            </p>
          ) : (
            <div className="posts-scroll-container">
              {posts.map((post) => (
                <div 
                  key={post.id} 
                  className="post-card" 
                  onClick={() => navigate(`/post/${post.id}`)}
                >
                  {/* post title */}
                  <p className="post-title-text">
                    {post.title.length > 50 ? post.title.substring(0, 50) + "..." : post.title}
                  </p>

                  {/* Post details badges */}
                  <div className="post-meta-badges">
                    {/* 1. Forum name badge */}
                    <span className="meta-badge forum-badge">
                        <p>📢</p>{post.forumName}
                    </span>
                    {/* 2. Anonymous badge (only if true) */}
                    {post.isAnonymous ? (
                        <span className="meta-badge anon-badge">
                            <FaUserSecret className="badge-icon" /> Anonymous
                        </span>
                    ) : (
                        <span className="meta-badge public-badge">
                            Public
                        </span>
                    )}

                  </div>

                  {/*date and replies */}
                  <div className="post-footer">
                    <div className="footer-left">
                        <FaComment className="footer-icon" /> 
                        {post.replyCount} {post.replyCount === 1 ? "Reply" : "Replies"}
                    </div>
                    <div className="footer-right">
                        {formatDate(post.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="profile-card banner-card counseling-banner" onClick={() => setShowRequestModal(true)}>
          <span className="banner-text">Request a counseling session</span>
          <FaChalkboardTeacher className="banner-icon counseling-icon" />
        </div>

        <ReportIssueButton />
      </div>

      {/* Motivational Notes History Modal */}
        {showNotesModal && (
          <div className="modal-overlay">
            <div className="modal-content history-modal">
              <div className="modal-header">
                <h3>Encouragement History</h3>
                <button className="close-x" onClick={() => setShowNotesModal(false)}>&times;</button>
              </div>
              <div className="history-list">
                {unlockedNotes.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>No notes unlocked yet. Click the lightbulb in your Tracker daily!</p>
                ) : (
                  unlockedNotes.map((note) => (
                    <div key={note.id} className="history-item">
                      <FaQuoteLeft className="quote-icon-mini" />
                      <p>"{note.content}"</p>
                      <small>— Counselor Encouragement</small>
                    </div>
                  ))
                )}
              </div>
              <div className="modal-actions">
                <button className="btn-confirm-logout" onClick={() => setShowNotesModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

      {showRequestModal && (
        <RequestChat 
          onClose={() => setShowRequestModal(false)}
          onSuccess={() => setShowRequestModal(false)}
          currentUsername={user?.username}
        />
      )}

      {showLogoutConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Log Out</h3>
            <p>Are you sure you want to log out?</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
              <button className="btn-confirm-logout" onClick={confirmLogout}>Yes, Log Out</button>
            </div>
          </div>
        </div>
      )}

    </div>
    </StudentLayout>
  );
};

export default StudentProfile;