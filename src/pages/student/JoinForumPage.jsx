import React, { useEffect, useState } from "react";
import { db, auth } from "../../firebase-config";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  doc,
  getDoc
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./JoinForumPage.css"; 

function JoinForumPage() {
  const [forums, setForums] = useState([]);
  const [joinedForumIds, setJoinedForumIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myFacultyCode, setMyFacultyCode] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {

        const userSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
        const facultyStr = userSnap.exists() ? userSnap.data().faculty : null; // "FCI (Computing & Informatics)"
        const facultyCode = facultyStr ? facultyStr.split(" ")[0] : null; // => "FCI"
        setMyFacultyCode(facultyCode);

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
 
        // show student faculty forum
        const filteredForums = forumsWithCount.filter((f) => {
          // hide inactive forums
          if (f.isActive === false) return false;

          // general forums (or old forums without "type")
          if (!f.type || f.type === "general") return true;

          // faculty forums: only show student's faculty
          if (f.type === "faculty") {
            return facultyCode && f.facultyCode === facultyCode;
          }

          return true;
        });

        filteredForums.sort((a, b) => {
          if (a.type === "faculty") return -1;
          if (b.type === "faculty") return 1;
          return 0;
        });

        setForums(filteredForums);
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
    navigate("/my-forums");
  };

  const getIconBackground = (name) => {
    const gradients = [
      'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
      'linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%)',
      'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    ];
    const index = name ? name.length % gradients.length : 0;
    return gradients[index];
  };

  return (
    <div className="join-page-wrapper">
      <div className="join-header">
        <h2 className="join-title">Join a Forum</h2>
        <p className="join-subtitle">Explore and join at least one forum to get started ✨</p>
      </div>

      <div className="forum-grid">
        {loading ? (
          <p className="loading-text">Searching for communities...</p>
        ) : (
          forums.map((forum) => (
            <div key={forum.id} className="forum-card">
              <div className="card-content">
                <div 
                  className="icon-box" 
                  style={{ background: getIconBackground(forum.name) }}
                >
                  {forum.name[0]}
                </div>
                <h4 className="card-name">{forum.name}</h4>
                <p className="card-desc">{forum.description}</p>
                <div className="member-count">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginRight: 6}}>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  </svg>
                  {forum.memberCount} members
                </div>
              </div>

              {joinedForumIds.includes(forum.id) ? (
                <button 
                  className="enter-btn btn-active"
                  onClick={() => navigate(`/forum/${forum.id}`)}
                >
                  Enter Forum →
                </button>
              ) : (
                <button
                  className="join-btn btn-active"
                  onClick={() => handleJoinForum(forum)}
                >
                  Join Forum
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <div className="join-footer">
        <button 
          className="continue-btn btn-active"
          style={{ 
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

export default JoinForumPage;