import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import { auth, db } from "../firebase-config";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import "./auth.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";


function Login() {
  const [isStaffMode, setIsStaffMode] = useState(false);
  const [emailOrId, setEmailOrId] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("student");
  const [showPassword, setShowPassword] = useState(false);
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let loginEmail = emailOrId;
      
      if(isStaffMode) {
        loginEmail = emailOrId.includes("@") ? emailOrId : `${emailOrId}@system.com`;
      }

      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, password);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();

        if (!isStaffMode && (userData.role === "admin" || userData.role === "moderator")) {
          await auth.signOut();
          toast.error("Please use the Staff Login link below.");
          return;
        }

        if (isStaffMode && (userData.role !== "admin" && userData.role !== "moderator")) {
          await auth.signOut();
          toast.error("This ID is not registered as Staff.");
          return;
        }

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

        if (userData.status === "suspended") {
          const today = new Date();
          const endDate = new Date(userData.suspensionEnd);

          if (today < endDate) {
            toast.warning(`⚠️ Forum Access Suspended until ${endDate.toLocaleDateString()}`);
          } else {
            const { updateDoc, doc } = require ("firebase/firestore");
            await updateDoc(doc(db, "users", user.uid), {
              status: "active",
              waarningCounts: 0
            });
            toast.success("✅ Suspension lifted. Full access restored.");
          }
        } 

        toast.success("Login Successful!");
        if (userData.role === "student") {
          window.location.href = "/student-page";
        } 
        else if (userData.role === "counselor") {
          window.location.href = "/counselor/chat-dashboard";
        } 
        else if (userData.role === "admin") {
          window.location.href = "/admin/admin-dashboard";
        } 
        else if (userData.role === "moderator") {
          window.location.href = "/moderator-dashboard";
        } 
        else {
          window.location.href = "/home"; 
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
        {/* handles "Enter" Key automatically */}
        <form onSubmit={handleSubmit}>
          
          <h3>{isStaffMode ? "Staff Portal" : "Welcome Back To SoftSpace"}</h3>
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

            <div className="password-wrap">
              <input
                type={showPassword ? "text" : "password"}
                className="form-control"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button
                type="button"
                className="btn-toggle-pass"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
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