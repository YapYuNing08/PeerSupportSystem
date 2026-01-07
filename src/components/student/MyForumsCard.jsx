import React from "react";
import { useNavigate } from "react-router-dom";
import "./MyForumsCard.css";

const MyForumsCard = () => {
  const navigate = useNavigate();

  return (
    <div className="my-forums-card" onClick={() => navigate("/my-forums")}>
      <div className="card-icon">💬</div>
      <div className="card-content">
        <h3>My Forums</h3>
        <p>See the forums you have joined</p>
      </div>
    </div>
  );
};

export default MyForumsCard;
