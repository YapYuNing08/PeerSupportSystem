import { createUserWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import { auth, db } from "../firebase-config";
import { doc, setDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";


import "./auth.css";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("student"); 
  const [certLink, setCertLink] = useState("");
  const navigate = useNavigate();
  const [faculty, setFaculty] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const faculties = [
    "FCI (Computing & Informatics)",
    "FAIE (Artificial Intelligence & Engineering)",
    "FCM (Creative Multimedia)",
    "FOM (Management)",
    "FAC (Applied Communication)",
    "FCA (Cinematic Arts)",
    "FOL (Law)"
  ];
  
  const handleRegister = async (e) => {
    e.preventDefault();

    if (!agreeTerms) {
      toast.error("Please agree to the Terms & Conditions before registering.", {
        position: "top-center"
      });
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match!", { position: "top-center" });
      return;
    }

    if (role === "student") {
      const mmuEmailPattern = /^[a-zA-Z0-9._%+-]+@student\.mmu\.edu\.my$/;
      if (!mmuEmailPattern.test(email)) {
        toast.error("Students must use an @student.mmu.edu.my email address.", {
          position: "top-center"
        });
        return; 
      }

        if (!faculty) {
          toast.error("Please select your faculty.", { position: "top-center" });
          return;
      }
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userData = {
        name,
        username,
        email,
        role,
        faculty: role === "student" ? faculty : null,
        status: role === "counselor" ? "pending" : "approved",
        certLink: role === "counselor" ? certLink : null,
        uid: user.uid,
        createdAt: new Date(),
      };

      await setDoc(doc(db, "users", user.uid), userData);

      console.log("User Registered in Firestore!");
      toast.success(role === "counselor" ? "Registered! Awaiting Admin Approval." : "Registered Successfully!", {
        position: "top-center",
      });
      if (role === "student") {
        navigate("/join-forum"); // student must join forum
      } else {
        navigate("/login"); // counselor waits for approval
      }
    } catch (error) {
      toast.error(error.message, { position: "bottom-center" });
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-inner">
        <form onSubmit={handleRegister}>
          <h3>Create Account</h3>
          <p className="auth-subtitle">Join the SoftSpace peer support system</p>

          <div className="mb-4">
            <label className="form-label">I am a:</label>
            <div className="role-toggle-container">
              <div 
                className="selection-slider" 
                style={{ 
                  transform: role === "counselor" ? "translateX(100%)" : "translateX(0%)" 
                }}
              ></div>
              
              <label className={`role-option ${role === "student" ? "active" : ""}`}>
                <input
                  type="radio"
                  name="regRole"
                  value="student"
                  checked={role === "student"}
                  onChange={(e) => setRole(e.target.value)}
                />
                Student
              </label>

              <label className={`role-option ${role === "counselor" ? "active" : ""}`}>
                <input
                  type="radio"
                  name="regRole"
                  value="counselor"
                  checked={role === "counselor"}
                  onChange={(e) => setRole(e.target.value)}
                />
                Counselor
              </label>
            </div>
          </div>

          <div className="form-row mb-3">
            <label className="form-label-fixed">Full Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="name"
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="form-row mb-3">
            <label className="form-label-fixed">Username</label>
            <input
              type="text"
              className="form-control"
              placeholder="username"
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {role == "student" && (
            <div className="form-row mb-3">
              <label className="form-label-fixed">Faculty</label>
              <select 
                className="form-control" 
                value={faculty} 
                onChange={(e) => setFaculty(e.target.value)} 
                required
              >
                <option value="">Select your Faculty</option>
                {faculties.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-row mb-3">
            <label className="form-label-fixed">Email address</label>
            <input
              type="email"
              className="form-control"
              placeholder={role === "student" ? "example@student.mmu.edu.my" : "Enter email"}
              onChange={(e) => setEmail(e.target.value)}
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

          <div className="form-row mb-3">
            <label className="form-label-fixed">Confirm Password</label>

            <div className="password-wrap">
              <input
                type={showPassword ? "text" : "password"}
                className="form-control"
                placeholder="Re-enter password"
                onChange={(e) => setConfirmPassword(e.target.value)}
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

          {role === "counselor" && (
            <div className="form-row mb-3">
              <label className="form-label-fixed">Certificate Link</label>
              <input type="url" className="form-control" placeholder="https://..." onChange={(e) => setCertLink(e.target.value)} required />
            </div>
          )}

          {/* Terms + checkbox */}
          <div className="terms-box">
            <p className="terms-title">Terms and Conditions</p>
            <ol className="terms-list">
              <li>
                <strong>Privacy and Data Protection:</strong> Your personal
                information is protected and will only be used for peer support
                and system operation purposes.
              </li>
              <li>
                <strong>Responsible Use:</strong> Users must communicate
                respectfully. Harassment, harmful content, or misuse is
                prohibited.
              </li>
              <li>
                <strong>Account Management:</strong> Administrators reserve the
                right to suspend or terminate accounts that violate platform
                policies.
              </li>
            </ol>

            <label className="terms-check">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
              />
              <span>
                I have read and agree to the Terms & Conditions and Privacy
                Policy.
              </span>
            </label>
          </div>

          <div className="d-grid">
            <button type="submit" className="btn btn-primary">
              Sign Up
            </button>
          </div>
          <p className="auth-switch">
            Already registered? <a href="/login">Login</a>
          </p>
        </form>
      </div>
    </div>
  );
}
export default Register;