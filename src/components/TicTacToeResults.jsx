// /src/components/TicTacToeResults.jsx

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/Results.css";
import NextStepCard from "./NextStepCard";

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

  // ✅ Guard: if user hits this page directly, send them back gracefully
  useEffect(() => {
    if (!location.state) {
      navigate("/gamer-mode", { replace: true });
      return;
    }
    setFadeIn(true);
  }, [location.state, navigate]);

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

  const getOutcomeSubtitle = () => {
    switch (outcome) {
      case "win":
        return "Your strategy and memory worked together beautifully.";
      case "lose":
        return "Every loss is a data point. Review your answers and come back stronger.";
      case "draw":
        return "Neck and neck! A few answers could tilt the board next time.";
      default:
        return "Take a quick look at your stats, then jump back into Gamer Mode.";
    }
  };

  const accuracy =
    totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;

  return (
    <div className={`results-page ttt-results ${fadeIn ? "fade-in" : ""}`}>
      <div className="results-card-shell">
        <div className="results-header">
          <p className="results-label">🎮 Gamer Mode · Tic-Tac-Toe</p>
          <h1 className="results-title">{getOutcomeText()}</h1>
          <p className="results-subtitle">{getOutcomeSubtitle()}</p>
        </div>

        <div className="results-stats-grid">
          <div className="results-stat">
            <span className="stat-label">Moves Played</span>
            <span className="stat-value">{moveCount}</span>
          </div>

          <div className="results-stat">
            <span className="stat-label">Questions Answered</span>
            <span className="stat-value">{totalQuestions}</span>
          </div>

          <div className="results-stat">
            <span className="stat-label">Correct Answers</span>
            <span className="stat-value stat-value-good">{correct}</span>
          </div>

          <div className="results-stat">
            <span className="stat-label">Wrong Answers</span>
            <span className="stat-value stat-value-wrong">{wrong}</span>
          </div>

          <div className="results-stat">
            <span className="stat-label">Longest Streak</span>
            <span className="stat-value">{longestStreak} 🔥</span>
          </div>

          <div className="results-stat">
            <span className="stat-label">Accuracy</span>
            <span className="stat-value">
              {accuracy}
              <span className="stat-unit">%</span>
            </span>
          </div>
        </div>

        {wrongAnswers.length > 0 && (
          <div className="review-section">
            <h3 className="review-title">❌ Review & Learn</h3>
            <p className="review-subtitle">
              These are the questions you missed. Take a second to lock them in.
            </p>
            <ul className="review-list">
              {wrongAnswers.map((item, idx) => (
                <li key={idx} className="review-item">
                  <div className="review-name">{item.name}</div>
                  <div className="review-correct-wrapper">
                    <span className="review-correct-label">
                      Correct meaning:
                    </span>
                    <span className="review-correct-value">{item.correct}</span>
                  </div>
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
            🔁 Play Tic-Tac-Toe Again
          </button>

          <button
            className="ghost-button"
            onClick={() => navigate("/gamer-mode")}
          >
            ⬅ Back To Gamer Mode
          </button>
        </div>
        <NextStepCard context="tic_tac_toe" hasMistakes={wrongAnswers.length > 0} />
      </div>

      {/* Subtle background glow */}
      <div className="results-orbit-glow" aria-hidden="true" />
    </div>
  );
}

export default TicTacToeResults;
