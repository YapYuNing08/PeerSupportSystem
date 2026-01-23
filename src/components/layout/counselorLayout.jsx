import { useState } from "react";
import CounselorNavbar from "../counselor/counselorNavbar";
import { auth } from "../../firebase-config";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";

const CounselorLayout = ({ children }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = () => setShowLogoutConfirm(true);
  
  const confirmLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
      window.location.href = "/login";
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  return (
    <div className="counselor-layout">
      <CounselorNavbar handleLogout={handleLogoutClick} />
      {children}
      
      {showLogoutConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Log Out</h3>
            <p>Are you sure you want to log out?</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
              <button className="btn-confirm-logout" onClick={confirmLogout}>Yes, Log Out</button>
            </div>
          </div>
        </div>
      )}
    </div>

    
  );

  
};

export default CounselorLayout;