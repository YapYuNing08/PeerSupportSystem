import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase-config";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

// Import your separate page components
// Ensure these files exist in your src/pages folder
import StudentPage from "./student/studentpage";
import ChatDashboard from "./counselor/chatDashboard";
import AdminDashboard from "./admin/AdminDashboard";
import ModeratorDashboard from "./moderatorpage";

function Home() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged is safer as it waits for the Firebase session to initialize
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setRole(userDoc.data().role);
          } else {
            console.error("No such user document!");
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      } else {
        // If no user is logged in, redirect to login
        window.location.href = "/login";
      }
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup listener
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status"></div>
          <h4 className="mt-3">Loading your dashboard...</h4>
        </div>
      </div>
    );
  }

  // Logic to return the specific Page Component based on Firestore role
  switch (role) {
    case "student":
      return <StudentPage />;
    case "counselor":
      return <ChatDashboard />;
    case "admin":
      return <AdminDashboard />;
    case "moderator":
      return <ModeratorDashboard />;
    default:
      return (
        <div className="container mt-5 text-center">
          <div className="alert alert-danger">
            <h4>Error: Role not recognized</h4>
            <p>Please contact support or try logging in again.</p>
            <button className="btn btn-primary" onClick={() => auth.signOut()}>Return to Login</button>
          </div>
        </div>
      );
  }
}

export default Home;