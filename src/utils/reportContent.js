import {
  doc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
  getDoc,
  increment
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

  const targetRef =
    type === "post"
      ? doc(db, "posts", postId)
      : doc(db, "comments", commentId);

  const targetSnap = await getDoc(targetRef);
  if (!targetSnap.exists()) return;

  const currentCount = targetSnap.data().reportCount || 0;
  const newCount = currentCount + 1;

  //Always save the report
  await addDoc(collection(db, "userReports"), {
    type,
    content,
    reason,
    reporterId,
    authorId,
    postId: postId || null,
    forumId: forumId || null,
    commentId: commentId || null,
    createdAt: serverTimestamp(),
    reportNumber: newCount
  });

  //Update report count
  await updateDoc(targetRef, {
    reportCount: increment(1)
  });

  //ONLY hide when >= 3 reports
  if (newCount >= 2) {
    await updateDoc(targetRef, {
      isHidden: true,
      isFlagged: true,
      approved: null
    });
  }
}
