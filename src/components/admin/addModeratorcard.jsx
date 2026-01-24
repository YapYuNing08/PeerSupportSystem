import React, { useState } from "react";
import { auth, db } from "../../firebase-config";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { toast } from "react-toastify";

function AddModerator() {
  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showModal, setShowModal] = useState(false);

  const handleAddModerator = async (e) => {
    e.preventDefault();
    
    // We create the email based on your login logic: ID@system.com
    const moderatorEmail = `${staffId}@system.com`;

    try {
      // 1. Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, moderatorEmail, password);
      const user = userCredential.user;

      // 2. Save the moderator details to Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: name,
        staffId: staffId,
        email: moderatorEmail,
        role: "moderator",
        status: "approved",
        createdAt: new Date()
      });

      toast.success(`Moderator ${staffId} created successfully!`);
      setShowModal(false);
      
      // Reset fields
      setStaffId("");
      setPassword("");
      setName("");

    } catch (error) {
      toast.error("Error creating moderator: " + error.message);
    }
  };

  return (
    <>
      <div className="admin-card" onClick={() => setShowModal(true)} style={{ cursor: "pointer" }}>
        <div className="card-icon">👤+</div>
        <div className="card-info text-center">
          {/* <h3>ADD</h3> */}
          <p>MODERATOR</p>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Register New Moderator</h3>
            <form onSubmit={handleAddModerator}>
              <input 
                type="text" 
                placeholder="Staff ID (e.g. mod1)" 
                className="form-control mb-2"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                required 
              />
              <input 
                type="text" 
                placeholder="Moderator Name" 
                className="form-control mb-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required 
              />
              <input 
                type="password" 
                placeholder="Set Password" 
                className="form-control mb-3"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-confirm">Create Moderator</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default AddModerator;