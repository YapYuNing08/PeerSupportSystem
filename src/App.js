import React, { useState, useEffect } from 'react';
import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/login";
import SignUp from "./pages/register";
import Home from "./pages/home";
// import StudentPage from "./pages/student/studentpage";
import CounselorPage from "./pages/counselorpage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ModeratorDashboard from "./pages/moderatorpage";
import ApproveCounselorPage from "./pages/admin/approvecounselors";
import TechnicalIssuesPage from "./pages/admin/TechnicalIssuesPage";
import MoodTracker from './components/student/MoodTracker';
import MoodAnalysis from "./components/student/MoodAnalysis";


import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
//import { useState } from "react";
// import { auth } from "./firebase-config";
import { db, auth } from "./firebase-config";
import { onAuthStateChanged } from 'firebase/auth';




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
          {/* <Route path="/student-page" element={<StudentPage />} /> */}
          <Route path="/student-page" element={<MoodTracker/>} />
          
          <Route path="/student/analysis" element={<MoodAnalysis/>} />
          <Route path="/counselor-page" element={<CounselorPage />} />
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