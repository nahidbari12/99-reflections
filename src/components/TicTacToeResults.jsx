import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/Results.css";

function TicTacToeResults() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    outcome,
    correct = 0,
    wrong = 0,
    totalQuestions = correct + wrong,
    longestStreak = 0,
    wrongAnswers = [],
    moveCount = 0,
  } = location.state || {};

  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    setFadeIn(true);
  }, []);

  const getOutcomeText = () => {
    switch (outcome) {
      case "win":
        return "🏆 You Won!";
      case "lose":
        return "💔 You Lost!";
      case "draw":
        return "🤝 It’s a Draw!";
      default:
        return "🎮 Game Over";
    }
  };

  return (
    <div className={`results-page ${fadeIn ? "fade-in" : ""}`}>
      <h1>{getOutcomeText()}</h1>

      <p className="results-moves">🎮 Moves Made: {moveCount}</p>
      <p className="results-streak">🔥 Longest Streak: {longestStreak}</p>
      <p className="results-accuracy">
        ✅ You got {correct} out of {totalQuestions} questions right
      </p>

      {wrongAnswers.length > 0 && (
        <div className="review-section">
          <h3>❌ Review Incorrect Answers</h3>
          <ul>
            {wrongAnswers.map((item, idx) => (
              <li key={idx}>
                <strong>{item.name}</strong> — Correct: {item.correct}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="results-buttons">
        <button
          className="gold-button"
          onClick={() => navigate("/gamer-mode/tic-tac-toe")}
        >
          🔁 Play Again
        </button>
      </div>

      <button
        className="back-home-button"
        onClick={() => navigate("/gamer-mode")}
      >
        ⬅ Back to Gamer Mode
      </button>
    </div>
  );
}

export default TicTacToeResults;
