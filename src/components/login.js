import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import { auth, db } from "../firebase-config";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("student"); // Default selection

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();

        if (userData.role === "admin") {
          window.location.href = "/admin-dashboard";
          return;
        }

        if (userData.role !== selectedRole) {
          await auth.signOut();
          toast.error(`This account is not registered as a ${selectedRole}.`, { position: "top-center" });
          return;
        }

        // 4. CHECK 2: Is the account approved? (Mostly for Counselors)
        if (userData.status === "pending") {
          await auth.signOut();
          toast.error("Your counselor account is pending admin approval.", { position: "top-center" });
          return;
        }

        // Success!
        toast.success("Login Successful!");
        window.location.href = "/home";
      } else {
        await auth.signOut();
        toast.error("User profile not found in database.");
      }
    } catch (error) {
      toast.error(error.message, { position: "bottom-center" });
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-inner">
        <form onSubmit={handleSubmit}>
          <h3>Welcome Back</h3>
          <p className="auth-subtitle">Login to continue</p>

          <div className="mb-4">
            <label>Login as</label>
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
                Student
              </label>

              <label className={`role-option ${selectedRole === "counselor" ? "active" : ""}`}>
                <input
                  type="radio"
                  value="counselor"
                  checked={selectedRole === "counselor"}
                  onChange={(e) => setSelectedRole(e.target.value)}
                />
                Counselor
              </label>
            </div>
          </div>

          <div className="mb-3">
            <label>Email address</label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="d-grid">
            <button type="submit" className="btn btn-primary">
              Login
            </button>
          </div>
          <p className="auth-switch">
            Don't have an account? <a href="/register">Register Here</a>
          </p>
        </form>
      </div>
    </div>    
  );
}

export default Login;