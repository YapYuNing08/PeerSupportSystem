import {
  doc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
  getDoc
} from "firebase/firestore";
import { db } from "../firebase-config";

export async function reportContent({
  type,
  content,
  reason,
  reporterId,
  authorId,
  postId,
  forumId,
  commentId
}) {
  // 🔹 Fetch reporter & author names
  const reporterSnap = reporterId
    ? await getDoc(doc(db, "users", reporterId))
    : null;

  const authorSnap = authorId
    ? await getDoc(doc(db, "users", authorId))
    : null;

  const reporterName = reporterSnap?.exists()
    ? reporterSnap.data().username
    : "Anonymous";

  const authorName = authorSnap?.exists()
    ? authorSnap.data().username
    : "Anonymous";

  // 🔹 Fetch post & forum info
  let postTitle = "";
  let forumName = "";

  if (postId) {
    const postSnap = await getDoc(doc(db, "posts", postId));
    if (postSnap.exists()) {
      postTitle = postSnap.data().title || "";
      const fId = postSnap.data().forumId;
      if (fId) {
        const forumSnap = await getDoc(doc(db, "forums", fId));
        forumName = forumSnap.exists() ? forumSnap.data().name : "";
      }
    }
  }

  // 🔹 Save report with SNAPSHOT data
  await addDoc(collection(db, "userReports"), {
    type,
    content,
    reason,
    reporterId,
    reporterName,
    authorId,
    authorName,
    postId: postId || null,
    postTitle,
    forumId: forumId || null,
    forumName,
    commentId: commentId || null,
    createdAt: serverTimestamp(),
    approved: null
  });

  // 🔹 Hide content SAFELY
  if (type === "post" && postId) {
    await updateDoc(doc(db, "posts", postId), {
      isHidden: true,
      isFlagged: true
    });
  }

  if (type === "comment" && commentId) {
    await updateDoc(doc(db, "comments", commentId), {
      isHidden: true,
      isFlagged: true
    });
  }
}
