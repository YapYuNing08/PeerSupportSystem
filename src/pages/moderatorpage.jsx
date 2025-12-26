import { useEffect, useState } from "react";
import { db, auth } from "../firebase-config";
import { signOut } from "firebase/auth";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  addDoc,
  deleteDoc
} from "firebase/firestore";
import { toast } from "react-toastify";

function ModeratorDashboard() {
  const [activeTab, setActiveTab] = useState("flagged");
  const [flaggedContent, setFlaggedContent] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState("");

  /* ===== LOGOUT ===== */
  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
      window.location.href = "/login";
    } catch {
      toast.error("Logout failed");
    }
  };

  /* ===== FETCH FLAGGED CONTENT ===== */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "flaggedContent"), (snapshot) => {
      setFlaggedContent(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
    });
    return () => unsub();
  }, []);

  /* ===== FETCH KEYWORDS ===== */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "moderationKeywords"), (snapshot) => {
      setKeywords(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
    });
    return () => unsub();
  }, []);

  /* ===== ACTIONS ===== */
  const markResolved = async (id) => {
    await updateDoc(doc(db, "flaggedContent", id), { status: "resolved" });
    toast.success("Marked as resolved");
  };

  const addKeyword = async () => {
    if (!newKeyword.trim()) return;
    await addDoc(collection(db, "moderationKeywords"), {
      keyword: newKeyword,
      active: true
    });
    setNewKeyword("");
    toast.success("Keyword added");
  };

  const removeKeyword = async (id) => {
    await deleteDoc(doc(db, "moderationKeywords", id));
    toast.success("Keyword removed");
  };

  return (
    <div className="container mt-4">
      {/* ===== HEADER ===== */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Moderator Dashboard</h2>
        <button className="btn btn-danger" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* ===== NAVIGATION ===== */}
      <div className="mb-4">
        <button
          className={`btn me-2 ${
            activeTab === "flagged" ? "btn-primary" : "btn-outline-primary"
          }`}
          onClick={() => setActiveTab("flagged")}
        >
          🚩 Flagged Content
        </button>

        <button
          className={`btn ${
            activeTab === "auto" ? "btn-primary" : "btn-outline-primary"
          }`}
          onClick={() => setActiveTab("auto")}
        >
          ⚙️ Auto-Moderation
        </button>
      </div>

      {/* ===== FLAGGED CONTENT ===== */}
      {activeTab === "flagged" && (
        <div className="card shadow-sm">
          <div className="card-header fw-bold">
            Flagged Posts & Comments
          </div>

          <div className="card-body">
            {flaggedContent.length === 0 ? (
              <p className="text-muted">No flagged content available.</p>
            ) : (
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Type</th>
                    <th>Content</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {flaggedContent.map(item => (
                    <tr key={item.id}>
                      <td>{item.contentType}</td>
                      <td>{item.contentText}</td>
                      <td>{item.reason}</td>
                      <td>
                        <span
                          className={`badge ${
                            item.status === "resolved"
                              ? "bg-success"
                              : "bg-warning text-dark"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td>
                        {item.status !== "resolved" && (
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => markResolved(item.id)}
                          >
                            Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ===== AUTO MODERATION ===== */}
      {activeTab === "auto" && (
        <div className="card shadow-sm">
          <div className="card-header fw-bold">
            Auto-Moderation Keywords
          </div>

          <div className="card-body">
            <div className="row mb-3">
              <div className="col-md-8">
                <input
                  className="form-control"
                  placeholder="Enter banned keyword"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <button className="btn btn-primary w-100" onClick={addKeyword}>
                  Add Keyword
                </button>
              </div>
            </div>

            <ul className="list-group">
              {keywords.length === 0 && (
                <li className="list-group-item text-muted">
                  No keywords added.
                </li>
              )}
              {keywords.map(k => (
                <li
                  key={k.id}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <span className="fw-semibold">{k.keyword}</span>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => removeKeyword(k.id)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default ModeratorDashboard;
