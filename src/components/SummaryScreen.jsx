// /src/components/SummaryScreen.jsx

import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/SummaryScreen.css";

function SummaryScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { score, correct, wrong, longestStreak } = location.state || {};

  return (
    <div className="summary-page">
      <div className="summary-box">
        <h1>🏁 Challenge Summary</h1>
        <p><strong>Final Score:</strong> {score}</p>
        <p><strong>Correct Answers:</strong> {correct}</p>
        <p><strong>Wrong Answers:</strong> {wrong}</p>
        <p><strong>Longest Streak:</strong> {longestStreak}</p>

        <div className="summary-buttons">
          <button onClick={() => navigate("/challenge")}>🔁 Play Again</button>
          <button onClick={() => navigate("/")}>🏠 Home</button>
        </div>
      </div>
    </div>
  );
}

export default SummaryScreen;
