import React, { useState, useEffect } from 'react';
import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import Login from "./pages/login";
import SignUp from "./pages/register";

import StudentProfile from "./pages/student/StudentProfile";
import CounselorSupport from "./pages/student/CounselorSupport";
import MoodTracker from './pages/student/MoodTracker';
import MoodAnalysis from "./pages/student/MoodAnalysis";
import StudentChatRoom from "./pages/student/StudentChat";

import ChatDashboard from "./pages/counselor/chatDashboard";
import Notes from "./pages/counselor/notes";
import CounselorChatRoom from "./pages/counselor/CounselorChatRoom";

import AdminDashboard from "./pages/admin/AdminDashboard";
import ApproveCounselorPage from "./pages/admin/approvecounselors";
import FlaggedContentPage from "./pages/moderator/FlaggedContentPage";
import WarningMessagePage from "./pages/moderator/WarningMessagePage";
import AutoModerationPage from "./pages/moderator/AutoModerationPage";
import CreateForumPage from "./pages/admin/CreateForumPage";

import AdminNotificationsPage from "./pages/admin/AdminNotificationsPage";
import TechnicalIssuesPage from "./pages/admin/TechnicalIssuesPage";
import SuspendedStudentsPage from "./pages/admin/SuspendedStudentsPage";
import JoinForumPage from "./pages/student/JoinForumPage";
import MyForumsPage from "./pages/student/MyForumsPage";
import ForumDetailsPage from "./pages/student/ForumDetailsPage";
import CreatePostPage from "./pages/student/CreatePostPage";
import PostDetailsPage from "./pages/student/PostDetailsPage";
import StudentNotificationsPage from "./pages/student/StudentNotificationsPage"; 

import ModeratorDashboard from "./pages/moderatorpage";
// import CounselorPage from "./pages/counselorpage";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { auth } from "./firebase-config";

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

          {/* DASHBOARDS (Full Screen - No auth-inner wrapper) */}
          <Route path="/admin/admin-dashboard" element={<AdminDashboard />} />

          <Route path="/profile" element={<StudentProfile />} />
          <Route path="/student-page" element={<MoodTracker/>} />
          <Route path="/student/analysis" element={<MoodAnalysis/>} />
          <Route path="/student/counselor-support" element={<CounselorSupport />} />
          <Route path="/student/chat/:requestId" element={<StudentChatRoom />} />.

          <Route path="/counselor/chat-dashboard" element={<ChatDashboard />} />
          <Route path="/counselor/notes" element={<Notes />} />
          <Route path="/chat/:requestId" element={<CounselorChatRoom />} />

          <Route path="/moderator-dashboard" element={<ModeratorDashboard />} />
          <Route path="/admin/approve-counselors" element={<ApproveCounselorPage />} />
          <Route path="/moderator" element={<ModeratorDashboard />} />
          <Route path="/moderator/flagged" element={<FlaggedContentPage />} />
          <Route path="/moderator/warnings" element={<WarningMessagePage />} />
          <Route path="/moderator/auto-moderation" element={<AutoModerationPage />} />
          <Route path="/admin/create-forum" element={<CreateForumPage />} />
          <Route path="/admin/technical-issues" element={<TechnicalIssuesPage />} />
          <Route path="/admin/suspended-students" element={<SuspendedStudentsPage />} />
          <Route path="/join-forum" element={<JoinForumPage />} />
          <Route path="/my-forums" element={<MyForumsPage />} />
          <Route path="/forum/:forumId" element={<ForumDetailsPage />} />
          <Route path="/forum/:forumId/new-post" element={<CreatePostPage />} />
          <Route path="/post/:postId" element={<PostDetailsPage />} />
          <Route path="/student/notifications" element={<StudentNotificationsPage />} />
          <Route path="/admin/notifications" element={<AdminNotificationsPage />}/>

        </Routes>
        <ToastContainer />
      </div>
    </Router>
  );
}

export default App;