import React, { useEffect, useState } from "react";
import { db } from "../../firebase-config";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  getDoc,
  updateDoc
} from "firebase/firestore";
import "./FlaggedContentPage.css"; // 🔹 Import CSS file

const FlaggedContentPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUserName = async (uid) => {
    if (!uid) return "Unknown";
    const userSnap = await getDoc(doc(db, "users", uid));
    return userSnap.exists() ? userSnap.data().username : "Unknown";
  };

  const fetchContentData = async (report) => {
    let contentText = report.content || "";
    let contentTitle = "";
    let forumName = "";

    try {
      if (report.type === "post" && report.postId) {
        const postSnap = await getDoc(doc(db, "posts", report.postId));
        if (postSnap.exists()) {
          contentText = postSnap.data().content || contentText;
          contentTitle = postSnap.data().title || "Untitled Post";
          const forumSnap = await getDoc(doc(db, "forums", postSnap.data().forumId));
          forumName = forumSnap.exists() ? forumSnap.data().name : "Unknown Forum";
        }
      }

      if (report.type === "comment") {
        let commentSnap = report.commentId ? await getDoc(doc(db, "comments", report.commentId)) : null;
        if (commentSnap && commentSnap.exists()) {
          contentText = commentSnap.data().content || contentText;
          const postSnap = await getDoc(doc(db, "posts", commentSnap.data().postId));
          contentTitle = postSnap.exists() ? postSnap.data().title : "Unknown Post";
          const forumSnap = postSnap.exists() ? await getDoc(doc(db, "forums", postSnap.data().forumId)) : null;
          forumName = forumSnap && forumSnap.exists() ? forumSnap.data().name : "Unknown Forum";
        }
      }
    } catch (err) {
      console.error("Error fetching content data:", err);
    }
    return { contentText, contentTitle, forumName };
  };

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "userReports"), async (snapshot) => {
      const list = await Promise.all(
        snapshot.docs.map(async (d) => {
          const data = d.data();
          const reporterName = await fetchUserName(data.reporterId);
          const authorName = await fetchUserName(data.authorId);
          const contentData = await fetchContentData(data);

          return {
            id: d.id,
            ...data,
            reporterName,
            authorName,
            contentText: contentData.contentText,
            contentTitle: contentData.contentTitle,
            forumName: contentData.forumName
          };
        })
      );
      setReports(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleApprove = async (report) => {
    if (window.confirm("Approve this content? It will be visible to students.")) {
      try {
        const ref = report.type === "post" 
          ? doc(db, "posts", report.postId) 
          : doc(db, "comments", report.commentId);
        
        await updateDoc(ref, { isHidden: false, approved: true, isFlagged: false });
        await deleteDoc(doc(db, "userReports", report.id));
      } catch (err) { console.error(err); }
    }
  };

  const handleReject = async (report) => {
    if (window.confirm("Reject this content? It will remain hidden.")) {
      try {
        const ref = report.type === "post" 
          ? doc(db, "posts", report.postId) 
          : doc(db, "comments", report.commentId);
        
        await updateDoc(ref, { isHidden: true, approved: false });
        await deleteDoc(doc(db, "userReports", report.id));
      } catch (err) { console.error(err); }
    }
  };

  return (
    <div className="page-wrapper">
      <div className="header">
        <h1 className="title">🚩 Reported Content</h1>
        <p className="subtitle">Moderation Queue: Review items flagged by students or the system.</p>
      </div>

      <div className="list-container">
        {loading ? (
          <p className="loading-text">Loading reports...</p>
        ) : reports.length === 0 ? (
          <div className="empty-state">No reports to review. All clean! ✨</div>
        ) : (
          reports.map((item) => (
            <div key={item.id} className="report-card">
              <div className="card-header">
                <div className="badge-row">
                  <span className="type-badge">{item.type}</span>
                  <span className="reason-badge">{item.reason}</span>
                </div>
                <div className="action-row">
                  <button className="approve-btn" onClick={() => handleApprove(item)}>Approve</button>
                  <button className="reject-btn" onClick={() => handleReject(item)}>Reject</button>
                </div>
              </div>

              <div className="content-box">
                <p className="content-label">Flagged Content:</p>
                <p className="content-text">"{item.contentText}"</p>
              </div>

              <div className="meta-grid">
                <div className="meta-item"><strong>Forum:</strong> {item.forumName}</div>
                <div className="meta-item"><strong>Post Title:</strong> {item.contentTitle}</div>
                <div className="meta-item"><strong>Author:</strong> {item.authorName}</div>
                <div className="meta-item"><strong>Reporter:</strong> {item.reporterName}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FlaggedContentPage;