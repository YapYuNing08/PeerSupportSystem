import React, { useEffect, useState } from "react";
import { db } from "../../firebase-config";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  addDoc,
  serverTimestamp,
  query,
  where
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./FlaggedContentPage.css";

const FlaggedContentPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch username by UID
  const fetchUserName = async (uid) => {
    if (!uid) return "Auto-flagged";
    const userSnap = await getDoc(doc(db, "users", uid));
    return userSnap.exists() ? userSnap.data().username : "Auto-flagged";
  };

  // Fetch content data for post/comment
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
        const commentSnap = report.commentId ? await getDoc(doc(db, "comments", report.commentId)) : null;
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

  //report create/delete/change, function run again
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "reports"), async (snapshot) => {
      const list = await Promise.all(
        snapshot.docs.map(async (d) => {
          const data = d.data();

          //  get target reportCount from post/comment
          let targetReportCount = 0;

          try {
            if (data.type === "post" && data.postId) {
              const postSnap = await getDoc(doc(db, "posts", data.postId));
              if (postSnap.exists()) {
                targetReportCount = postSnap.data().reportCount || 0;
              }
            }

            if (data.type === "comment" && data.commentId) {
              const commentSnap = await getDoc(doc(db, "comments", data.commentId));
              if (commentSnap.exists()) {
                targetReportCount = commentSnap.data().reportCount || 0;
              }
            }
          } catch (err) {
            console.error("Error fetching target reportCount:", err);
          }

          // Only allow:
          // 1) SYSTEM auto-moderation
          // 2) user reports when reportCount >= 3
          const shouldShow =
            data.reporterId === "SYSTEM" || targetReportCount >= 2;

          if (!shouldShow) return null;

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
            forumName: contentData.forumName,
            targetReportCount // optional display
          };
        })
      );

      // remove nulls (reports that shouldn't show)
      const filtered = list.filter(Boolean);

      setReports(filtered);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Approve content
  const handleApprove = async (report) => {
    if (!window.confirm("Approve this content? It will be visible to students.")) return;

    try {
      // Unhide content
      const ref = report.type === "post"
        ? doc(db, "posts", report.postId)
        : doc(db, "comments", report.commentId);

      await updateDoc(ref, {
        status: "approved",
        reportCount: 0 // reset count
      });

      // Delete ALL reports for this content
      const q = query(
        collection(db, "reports"),
        where("type", "==", report.type),
        report.type === "post"
          ? where("postId", "==", report.postId)
          : where("commentId", "==", report.commentId)
      );

      const snap = await getDocs(q);
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));

      alert("Content approved and all reports cleared.");
    } catch (err) {
      console.error(err);
    }
  };

const handleReject = async (report) => {
  if (!window.confirm("Reject this content and move it to warning queue?")) return;

  try {
    // 0) Update the content status (works even if your UI still uses isHidden)
    const ref = report.type === "post"
      ? doc(db, "posts", report.postId)
      : doc(db, "comments", report.commentId);

    await updateDoc(ref, {
      status: "rejected",
    });

    // 1) Ensure forumId exists (required)
    let forumId = report.forumId;

    if (!forumId) {
      if (report.type === "post" && report.postId) {
        const postSnap = await getDoc(doc(db, "posts", report.postId));
        forumId = postSnap.exists() ? postSnap.data().forumId : null;
      }

      if (report.type === "comment" && report.commentId) {
        const commentSnap = await getDoc(doc(db, "comments", report.commentId));
        if (commentSnap.exists()) {
          const postSnap = await getDoc(doc(db, "posts", commentSnap.data().postId));
          forumId = postSnap.exists() ? postSnap.data().forumId : null;
        }
      }
    }

    if (!forumId) {
      alert("Error: forumId could not be determined.");
      return;
    }

    // 2A) OLD warning (keep your current system)
    await addDoc(collection(db, "warning"), {
      type: report.type,
      reason: report.reason,
      contentText: report.contentText,
      authorId: report.authorId,
      postId: report.postId || null,
      commentId: report.commentId || null,
      forumId: forumId,
      status: "pending",
      createdAt: serverTimestamp(),
      // sent: false
    });

    // 3) Delete ALL reports (keep your behavior)
    const q = query(
      collection(db, "reports"),
      where("type", "==", report.type),
      report.type === "post"
        ? where("postId", "==", report.postId)
        : where("commentId", "==", report.commentId)
    );

    const snap = await getDocs(q);
    await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));

    alert("Content rejected and moved to warning queue.");
  } catch (err) {
    console.error(err);
    alert("Failed to reject content.");
  }
};

  return (
    <div className="page-wrapper">
      <div className="header">
        <button className="btn-back" onClick={() => navigate("/moderator-dashboard")}>
          ← Back to Moderator Dashboard
        </button>
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
