import React from "react";
import CounselorNavbar from "../counselor/counselorNavbar";
import { auth } from "../../firebase-config";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";

const CounselorLayout = ({ children }) => {
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
    <div className="counselor-layout">
      <CounselorNavbar handleLogout={handleLogout} />
      {children}
    </div>
  );
};

export default CounselorLayout;