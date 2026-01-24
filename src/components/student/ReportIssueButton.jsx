import React, { useState } from "react";
import { auth } from "../../firebase-config";
import { db } from "../../firebase-config";
import { getDoc, doc } from "firebase/firestore";
import { reportIssue } from "../../models/TechnicalIssue";
import { toast } from "react-toastify";

function ReportIssueButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState("Bug");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Guard Clause: Ensure user is logged in
    if (!auth.currentUser) {
      toast.error("You must be logged in to report an issue.");
      setIsSubmitting(false);
      return;
    }

    // Check if user is suspended
    const userRef = doc(db, "users", auth.currentUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists() && userSnap.data().status === "suspended") {
      const endDate = new Date(userSnap.data().suspensionEnd).toLocaleDateString();
      toast.error(`⛔ You cannot report issues while suspended until ${endDate}.`);
      setIsSubmitting(false);
      return;
    }

    // Call the Chef (Model) to save data
    const result = await reportIssue(auth.currentUser.uid, description, category);

    if (result.success) {
      toast.success("Report sent! An admin will review it.");
      setIsOpen(false);
      setDescription("");
    } else {
      toast.error("Failed to send report. Try again.");
    }
    setIsSubmitting(false);
  };

  return (
    <>
      {/* 1. The Floating Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="btn btn-warning shadow"
        style={{
          position: "fixed",
          bottom: "75px",
          right: "20px",
          zIndex: 1000,
          borderRadius: "50px",
          padding: "10px 20px",
          fontWeight: "bold"
        }}
      >
        ⚠️ Report Issue
      </button>

      {/* 2. The Pop-up Form (Modal) */}
      {isOpen && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.box}>
            <h3>Report Technical Issue</h3>
            <form onSubmit={handleSubmit}>
              
              <div className="mb-3">
                <label className="form-label">Category</label>
                <select 
                  className="form-control" 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Bug">System Bug</option>
                  <option value="Account">Account Issue</option>
                  <option value="Feature">Feature Request</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea 
                  className="form-control" 
                  rows="4"
                  placeholder="Describe what went wrong..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Submit Report"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}

// Simple inline styles for the modal
const modalStyles = {
  overlay: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1001
  },
  box: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "8px",
    width: "400px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
  }
};

export default ReportIssueButton;