// /src/components/ChessDifficulty.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ChessDifficulty.css";

function ChessDifficulty() {
  const navigate = useNavigate();

  const handleDifficultySelect = (level) => {
    localStorage.setItem("cpuDifficulty", level);
    navigate("/gamer-mode/chess");
  };

  return (
    <div className="cpu-difficulty-page">
      <div className="cpu-difficulty-header">
        <div className="arabic-calligraphy">أسماء الحسنى</div>
        <div className="game-title">Asma’ul Husna · Chess</div>
      </div>

      <div className="cpu-difficulty-card">
        <h1 className="difficulty-title">
          Choose Your Opponent
        </h1>
        <p className="difficulty-subtitle">
          Each move comes with a flashcard challenge. Pick your CPU strength and step into the match.
        </p>

        <div className="difficulty-options">
          <button
            className="difficulty-button easy"
            onClick={() => handleDifficultySelect("easy")}
          >
            <div className="difficulty-label">
              🟢 Easy
            </div>
            <div className="difficulty-description">
              Relaxed play. Great for learning the Names and getting familiar with the board.
            </div>
          </button>

          <button
            className="difficulty-button medium"
            onClick={() => handleDifficultySelect("medium")}
          >
            <div className="difficulty-label">
              🟡 Medium
            </div>
            <div className="difficulty-description">
              A balanced challenge. The CPU looks for smart trades and tactical captures.
            </div>
          </button>

          <button
            className="difficulty-button hard"
            onClick={() => handleDifficultySelect("hard")}
          >
            <div className="difficulty-label">
              🔴 Hard
            </div>
            <div className="difficulty-description">
              The most intense mode. The CPU hunts for strong positions and material advantage.
            </div>
          </button>
        </div>

        <button
          className="back-button"
          onClick={() => navigate("/gamer-mode")}
        >
          ⬅ Back to Gamer Mode
        </button>
      </div>
    </div>
  );
}

export default ChessDifficulty;
