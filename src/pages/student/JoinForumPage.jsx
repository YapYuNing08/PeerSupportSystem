import React, { useEffect, useState } from "react";
import { db, auth } from "../../firebase-config";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function JoinForumPage() {
  const [forums, setForums] = useState([]);
  const [joinedForumIds, setJoinedForumIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const forumSnap = await getDocs(collection(db, "forums"));

        const memberQuery = query(
          collection(db, "forumMembers"),
          where("userId", "==", auth.currentUser.uid)
        );
        const memberSnap = await getDocs(memberQuery);
        const joinedIds = memberSnap.docs.map((d) => d.data().forumId);
        setJoinedForumIds(joinedIds);

        const forumsWithCount = await Promise.all(
          forumSnap.docs.map(async (docSnap) => {
            const forumId = docSnap.id;
            const countQuery = query(
              collection(db, "forumMembers"),
              where("forumId", "==", forumId)
            );
            const countSnap = await getDocs(countQuery);

            return {
              id: forumId,
              ...docSnap.data(),
              memberCount: countSnap.size,
            };
          })
        );

        setForums(forumsWithCount);
        setLoading(false);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load forums");
      }
    };

    fetchData();
  }, []);

  const handleJoinForum = async (forum) => {
    if (joinedForumIds.includes(forum.id)) return;

    try {
      await addDoc(collection(db, "forumMembers"), {
        forumId: forum.id,
        forumName: forum.name,
        userId: auth.currentUser.uid,
        joinedAt: new Date(),
      });

      toast.success(`Joined ${forum.name}`);
      setJoinedForumIds((prev) => [...prev, forum.id]);
      setForums((prev) =>
        prev.map((f) =>
          f.id === forum.id ? { ...f, memberCount: f.memberCount + 1 } : f
        )
      );
    } catch (error) {
      toast.error("Failed to join forum");
    }
  };

  const handleContinue = () => {
    if (joinedForumIds.length === 0) {
      toast.error("Please join at least one forum to continue");
      return;
    }
    navigate("/student-page");
  };

  const getIconStyle = (name) => {
    const gradients = [
      'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
      'linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%)',
      'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    ];
    const index = name ? name.length % gradients.length : 0;
    return { background: gradients[index] };
  };

  return (
    <div style={s.pageWrapper}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
        .forum-card:hover { transform: translateY(-5px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05); border-color: #6366f1; }
        .btn-active:active { transform: scale(0.96); }
      `}</style>

      <div style={s.header}>
        <h2 style={s.title}>Join a Community</h2>
        <p style={s.subtitle}>Explore and join at least one forum to get started ✨</p>
      </div>

      <div style={s.forumGrid}>
        {loading ? (
          <p style={s.loadingText}>Searching for communities...</p>
        ) : (
          forums.map((forum) => (
            <div key={forum.id} className="forum-card" style={s.card}>
              <div style={s.cardContent}>
                <div style={{ ...s.iconBox, ...getIconStyle(forum.name) }}>
                  {forum.name[0]}
                </div>
                <h4 style={s.cardName}>{forum.name}</h4>
                <p style={s.cardDesc}>{forum.description}</p>
                <div style={s.memberCount}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginRight: 6}}>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  </svg>
                  {forum.memberCount} members
                </div>
              </div>

              {/* 🔹 Logic Update: Change button to Enter if already joined */}
              {joinedForumIds.includes(forum.id) ? (
                <button 
                  style={s.enterBtn} 
                  className="btn-active"
                  onClick={() => navigate(`/forum/${forum.id}`)}
                >
                  Enter Forum →
                </button>
              ) : (
                <button
                  style={s.joinBtn}
                  className="btn-active"
                  onClick={() => handleJoinForum(forum)}
                >
                  Join Community
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <div style={s.footer}>
        <button 
            style={{ 
                ...s.continueBtn, 
                opacity: joinedForumIds.length > 0 ? 1 : 0.5,
                cursor: joinedForumIds.length > 0 ? 'pointer' : 'not-allowed'
            }} 
            onClick={handleContinue}
        >
          Finish & View All Joined
        </button>
      </div>
    </div>
  );
}

const s = {
  pageWrapper: { backgroundColor: "#f8fafc", minHeight: "100vh", padding: "60px 24px", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1e293b", display: 'flex', flexDirection: 'column', alignItems: 'center' },
  header: { textAlign: 'center', marginBottom: '48px' },
  title: { fontSize: "36px", fontWeight: "800", color: "#0f172a", marginBottom: "12px", letterSpacing: '-0.03em' },
  subtitle: { fontSize: '16px', color: '#64748b', fontWeight: '500', maxWidth: '400px' },
  forumGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px', width: '100%', maxWidth: '1000px', marginBottom: '40px' },
  card: { backgroundColor: "#ffffff", borderRadius: "28px", padding: "32px", border: "1px solid #f1f5f9", display: "flex", flexDirection: "column", justifyContent: "space-between", transition: "all 0.3s ease", height: "280px" },
  cardContent: { flex: 1 },
  iconBox: { width: '48px', height: '48px', borderRadius: '16px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', marginBottom: '20px', fontSize: '20px' },
  cardName: { fontSize: "20px", fontWeight: "700", color: "#1e293b", margin: "0 0 10px 0" },
  cardDesc: { fontSize: "14px", color: "#64748b", lineHeight: "1.6", margin: "0 0 16px 0" },
  memberCount: { fontSize: '12px', fontWeight: '700', color: '#94a3b8', display: 'flex', alignItems: 'center' },
  
  // Indigo Join Button
  joinBtn: { width: '100%', backgroundColor: "#6366f1", color: "white", border: "none", padding: "14px", borderRadius: "16px", fontWeight: "700", fontSize: "14px", cursor: "pointer", boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.2)', transition: '0.2s' },
  
  // White Enter Button (Appears after joining)
  enterBtn: { width: '100%', backgroundColor: "#ffffff", color: "#6366f1", border: "1.5px solid #6366f1", padding: "12.5px", borderRadius: "16px", fontWeight: "700", fontSize: "14px", cursor: "pointer", transition: '0.2s' },
  
  footer: { width: '100%', maxWidth: '1000px', display: 'flex', justifyContent: 'center', marginTop: '20px' },
  continueBtn: { backgroundColor: "#0f172a", color: "white", border: "none", padding: "16px 48px", borderRadius: "20px", fontWeight: "700", fontSize: "16px", transition: 'all 0.3s ease', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' },
  loadingText: { color: '#94a3b8', gridColumn: '1/-1', textAlign: 'center' }
};

export default JoinForumPage;