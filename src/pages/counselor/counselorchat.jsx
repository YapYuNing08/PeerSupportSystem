import { db, auth } from "../../firebase-config";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { toast } from "react-toastify";
import CounselorNavbar from "../../components/counselor/counselorNavbar";
import "./counselorchat.css";

function CounselorChat() {
      const handleLogout = async () => {
        try {
          await signOut(auth); // Properly sign out from Firebase
          toast.success("Logged out successfully");
          window.location.href = "/login";
        } catch (error) {
          toast.error("Logout failed");
        }
      };
  
return (
    <div className="counselor-layout">
      <CounselorNavbar handleLogout={handleLogout} />
      
      <main className="counselor-main-content">
        {/* TOP SECTION: 3 CARDS */}
        <div className="status-overview">
          <div className="status-card waiting">
            <h3>0</h3>
            <p>Waiting</p>
          </div>
          <div className="status-card ongoing">
            <h3>0</h3>
            <p>Ongoing</p>
          </div>
          <div className="status-card completed">
            <h3>0</h3>
            <p>Completed</p>
          </div>
        </div>

        {/* BOTTOM SECTION: URGENCY LIST */}
        <section className="urgency-container">
          <div className="section-header">
            <h2>Urgent Chat Requests</h2>
            <p>Priority based on student mood alerts</p>
          </div>

          <div className="urgency-list-placeholder">
            {/* We will map Firebase data here later */}
            <p className="empty-msg">No active requests at the moment.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
export default CounselorChat;