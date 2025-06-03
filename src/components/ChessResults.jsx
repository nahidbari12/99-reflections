import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/TicTacToeGame.css"; // Reuse flashcard styles

function ChessResults() {
  const navigate = useNavigate();
  const { state } = useLocation();

  if (!state) {
    return (
      <div className="chess-container">
        <div className="chess-header">
          <div className="arabic-calligraphy">أسماء الحسنى</div>
          <div className="game-title">Asma’ul Husna</div>
        </div>
        <p style={{ color: "white" }}>
          No result data found. Please return and try again.
        </p>
        <button
          className="quit-button"
          onClick={() => navigate("/gamer-mode")}
        >
          ⏪ Back to Gamer Mode
        </button>
      </div>
    );
  }

  const {
    winner,
    streak = 0,
    totalQuestions = 0,
    wrongAnswers = [],
  } = state;

  const correctAnswers = totalQuestions - wrongAnswers.length;
  const streakHearts = Array(3)
    .fill("🖤")
    .map((h, i) => (i < streak ? "💛" : "🖤"))
    .join(" ");

  return (
    <div className="chess-container">
      <div className="chess-header">
        <div className="arabic-calligraphy">أسماء الحسنى</div>
        <div className="game-title">Asma’ul Husna</div>
      </div>

      <div className="challenge-flashcard fade-in">
        <h2>
          {winner === "Draw"
            ? "🤝 Draw"
            : winner === "You"
            ? "🏆 You Win!"
            : "💀 You Lost!"}
        </h2>
        <div className="results-box">
          <p>
            <strong>Streak:</strong> {streakHearts}
          </p>
          <p>
            <strong>Total Questions:</strong> {totalQuestions}
          </p>
          <p>
            <strong>Correct Answers:</strong> ✅ {correctAnswers}
          </p>
          <p>
            <strong>Incorrect Answers:</strong> ❌ {wrongAnswers.length}
          </p>

          {wrongAnswers.length > 0 && (
            <div>
              <p>
                <strong>Incorrect:</strong>
              </p>
              <ul>
                {wrongAnswers.map((q, i) => (
                  <li key={i}>
                    {q.prompt} — Correct: {q.correct}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button className="quit-button" onClick={() => navigate("/gamer-mode")}>
          ⏪ Back to Gamer Mode
        </button>
      </div>
    </div>
  );
}

export default ChessResults;
