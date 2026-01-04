import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../../firebase-config";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot
} from "firebase/firestore";

const PostDetailsPage = () => {
  const { postId } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);

  const [commentText, setCommentText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [replyTo, setReplyTo] = useState(null); // commentId

  const currentUser = auth.currentUser;

  /* 🔹 Load post */
  useEffect(() => {
    const postRef = doc(db, "posts", postId);
    const unsub = onSnapshot(postRef, (snap) => {
      if (snap.exists()) {
        setPost({ id: snap.id, ...snap.data() });
      }
    });
    return () => unsub();
  }, [postId]);

  /* 🔹 Real-time comments */
  useEffect(() => {
    const q = query(
      collection(db, "comments"),
      where("postId", "==", postId),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setComments(list);
    });

    return () => unsubscribe();
  }, [postId]);

  /* 🔹 Add comment / reply */
  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    if (!currentUser) return;

    let authorName = "Anonymous";

    if (!isAnonymous) {
      const userSnap = await getDoc(doc(db, "users", currentUser.uid));
      if (userSnap.exists()) {
        authorName = userSnap.data().username;
      }
    }

    await addDoc(collection(db, "comments"), {
      postId,
      content: commentText,
      parentCommentId: replyTo, // null = comment, id = reply
      isAnonymous,
      authorId: currentUser.uid,
      authorName,
      createdAt: serverTimestamp(),
    });

    setCommentText("");
    setIsAnonymous(false);
    setReplyTo(null);
  };

  /* 🔹 Delete comment (own only) */
  const handleDelete = async (commentId) => {
    await deleteDoc(doc(db, "comments", commentId));
  };

  /* 🔹 Helpers */
  const parentComments = comments.filter(
    (c) => !c.parentCommentId
  );

  const getReplies = (commentId) =>
    comments.filter((c) => c.parentCommentId === commentId);

  if (!post) return <p>Loading post...</p>;

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "0 auto" }}>

      {/* 🔹 Back */}
      <button
        onClick={() => navigate(`/forum/${post.forumId}`)}
        style={{ marginBottom: 16 }}
      >
        ← Back to Forum
      </button>

      {/* 🔹 Post */}
      <h2>{post.title}</h2>
      <p>{post.content}</p>

      <small style={{ color: "#666" }}>
        Posted by{" "}
        <strong>
          {post.isAnonymous ? "Anonymous" : post.authorName}
        </strong>
      </small>

      <hr />

      {/* 🔹 Comments */}
      <h3>{replyTo ? "Reply" : "Comments"}</h3>

      {parentComments.length === 0 && <p>No comments yet.</p>}

      {parentComments.map((c) => (
        <div
          key={c.id}
          style={{
            padding: "10px 0",
            borderBottom: "1px solid #eee",
          }}
        >
          <p>{c.content}</p>

          <small style={{ color: "#666" }}>
            {c.isAnonymous ? "Anonymous" : c.authorName}
          </small>

          <div style={{ marginTop: 4 }}>
            <button
              style={{ fontSize: 12, marginRight: 10 }}
              onClick={() => setReplyTo(c.id)}
            >
              Reply
            </button>

            {currentUser?.uid === c.authorId && (
              <button
                style={{ fontSize: 12, color: "red" }}
                onClick={() => handleDelete(c.id)}
              >
                Delete
              </button>
            )}
          </div>

          {/* 🔹 Replies */}
          {getReplies(c.id).map((r) => (
            <div
              key={r.id}
              style={{
                marginLeft: 30,
                marginTop: 8,
                paddingLeft: 10,
                borderLeft: "2px solid #ddd",
              }}
            >
              <p>{r.content}</p>

              <small style={{ color: "#666" }}>
                {r.isAnonymous ? "Anonymous" : r.authorName}
              </small>

              {currentUser?.uid === r.authorId && (
                <div>
                  <button
                    style={{ fontSize: 12, color: "red" }}
                    onClick={() => handleDelete(r.id)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      {/* 🔹 Cancel Reply */}
      {replyTo && (
        <button
          style={{ marginTop: 10, fontSize: 12 }}
          onClick={() => setReplyTo(null)}
        >
          Cancel reply
        </button>
      )}

      {/* 🔹 Add Comment */}
      <div style={{ marginTop: 20 }}>
        <textarea
          placeholder={
            replyTo ? "Write a reply..." : "Write a comment..."
          }
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          style={{ width: "100%", height: 80 }}
        />

        <label style={{ display: "block", marginTop: 8 }}>
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
          />{" "}
          Post anonymously
        </label>

        <button
          style={{ marginTop: 10 }}
          onClick={handleAddComment}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default PostDetailsPage;
