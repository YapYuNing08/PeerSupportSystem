import React from "react";
import StudentNavbar from "../student/StudentNavbar";
import { auth } from "../../firebase-config";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";

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

  return (
    <div className="student-layout">
      <StudentNavbar handleLogout={handleLogout} />
      {children}
    </div>
  );
};

export default StudentLayout;