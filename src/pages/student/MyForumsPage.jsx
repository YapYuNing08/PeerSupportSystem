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
    <div style={s.pageWrapper}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
        
        .forum-tile:hover { 
          transform: translateY(-5px); 
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05); 
          border-color: #6366f1; 
        }

        .forum-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 24px;
        }

        @media (max-width: 650px) {
          .forum-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* 🔹 Header Section */}
      <div style={s.header}>
        <h1 style={s.title}>My Forums</h1>
        <p style={s.subtitle}>Explore and manage the communities you've joined</p>
      </div>

      {/* 🔹 Join Forum Action Area */}
      <div style={s.actionSection}>
        <JoinForumCard />
      </div>

      {/* 🔹 Forums Grid */}
      <div className="forum-grid">
        {loading ? (
          <p style={s.statusText}>Loading your communities...</p>
        ) : forums.length === 0 ? (
          <div style={s.emptyState}>
            <p>You haven’t joined any forums yet.</p>
            <span style={{fontSize: '14px', color: '#94a3b8'}}>Join a forum using the code above!</span>
          </div>
        ) : (
          forums.map((forum) => (
            <div
              key={forum.id}
              className="forum-tile"
              style={s.forumTile}
              onClick={() => navigate(`/forum/${forum.id}`)}
            >
              <div style={s.tileContent}>
                <div style={s.iconBox}>
                  {forum.name[0]}
                </div>
                <h3 style={s.forumName}>{forum.name}</h3>
                <p style={s.forumDesc}>
                    {forum.description?.length > 80 
                        ? forum.description.substring(0, 80) + "..." 
                        : forum.description}
                </p>
              </div>

              <div style={s.tileFooter}>
                <div style={s.memberBadge}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginRight: 6}}>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  {forum.memberCount} {forum.memberCount === 1 ? 'member' : 'members'}
                </div>
                <span style={s.enterBtn}>Enter →</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
    </StudentLayout>
  );
};

const s = {
  pageWrapper: {
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
    padding: "40px 24px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    color: "#1e293b",
  },
  header: { marginBottom: "32px" },
  title: { fontSize: "32px", fontWeight: "800", color: "#0f172a", marginBottom: "8px", letterSpacing: '-0.03em' },
  subtitle: { fontSize: '15px', color: '#64748b', fontWeight: '500' },
  
  actionSection: { marginBottom: '40px' },
  
  forumTile: {
    backgroundColor: "#ffffff",
    borderRadius: "24px",
    border: "1px solid #f1f5f9",
    padding: "24px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    transition: "all 0.3s ease",
    height: "200px"
  },
  tileContent: { flex: 1 },
  iconBox: {
    width: '40px', height: '40px', borderRadius: '12px',
    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: '800', marginBottom: '16px', fontSize: '18px'
  },
  forumName: { fontSize: "18px", fontWeight: "700", color: "#1e293b", margin: "0 0 8px 0" },
  forumDesc: { fontSize: "13px", color: "#64748b", lineHeight: "1.5", margin: 0 },
  
  tileFooter: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f8fafc'
  },
  memberBadge: { 
    fontSize: '12px', fontWeight: '700', color: '#6366f1', 
    display: 'flex', alignItems: 'center' 
  },
  enterBtn: { fontSize: '12px', fontWeight: '800', color: '#cbd5e1' },
  
  statusText: { color: '#94a3b8', fontSize: '14px' },
  emptyState: { 
    textAlign: 'center', padding: '60px', backgroundColor: '#fff', 
    borderRadius: '24px', border: '2px dashed #e2e8f0', gridColumn: '1 / -1' 
  }
};

export default MyForumsPage;