import { db } from '../firebase-config';
import { collection, addDoc, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';

const collectionName = "technical_issues";

//student report issue
export const reportIssue = async (studentID, description, category) => {
  try {
    await addDoc(collection(db, collectionName), {
      studentID,
      description,
      category,
      status: "Open",
      resolution: "",
      timestamp: new Date()
    });
    return { success: true };
  } catch (error) {
    console.error("Error reporting issue: ", error);
    return { success: false, error };
  }
};

//admin get all the issue 
export const getOpenIssues = async () => {
    try {
        const q = query(collection(db, collectionName), where("status", "==", "Open"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    } catch (error) {
    console.error("Error getting issues: ", error);
    return [];
    }
};

//admin resolve issue
export const resolveIssue = async (issueID, adminNotes) => {
    try {
        const issueRef = doc(db, collectionName, issueID);
        await updateDoc(issueRef, {
            status: "Resolved",
            adminNotes: adminNotes
        });
    } catch (error) {
        console.error("Error resolving issue: ", error);
    }
};