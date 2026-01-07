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
import "./AutoModeration.css";
import { useNavigate } from "react-router-dom";

function AutoModerationPage() {
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState("");
  const [keywords, setKeywords] = useState([]);

  const keywordsRef = collection(db, "moderationKeywords");

  const fetchKeywords = async () => {
    const snapshot = await getDocs(keywordsRef);
    setKeywords(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    fetchKeywords();
  }, []);

  const handleAddKeyword = async () => {
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
    await deleteDoc(doc(db, "moderationKeywords", id));
    toast.success("Keyword removed");
    fetchKeywords();
  };

  return (
    <div className="container py-4">

      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Auto Moderation</h2>
          <p className="text-muted mb-0">
            Manage banned words and phrases for automatic content filtering
          </p>
          <button
    className="btn btn-outline-secondary mb-3"
    onClick={() => navigate("/moderator-dashboard")}
  >
    ← Back to Moderator Dashboard
  </button>
        </div>
      </div>

      

      <div className="row g-4">

        {/* Add Keyword Card */}
        <div className="col-md-5">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h5 className="card-title fw-semibold mb-3 text-primary">
                ➕ Add New Keyword
              </h5>

              <input
                type="text"
                className="form-control mb-3"
                placeholder="e.g. spam, abuse, harassment"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />

              <button
                className="btn btn-primary w-100"
                onClick={handleAddKeyword}
              >
                Add Keyword
              </button>
            </div>
          </div>
        </div>

        {/* Keyword List Card */}
        <div className="col-md-7">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h5 className="card-title fw-semibold mb-3">
                🚫 Banned Keywords
              </h5>

              {keywords.length === 0 ? (
                <p className="text-muted">No moderation keywords added.</p>
              ) : (
                <ul className="list-group list-group-flush">
                  {keywords.map((item) => (
                    <li
                      key={item.id}
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      <span className="fw-medium">{item.keyword}</span>

                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AutoModerationPage;
