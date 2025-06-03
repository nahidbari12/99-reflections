import React from "react";
import { Link } from "react-router-dom";
import "../styles/GamerMode.css";

function GamerMode() {
  return (
    <div className="gamer-mode-page">
      <h1>🎮 Gamer Mode</h1>
      <p>
        Each move requires answering a flashcard challenge! Answer right for
        streaks & bonus turns. 5 wrong in a row = you lose!
      </p>

      <Link to="/gamer-mode/tic-tac-toe" className="game-button active">
        ❌ Tic-Tac-Toe
      </Link>

      <Link to="/gamer-mode/chess-difficulty" className="game-button">
        ♟ Chess
      </Link>

      <button disabled className="game-button disabled">
        🚩 Checkers (Coming Soon)
      </button>

      <Link to="/" className="back-button">
        ⬅️ Back
      </Link>
    </div>
  );
}

export default GamerMode;
