import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


import Login from "./pages/login";
import SignUp from "./pages/register";

/*student*/
import StudentProfile from "./pages/student/StudentProfile";
import MoodTracker from './pages/student/MoodTracker';
import MoodAnalysis from "./pages/student/MoodAnalysis";
import StudentChatRoom from "./pages/student/StudentChat";
import CounselorSupport from "./pages/student/CounselorSupport";
import JoinForumPage from "./pages/student/JoinForumPage";
import MyForumsPage from "./pages/student/MyForumsPage";
import ForumDetailsPage from "./pages/student/ForumDetailsPage";
import CreatePostPage from "./pages/student/CreatePostPage";
import PostDetailsPage from "./pages/student/PostDetailsPage";
import StudentNotificationsPage from "./pages/student/StudentNotificationsPage"; 


/*counselor */
import ChatDashboard from "./pages/counselor/chatDashboard";
import MotivationalNotes from "./pages/counselor/MotivationalNotes";
import CounselorChatRoom from "./pages/counselor/CounselorChatRoom";

/*admin */
import AdminDashboard from "./pages/admin/AdminDashboard";
import ApproveCounselorPage from "./pages/admin/approvecounselors";
import CreateForumPage from "./pages/admin/CreateForumPage";
import AdminNotificationsPage from "./pages/admin/AdminNotificationsPage";
import TechnicalIssuesPage from "./pages/admin/TechnicalIssuesPage";
import SuspendedStudentsPage from "./pages/admin/SuspendedStudentsPage";
import UserListPage from "./pages/admin/UserListPage";

/*moderator */
import ModeratorDashboard from "./pages/moderator/moderatorpage";
import FlaggedContentPage from "./pages/moderator/FlaggedContentPage";
import WarningMessagePage from "./pages/moderator/WarningMessagePage";
import AutoModerationPage from "./pages/moderator/AutoModerationPage";


function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* LOGIN & REGISTER (Wrapped in auth-wrapper) */}
          <Route path="/" element={
            <div className="auth-wrapper"><div className="auth-inner"><Login /></div></div>
          } />
          <Route path="/login" element={
            <div className="auth-wrapper"><div className="auth-inner"><Login /></div></div>
          } />
          <Route path="/register" element={
            <div className="auth-wrapper"><div className="auth-inner"><SignUp /></div></div>
          } />

          {/*student route */}
          <Route path="/profile" element={<StudentProfile />} />
          <Route path="/student-page" element={<MoodTracker/>} />
          <Route path="/student/analysis" element={<MoodAnalysis/>} />
          <Route path="/student/counselor-support" element={<CounselorSupport />} />
          <Route path="/student/chat/:requestId" element={<StudentChatRoom />} />
          <Route path="/join-forum" element={<JoinForumPage />} />
          <Route path="/my-forums" element={<MyForumsPage />} />
          <Route path="/forum/:forumId" element={<ForumDetailsPage />} />
          <Route path="/post/:postId" element={<PostDetailsPage />} />
          <Route path="/student/notifications" element={<StudentNotificationsPage />} />
          <Route path="/forum/:forumId/new-post" element={<CreatePostPage />} />

          {/*admin route */}
          <Route path="/admin/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin/approve-counselors" element={<ApproveCounselorPage />} />
          <Route path="/admin/create-forum" element={<CreateForumPage />} />
          <Route path="/admin/technical-issues" element={<TechnicalIssuesPage />} />
          <Route path="/admin/suspended-students" element={<SuspendedStudentsPage />} />
          <Route path="/admin/notifications" element={<AdminNotificationsPage />}/>
          <Route path="/admin/users" element={<UserListPage />} />

          {/*counselor route */}
          <Route path="/counselor/chat-dashboard" element={<ChatDashboard />} />
          <Route path="/counselor/notes" element={<MotivationalNotes />} />
          <Route path="/chat/:requestId" element={<CounselorChatRoom />} />
          
          {/*moderator route */}
          <Route path="/moderator-dashboard" element={<ModeratorDashboard />} />
          <Route path="/moderator/flagged" element={<FlaggedContentPage />} />
          <Route path="/moderator/warnings" element={<WarningMessagePage />} />
          <Route path="/moderator/auto-moderation" element={<AutoModerationPage />} />
        </Routes>
        <ToastContainer />
      </div>
    </Router>
  );
}

export default App;