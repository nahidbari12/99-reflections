// /src/components/ChessResults.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/ChessBoardWrapper.css"; // already exists (chess container/header styles)
import NextStepCard from "./NextStepCard";

function ChessResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state;

  // If page is opened directly without state
  if (!state) {
    return (
      <div className="chess-container">
        <div className="chess-header">
          <div className="arabic-calligraphy">أسماء الحسنى</div>
          <div className="game-title">Asma’ul Husna · Chess</div>
        </div>

        <div
          style={{
            maxWidth: "720px",
            margin: "0 auto",
            padding: "1.5rem 1.25rem",
            borderRadius: "1.25rem",
            background:
              "radial-gradient(circle at top right, rgba(15,23,42,0.96), #020617)",
            border: "1px solid rgba(148,163,184,0.5)",
            boxShadow:
              "0 24px 45px rgba(15,23,42,0.95), 0 0 0 1px rgba(15,23,42,1)",
            color: "#e5e7eb",
            textAlign: "center",
          }}
        >
          <p style={{ marginBottom: "1rem" }}>
            No result data found. Please return and try again.
          </p>
          <button
            className="quit-button"
            onClick={() => navigate("/gamer-mode")}
          >
            ⏪ Back to Gamer Mode
          </button>
        </div>
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

  // 9-heart streak to match in-game UI
  const streakHearts = Array(9)
    .fill("🖤")
    .map((h, i) => (i < streak ? "💛" : "🖤"))
    .join(" ");

  const getHeadline = () => {
    if (winner === "Draw") return "🤝 It’s a Draw";
    if (winner === "You") return "🏆 Victory!";
    return "💀 Checkmated";
  };

  const getSubtext = () => {
    if (winner === "Draw") {
      return "A balanced game – every move and every answer counted.";
    }
    if (winner === "You") {
      return "Your strategy and Asma’ul Husna knowledge paid off.";
    }
    return "Don’t worry – review the missed Names and come back stronger.";
  };

  return (
    <div className="chess-container">
      <div className="chess-header">
        <div className="arabic-calligraphy">أسماء الحسنى</div>
        <div className="game-title">Asma’ul Husna · Chess</div>
      </div>

      {/* Card body */}
      <div
        className="fade-in"
        style={{
          width: "100%",
          maxWidth: "780px",
          margin: "0 auto",
          padding: "1.75rem 1.5rem 1.9rem",
          borderRadius: "1.5rem",
          background:
            "radial-gradient(circle at top right, rgba(15,23,42,0.96), #020617)",
          border: "1px solid rgba(148,163,184,0.5)",
          boxShadow:
            "0 24px 48px rgba(15,23,42,0.95), 0 0 0 1px rgba(15,23,42,1)",
          boxSizing: "border-box",
          color: "#e5e7eb",
        }}
      >
        {/* Outcome */}
        <div style={{ textAlign: "center", marginBottom: "1.4rem" }}>
          <h2
            style={{
              fontSize: "1.6rem",
              marginBottom: "0.35rem",
              color: "#facc15",
            }}
          >
            {getHeadline()}
          </h2>
          <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
            {getSubtext()}
          </p>
        </div>

        {/* Stats grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "0.9rem",
            marginBottom: "1.4rem",
          }}
        >
          {/* Streak */}
          <div
            style={{
              padding: "0.7rem 0.75rem",
              borderRadius: "0.9rem",
              background: "rgba(15,23,42,0.9)",
              border: "1px solid rgba(31,41,55,0.9)",
              boxShadow: "0 12px 24px rgba(15,23,42,0.7)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "0.78rem",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "#9ca3af",
                marginBottom: "0.25rem",
              }}
            >
              Streak
            </div>
            <div style={{ fontSize: "0.95rem" }}>{streakHearts}</div>
          </div>

          {/* Total questions */}
          <div
            style={{
              padding: "0.7rem 0.75rem",
              borderRadius: "0.9rem",
              background: "rgba(15,23,42,0.9)",
              border: "1px solid rgba(31,41,55,0.9)",
              boxShadow: "0 12px 24px rgba(15,23,42,0.7)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "0.78rem",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "#9ca3af",
                marginBottom: "0.25rem",
              }}
            >
              Questions
            </div>
            <div
              style={{
                fontSize: "1.35rem",
                fontWeight: 600,
              }}
            >
              {totalQuestions}
            </div>
          </div>

          {/* Correct */}
          <div
            style={{
              padding: "0.7rem 0.75rem",
              borderRadius: "0.9rem",
              background: "rgba(15,23,42,0.9)",
              border: "1px solid rgba(31,41,55,0.9)",
              boxShadow: "0 12px 24px rgba(15,23,42,0.7)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "0.78rem",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "#9ca3af",
                marginBottom: "0.25rem",
              }}
            >
              Correct
            </div>
            <div
              style={{
                fontSize: "1.35rem",
                fontWeight: 600,
                color: "#4ade80",
              }}
            >
              {correctAnswers}
            </div>
          </div>

          {/* Incorrect */}
          <div
            style={{
              padding: "0.7rem 0.75rem",
              borderRadius: "0.9rem",
              background: "rgba(15,23,42,0.9)",
              border: "1px solid rgba(31,41,55,0.9)",
              boxShadow: "0 12px 24px rgba(15,23,42,0.7)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "0.78rem",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "#9ca3af",
                marginBottom: "0.25rem",
              }}
            >
              Incorrect
            </div>
            <div
              style={{
                fontSize: "1.35rem",
                fontWeight: 600,
                color: "#f97373",
              }}
            >
              {wrongAnswers.length}
            </div>
          </div>
        </div>

        {/* Review missed questions */}
        {wrongAnswers.length > 0 && (
          <div
            style={{
              marginBottom: "1.4rem",
              padding: "0.85rem 0.9rem",
              borderRadius: "1rem",
              background: "rgba(15,23,42,0.95)",
              border: "1px solid rgba(55,65,81,0.85)",
              maxHeight: "180px",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.6rem",
              }}
            >
              <span
                style={{
                  fontSize: "0.82rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  color: "#9ca3af",
                }}
              >
                Review missed Names
              </span>
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "#e5e7eb",
                }}
              >
                {wrongAnswers.length} to revisit
              </span>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {wrongAnswers.map((q, i) => (
                <li
                  key={i}
                  style={{
                    paddingTop: i === 0 ? 0 : "0.55rem",
                    marginTop: i === 0 ? 0 : "0.55rem",
                    borderTop:
                      i === 0
                        ? "none"
                        : "1px dashed rgba(55,65,81,0.7)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.9rem",
                      color: "#e5e7eb",
                    }}
                  >
                    {q.prompt}
                  </div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#9ca3af",
                    }}
                  >
                    Correct meaning:{" "}
                    <span style={{ color: "#facc15" }}>{q.correct}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            justifyContent: "center",
          }}
        >
          <button
            style={{
              padding: "0.7rem 1.4rem",
              borderRadius: "999px",
              border: "1px solid rgba(250,204,21,0.85)",
              background:
                "radial-gradient(circle at top, rgba(250,204,21,0.25), #111827)",
              color: "#fefce8",
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
            onClick={() => navigate("/gamer-mode/chess-difficulty")}
          >
            ♟ Play Chess Again
          </button>
          <button
            className="quit-button"
            onClick={() => navigate("/gamer-mode")}
          >
            ⏪ Back to Gamer Mode
          </button>
        </div>
        <NextStepCard context="chess" hasMistakes={wrongAnswers.length > 0} />
      </div>
    </div>
  );
}

export default ChessResults;
