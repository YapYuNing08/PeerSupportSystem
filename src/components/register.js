import { createUserWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import { auth, db } from "../firebase-config";
import { doc, setDoc } from "firebase/firestore";
import { toast } from "react-toastify";


function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("student"); // Default to student
  const [certLink, setCertLink] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userData = {
        name,
        username,
        email,
        role,
        status: role === "counselor" ? "pending" : "approved",
        certLink: role === "counselor" ? certLink : null,
        uid: user.uid,
        createdAt: new Date(),
      };

      // 3. Save to "users" collection in Firestore
      await setDoc(doc(db, "users", user.uid), userData);

      console.log("User Registered in Firestore!");
      toast.success(role === "counselor" ? "Registered! Awaiting Admin Approval." : "Registered Successfully!", {
        position: "top-center",
      });
    } catch (error) {
      toast.error(error.message, { position: "bottom-center" });
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <h3>Sign Up</h3>

      <div className="mb-3">
        <label>I am a:</label>
        <select className="form-control" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="student">Student</option>
          <option value="counselor">Counselor</option>
        </select>
      </div>

      <div className="mb-3">
        <label>Full Name</label>
        <input
          type="text"
          className="form-control"
          placeholder="name"
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>

      <div className="mb-3">
        <label>username</label>
        <input
          type="text"
          className="form-control"
          placeholder="username"
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label>Email address</label>
        <input
          type="email"
          className="form-control"
          placeholder="Enter email"
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="mb-3">
        <label>Password</label>
        <input
          type="password"
          className="form-control"
          placeholder="Enter password"
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {role === "counselor" && (
        <div className="mb-3">
          <label>Certificate Link (Google Drive/LinkedIn)</label>
          <input type="url" className="form-control" placeholder="https://..." onChange={(e) => setCertLink(e.target.value)} required />
        </div>
      )}

      <div className="d-grid">
        <button type="submit" className="btn btn-primary">
          Sign Up
        </button>
      </div>
      <p className="forgot-password text-right">
        Already registered <a href="/login">Login</a>
      </p>
    </form>
  );
}
export default Register;