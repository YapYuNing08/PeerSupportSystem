import React, { useEffect, useState } from "react";
import { db } from "../../firebase-config";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp
} from "firebase/firestore";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "./AutoModeration.css"; 

function AutoModerationPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");  //store the input value
  const [keywords, setKeywords] = useState([]); //store all banned keyword

  const keywordsRef = collection(db, "moderationKeywords");

  const fetchKeywords = async () => {
    const snapshot = await getDocs(keywordsRef); //fetch all document
    setKeywords(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    fetchKeywords();
  }, []); //[]no re-run

  const handleAddKeyword = async () => {  //trigger when add keyword
    if (!keyword.trim()) {
      toast.error("Keyword cannot be empty");
      return;
    }

    await addDoc(keywordsRef, {
      keyword: keyword.toLowerCase(),
      createdAt: serverTimestamp()
    });

    toast.success("Keyword added successfully");
    setKeyword("");
    fetchKeywords();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to remove this keyword?")) {
      await deleteDoc(doc(db, "moderationKeywords", id));
      toast.success("Keyword removed");
      fetchKeywords();
    }
  };

  return (
    <div className="auto-mod-container">
      <div className="mod-header">
        <h2>Auto Moderation</h2>
        <p>Manage banned words and phrases for automatic content filtering</p>
        <button className="btn-back" onClick={() => navigate("/moderator-dashboard")}>
          ← Back to Moderator Dashboard
        </button>
      </div>

      <div className="mod-grid">
        {/* add keyword card */}
        <div className="mod-card">
          <h5>➕ Add New Keyword</h5>
          <input
            type="text"
            className="mod-input"
            placeholder="e.g. spam, abuse, harassment"
            value={keyword}  //value = state
            onChange={(e) => setKeyword(e.target.value)} //onchange update state
          />
          <button className="btn-submit" onClick={handleAddKeyword}>
            Add Keyword
          </button>
        </div>

        {/* keyword list card */}
        <div className="mod-card">
          <h5>🚫 Banned Keywords</h5>
          {keywords.length === 0 ? (
            <p className="empty-text">No moderation keywords added.</p>
          ) : (
            <ul className="keyword-list">
              {keywords.map((item) => (
                <li key={item.id} className="keyword-item">
                  <span>{item.keyword}</span>
                  <button className="btn-delete" onClick={() => handleDelete(item.id)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default AutoModerationPage;