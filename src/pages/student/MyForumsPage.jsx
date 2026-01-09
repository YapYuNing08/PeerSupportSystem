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
import "./MyForumsPage.css"; // 🔹 Import external CSS

const MyForumsPage = () => {
  const [forums, setForums] = useState([]);
  const [loading, setLoading] = useState(true);
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
          
          {/* 🔹 Header Section */}
          <div className="header-section">
            <h1 className="title-text">My Forums</h1>
            <p className="subtitle-text">Explore and manage the communities you've joined</p>
          </div>

          {/* 🔹 Join Forum Action Area */}
          <div className="action-section">
            <JoinForumCard />
          </div>

          {/* 🔹 Forums Grid */}
          <div className="forum-grid">
            {loading ? (
              <p className="status-text">Loading your communities...</p>
            ) : forums.length === 0 ? (
              <div className="empty-state">
                <p>You haven’t joined any forums yet.</p>
                <span>Join a forum using the code above!</span>
              </div>
            ) : (
              forums.map((forum) => (
                <div
                  key={forum.id}
                  className="forum-tile"
                  onClick={() => navigate(`/forum/${forum.id}`)}
                >
                  <div className="tile-content">
                    <div className="icon-box">
                      {forum.name[0]}
                    </div>
                    <h3 className="forum-name">{forum.name}</h3>
                    <p className="forum-desc">
                      {forum.description?.length > 80 
                        ? forum.description.substring(0, 80) + "..." 
                        : forum.description}
                    </p>
                  </div>

                  <div className="tile-footer">
                    <div className="member-badge">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginRight: 6}}>
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                      {forum.memberCount} {forum.memberCount === 1 ? 'member' : 'members'}
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