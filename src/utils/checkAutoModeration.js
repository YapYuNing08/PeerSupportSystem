import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase-config";

export async function checkAutoModeration(text) {
  const snapshot = await getDocs(collection(db, "moderationKeywords"));
  const keywords = snapshot.docs.map(d => d.data().keyword);

  const lowerText = text.toLowerCase();

  return keywords.some(keyword =>
    lowerText.includes(keyword.toLowerCase())
  );
}
