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
import CounselorPage from "./pages/counselorpage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ModeratorDashboard from "./pages/moderatorpage";
import ApproveCounselorPage from "./pages/admin/approvecounselors";
import TechnicalIssuesPage from "./pages/admin/TechnicalIssuesPage";
import MoodTracker from './components/student/MoodTracker';
import MoodAnalysis from "./components/student/MoodAnalysis";
import StudentNavbar from "./components/student/StudentNavbar";


import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { db, auth } from "./firebase-config";
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from "firebase/firestore";


function AppContent() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // Fetch the role from Firestore when user logs in
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserRole(docSnap.data().role);
        }
      } else {
        setUserRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    auth.signOut();
    window.location.href = "/";
  };

  // Define paths where the Navbar should NOT appear
  const hideNavbarPaths = ["/", "/login", "/register", "/home"];
  
  // Show student navbar if user is logged in AND we are not on a public page AND role is student
  const showStudentNavbar = user && !hideNavbarPaths.includes(location.pathname) && userRole === "student";

  return (
    <div className="App">
      {/* 2. RENDER NAVBAR CONDITIONALLY */}
      {showStudentNavbar && <StudentNavbar handleLogout={handleLogout} />}

      {/* 3. ADD MARGIN IF NAVBAR IS VISIBLE */}
      <div className={showStudentNavbar ? "main-content-with-nav" : "auth-wrapper"}>
        <Routes>
          {/* AUTH ROUTES */}
          <Route path="/" element={<div className="auth-inner"><Login /></div>} />
          <Route path="/login" element={<div className="auth-inner"><Login /></div>} />
          <Route path="/register" element={<div className="auth-inner"><SignUp /></div>} />

          {/* DASHBOARD ROUTES */}
          <Route path="/home" element={<Home />} />
          <Route path="/admin/admin-dashboard" element={<AdminDashboard />} />
          
          {/* STUDENT ROUTES */}
          <Route path="/student-page" element={<MoodTracker/>} />
          <Route path="/student/analysis" element={<MoodAnalysis/>} />
          
          {/* OTHER ROUTES */}
          <Route path="/counselor-page" element={<CounselorPage />} />
          <Route path="/moderator-dashboard" element={<ModeratorDashboard />} />
          <Route path="/admin/approve-counselors" element={<ApproveCounselorPage />} />
          <Route path="/admin/technical-issues" element={<TechnicalIssuesPage />} />
        </Routes>
      </div>
      <ToastContainer />
    </div>
  );
}


function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;