import React, { useEffect } from "react";
import StudentNavbar from "../student/StudentNavbar";
import { auth, db } from "../../firebase-config";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";
import { doc, getDoc, updateDoc, addDoc, serverTimestamp, collection } from "firebase/firestore";

const StudentLayout = ({ children }) => {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
      window.location.href = "/login";
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  useEffect(() => {
    const autoReactivate = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) return;

      const data = snap.data();
      if (data.status !== "suspended" || !data.suspensionEnd) return;

      const now = new Date();
      const end = new Date(data.suspensionEnd);

      if (now < end) return;

      // Reactivate user
      await updateDoc(userRef, {
        status: "active",
        suspensionEnd: null,
        warningCount: 0
      });

      // Notify studen
      await addDoc(collection(db, "notifications"), {
        targetRole: "student",
        userId: user.uid,
        type: "reactivate",
        message: "Your account suspension has ended. You are now active again.",
        createdAt: serverTimestamp(),
        read: false
      });

      // Notify admins
      await addDoc(collection(db, "notifications"), {
        targetRole: "admin",
        type: "reactivate",
        studentId: user.uid,
        message: "Student account auto-reactivated after suspension period ended.",
        createdAt: serverTimestamp(),
        handled: false
      });
    };

    autoReactivate();
  }, []);


  return (
    <div className="student-layout">
      <StudentNavbar handleLogout={handleLogout} />
      {children}
    </div>
  );
};

export default StudentLayout;