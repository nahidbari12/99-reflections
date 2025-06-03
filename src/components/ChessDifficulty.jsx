import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ChessDifficulty.css"; // ✅ Use correct file for styling

function ChessDifficulty() {
  const navigate = useNavigate();

  const handleDifficultySelect = (level) => {
    localStorage.setItem("cpuDifficulty", level);
    navigate("/gamer-mode/chess");
  };

  return (
    <div className="cpu-difficulty-page"> {/* ✅ Updated wrapper class */}
      <h1 className="difficulty-title">Face an Opponent: From Novice to Grandmaster</h1>
      <p className="difficulty-subtitle">Select your challenge level to begin the Chess match.</p>

      <div className="difficulty-options">
        <button className="difficulty-button" onClick={() => handleDifficultySelect("easy")}>
          🟢 Easy
        </button>
        <button className="difficulty-button" onClick={() => handleDifficultySelect("medium")}>
          🟡 Medium
        </button>
        <button className="difficulty-button" onClick={() => handleDifficultySelect("hard")}>
          🔴 Hard
        </button>
      </div>

      <button className="back-button" onClick={() => navigate("/gamer-mode")}>
        ⬅️ Back
      </button>
    </div>
  );
}

export default ChessDifficulty;
