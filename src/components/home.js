import React, { useState } from "react";
import { auth} from "../firebase-config";

function Home(){
    async function handleLogout() {
        try {
        await auth.signOut();
        window.location.href = "/login";
        console.log("User logged out successfully!");
        } catch (error) {
        console.error("Error logging out:", error.message);
        }
    }
    return(
    <div>
      <h1>Welcome</h1>
      <button className="btn btn-primary" onClick={handleLogout}>Logout</button>
    </div>

    )
}
export default Home;