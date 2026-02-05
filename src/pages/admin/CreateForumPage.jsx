import React, { useEffect, useState } from "react";
import { db, auth } from "../../firebase-config";
import { useNavigate } from "react-router-dom";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { toast } from "react-toastify";
import "./CreateForumPage.css";

function CreateForumPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [forums, setForums] = useState([]);
  const navigate = useNavigate();
  const [type, setType] = useState("general"); 
  const [facultyCode, setFacultyCode] = useState("");
  const facultyCodes = ["FCI", "FAIE", "FCM", "FOM", "FAC", "FCA", "FOL"];


  // 🔹 Real-time fetch forums
  useEffect(() => {
    const q = query(
      collection(db, "forums"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const forumList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setForums(forumList);
    });

    return () => unsubscribe();
  }, []);

  // 🔹 Create forum
  const handleCreateForum = async (e) => {
    e.preventDefault();

    if (!name || !description) {
      toast.error("All fields required");
      return;
    }

    try {
      await addDoc(collection(db, "forums"), {
        name,
        description,
        type, // "general" or "faculty"
        facultyCode: type === "faculty" ? facultyCode : null,
        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        isActive: true,
      });

      toast.success("Forum created successfully");
      setName("");
      setDescription("");
    } catch (error) {
      toast.error("Failed to create forum");
    }
  };

  return (
    <div className="admin-dashboard-container">

      <button 
          onClick={() => navigate("/admin/admin-dashboard")}
          className="btn btn-sm btn-outline-danger" 
          style={{ marginBottom: "10px", backgroundColor: "white" }}
        >
          ← Back to Dashboard
        </button>

      {/* 🔹 CREATE FORUM FORM */}
      <div className="form-card">
        <h2>Create New Forum</h2>

        <form onSubmit={handleCreateForum}>
          <input
            type="text"
            placeholder="Forum Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <textarea
            placeholder="Forum Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <select value={type} onChange={(e) => setType(e.target.value)} required>
            <option value="general">General Forum</option>
            <option value="faculty">Faculty Forum</option>
          </select>

          {type === "faculty" && (
            <select value={facultyCode} onChange={(e) => setFacultyCode(e.target.value)} required>
              <option value="">Select Faculty Code</option>
              {facultyCodes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}


          <button type="submit" className="btn btn-primary">
            Create Forum
          </button>
        </form>
      </div>

      {/* 🔹 FORUM LIST */}
      <div className="forum-list">
        <h3>Existing Forums</h3>

        {forums.length === 0 ? (
          <p className="empty-text">No forums created yet</p>
        ) : (
          forums.map((forum) => (
            <div key={forum.id} className="forum-card">
              <h4>{forum.name}</h4>
              <p>{forum.description}</p>
              <span className="forum-status">
                {forum.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          ))
        )}
      </div>

    </div>
  );
}

export default CreateForumPage;
