import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import { auth, db } from "../firebase-config";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";

function Login() {
  const [isStaffMode, setIsStaffMode] = useState(false);
  const [emailOrId, setEmailOrId] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("student");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let loginEmail = emailOrId;
      
      if(isStaffMode) {
        // Fixed: Use backticks for template literals
        loginEmail = emailOrId.includes("@") ? emailOrId : `${emailOrId}@system.com`;
      }

      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, password);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();

        // Check if Staff is trying to use User login
        if (!isStaffMode && (userData.role === "admin" || userData.role === "moderator")) {
          await auth.signOut();
          toast.error("Please use the Staff Login link below.");
          return;
        }

        // Check if User is trying to use Staff login
        if (isStaffMode && (userData.role !== "admin" && userData.role !== "moderator")) {
          await auth.signOut();
          toast.error("This ID is not registered as Staff.");
          return;
        }

        // Only check selectedRole if NOT in staff mode
        if (!isStaffMode && userData.role !== selectedRole) {
          await auth.signOut();
          toast.error(`This account is not registered as a ${selectedRole}.`);
          return;
        }

        if (userData.role === "counselor" && userData.status === "pending") {
          await auth.signOut();
          toast.error("Your counselor account is pending admin approval.");
          return;
        }

        toast.success("Login Successful!");
        // window.location.href = "/home";
        if (userData.role === "student") {
          window.location.href = "/student-page"; // <--- Student goes to Mood Tracker
        } 
        else if (userData.role === "counselor") {
          window.location.href = "/counselor-page";
        } 
        else if (userData.role === "admin") {
          window.location.href = "/admin/admin-dashboard";
        } 
        else if (userData.role === "moderator") {
          window.location.href = "/moderator-dashboard";
        } 
        else {
          window.location.href = "/home"; // Fallback
        }
        
      } else {
        await auth.signOut();
        toast.error("User profile not found.");
      }
    } catch (error) {
      toast.error("Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-inner">
        <form onSubmit={handleSubmit}>
          <h3>{isStaffMode ? "Staff Portal" : "Welcome Back"}</h3>
          <p className="auth-subtitle">
            {isStaffMode ? "Management Login" : "Login to continue"}
          </p>

          {!isStaffMode && (
            <div className="mb-4">
              <div className="role-toggle-container">
                <div 
                  className="selection-slider" 
                  style={{ 
                    transform: selectedRole === "counselor" ? "translateX(100%)" : "translateX(0%)" 
                  }}
                ></div>
                
                <label className={`role-option ${selectedRole === "student" ? "active" : ""}`}>
                  <input
                    type="radio"
                    value="student"
                    checked={selectedRole === "student"}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  />
                  I'm Student
                </label>

                <label className={`role-option ${selectedRole === "counselor" ? "active" : ""}`}>
                  <input
                    type="radio"
                    value="counselor"
                    checked={selectedRole === "counselor"}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  />
                  I'm Counselor
                </label>
              </div>
            </div>
          )}

          <div className="form-row mb-3">
            <label className="form-label-fixed">{isStaffMode ? "Staff ID" : "Email address"}</label>
            <input
              type={isStaffMode ? "text" : "email"}
              className="form-control"
              placeholder={isStaffMode ? "Enter Staff ID" : "Enter email"}
              value={emailOrId}
              onChange={(e) => setEmailOrId(e.target.value)}
              required
            />
          </div>

          <div className="form-row mb-3">
            <label className="form-label-fixed">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="d-grid">
            <button type="submit" className="btn btn-primary">
              Login
            </button>
          </div>

          {!isStaffMode && (
            <p className="auth-switch">
              Don't have an account? <a href="/register">Register Here</a>
            </p>
          )}

          <div className="staff-switch-inline">
            <p className="staff-text">
              {isStaffMode ? "Not a staff member?" : "Are you an Admin or Moderator?"}
            </p>
            <button 
              type="button" 
              className="staff-toggle-btn" 
              onClick={() => {
                setIsStaffMode(!isStaffMode);
                setEmailOrId(""); 
              }}
            >
              {isStaffMode ? "Login as Student/Counselor" : "Login as Staff"}
            </button>
          </div>
        </form>
      </div>
    </div>    
  );
}

export default Login;