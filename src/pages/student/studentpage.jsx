import { db, auth } from "../../firebase-config";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

function StudentPage(){
    const navigate = useNavigate();

      const handleLogout = async () => {
        try {
          await signOut(auth); // Properly sign out from Firebase
          toast.success("Logged out successfully");
          window.location.href = "/login";
        } catch (error) {
          toast.error("Logout failed");
        }
      };

    return(
    <div>
      <h1>You are in student page</h1>
      <button>
        <div onClick={() => navigate("/student/counselor-support")} >
          <p>CounselorSupport</p>
        </div>
      </button>
      <button className="btn btn-danger" onClick={handleLogout}>
          Logout
      </button>
    </div>

    )
}
export default StudentPage;