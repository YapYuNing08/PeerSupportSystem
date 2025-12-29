import React from "react";
import { useNavigate } from "react-router-dom";
import "./JoinForumCard.css";

const JoinForumCard = () => {
  const navigate = useNavigate();

  return (
    <div className="forum-card join-forum-card" onClick={() => navigate("/join-forum")}>
      <h3>➕ Join New Forum</h3>
      <p>Discover and join more forums</p>
    </div>
  );
};

export default JoinForumCard;
