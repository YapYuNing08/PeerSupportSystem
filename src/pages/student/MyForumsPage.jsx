import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase-config";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import JoinForumCard from "../../components/student/JoinForumCard";
import StudentLayout from "../../components/layout/StudentLayout";
import "./MyForumsPage.css"; 

const MyForumsPage = () => {
  const [forums, setForums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRules, setShowRules] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyForums = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, "forumMembers"),
        where("userId", "==", user.uid)
      );

      const snapshot = await getDocs(q);

      const forumPromises = snapshot.docs.map(async (m) => {
        const forumId = m.data().forumId;
        const forumRef = doc(db, "forums", forumId);
        const forumSnap = await getDoc(forumRef);

        if (!forumSnap.exists()) return null;

        const memberQuery = query(
          collection(db, "forumMembers"),
          where("forumId", "==", forumId)
        );
        const memberSnap = await getDocs(memberQuery);

        return {
          id: forumSnap.id,
          ...forumSnap.data(),
          memberCount: memberSnap.size,
        };
      });

      const forumResults = (await Promise.all(forumPromises)).filter(Boolean);
      setForums(forumResults);
      setLoading(false);
    };

    fetchMyForums();
  }, []);

  return (
    <StudentLayout>
      <div className="my-forums-page-wrapper">
        <div className="page-container">
          
          <div className="header-row">
            <div className="header-section">
              <h1 className="title-text">My Forums</h1>
              <p className="subtitle-text">Explore and manage the forum you've joined</p>
            </div>

            <button 
              className={`guidelines-toggle-btn ${showRules ? 'active' : ''}`}
              onClick={() => setShowRules(!showRules)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="19" cy="12" r="1"></circle>
                <circle cx="5" cy="12" r="1"></circle>
              </svg>
            </button>
          </div>

          {/* guidelines dropdown area */}
          {showRules && (
            <div className="guidelines-dropdown">
              <h3>Forum Standards</h3>
              <ul className="guidelines-grid">
                <li>✅ Respectful & constructive</li>
                <li>✅ Helpful discussions only</li>
                <li>🚫 No hate speech</li>
                <li>🚫 No private info sharing</li>
                <li>🚫 No spam or ads</li>
                <li>⚠️ Moderated content</li>
              </ul>
            </div>
          )}

          <div className="action-section">
            <JoinForumCard />
          </div>

          <div className="forum-grid">
            {loading ? (
              <p className="status-text">Loading your forums...</p>
            ) : forums.length === 0 ? (
              <div className="empty-state">
                <p style={{ fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>No forums yet</p>
                <span style={{ color: '#94a3b8' }}>Use a forum code to join your first forum!</span>
              </div>
            ) : (
              forums.map((forum) => (
                <div
                  key={forum.id}
                  className="forum-tile"
                  onClick={() => navigate(`/forum/${forum.id}`)}
                >
                  <div className="tile-content">
                    <div className="icon-box">{forum.name[0]}</div>
                    <h3 className="forum-name">{forum.name}</h3>
                    <p className="forum-desc">
                      {forum.description?.length > 85
                        ? forum.description.substring(0, 85) + "..."
                        : forum.description}
                    </p>
                  </div>

                  <div className="tile-footer">
                    <div className="member-badge">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginRight: 6}}>
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                      </svg>
                      {forum.memberCount} members
                    </div>
                    <span className="enter-btn-text">Enter →</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default MyForumsPage;