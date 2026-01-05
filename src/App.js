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
import Home from "./pages/home";

// import StudentPage from "./pages/student/studentpage";
import CounselorSupport from "./pages/student/CounselorSupport";
import MoodTracker from './components/student/MoodTracker';
import MoodAnalysis from "./components/student/MoodAnalysis";
import StudentChatRoom from "./pages/student/StudentChat";

import ChatDashboard from "./pages/counselor/chatDashboard";
import Notes from "./pages/counselor/notes";
import CounselorChatRoom from "./pages/counselor/CounselorChatRoom";

import AdminDashboard from "./pages/admin/AdminDashboard";
import ApproveCounselorPage from "./pages/admin/approvecounselors";
import TechnicalIssuesPage from "./pages/admin/TechnicalIssuesPage";

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
          <Route path="/home" element={<Home />} />
          <Route path="/admin/admin-dashboard" element={<AdminDashboard />} />

          <Route path="/student-page" element={<MoodTracker/>} />
          <Route path="/student/analysis" element={<MoodAnalysis/>} />
          <Route path="/student/counselor-support" element={<CounselorSupport />} />
          <Route path="/student/chat/:requestId" element={<StudentChatRoom />} />.

          <Route path="/counselor/chat-dashboard" element={<ChatDashboard />} />
          <Route path="/counselor/notes" element={<Notes />} />
          <Route path="/chat/:requestId" element={<CounselorChatRoom />} />

          <Route path="/moderator-dashboard" element={<ModeratorDashboard />} />
          <Route path="/admin/approve-counselors" element={<ApproveCounselorPage />} />
          <Route path="/admin/technical-issues" element={<TechnicalIssuesPage />} />

        </Routes>
        <ToastContainer />
      </div>
    </Router>
  );
}

export default App;