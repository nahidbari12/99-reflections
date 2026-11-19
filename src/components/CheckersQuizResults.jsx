// /src/components/CheckersQuizResults.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/CheckersQuizResults.css"; // ✅ use dedicated results styling
import NextStepCard from "./NextStepCard";

const CheckersQuizResults = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    correct = 0,
    wrong = 0,
    total = 5,
    wrongAnswers = [], // ✅ list of missed questions
  } = location.state || {};
  const passed = correct >= 3;

  const [countdown, setCountdown] = useState(10);

  // Redirect if page is opened manually (no state)
  useEffect(() => {
    if (!location.state) {
      navigate("/gamer-mode", { replace: true });
    }
  }, [location.state, navigate]);

  // Countdown + auto start Checkers if passed
  useEffect(() => {
    if (!passed) return;

    const id = setInterval(() => {
      setCountdown((t) => {
        if (t <= 1) {
          clearInterval(id);
          navigate("/gamer-mode/checkers");
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [passed, navigate]);

  return (
    <div className="checkers-quiz-results">
      <div className="cqr-card">
        <header className="cqr-header">
          <div className="cqr-tag">Gamer Mode · Checkers</div>
          <h2>Quiz Results</h2>
          <p className="cqr-subtitle">
            Before you step onto the board, here’s how you did on the warm-up.
          </p>
        </header>

        <section className="cqr-summary">
          <div className="cqr-score">
            <span className="cqr-score-label">Score</span>
            <span className="cqr-score-main">
              {correct} / {total}
            </span>
            <span className={`cqr-status-pill ${passed ? "pass" : "fail"}`}>
              {passed ? "Unlocked Checkers" : "Try Again to Unlock"}
            </span>
          </div>

          <div className="cqr-breakdown">
            <div>
              <span className="cqr-break-label">Correct</span>
              <span className="cqr-break-value">{correct}</span>
            </div>
            <div>
              <span className="cqr-break-label">Wrong</span>
              <span className="cqr-break-value">{wrong}</span>
            </div>
          </div>

          {passed ? (
            <>
              <p className="cqr-message cqr-message-pass">
                ✅ Great job! You’ve unlocked the Checkers board.
              </p>
              <div className="cqr-countdown">
                Starting in <span>{countdown}</span> seconds…
              </div>
              <div className="cqr-actions">
                <button
                  className="cqr-btn primary"
                  onClick={() => navigate("/gamer-mode/checkers")}
                >
                  Start Checkers Now
                </button>
                <button
                  className="cqr-btn ghost"
                  onClick={() => navigate("/gamer-mode")}
                >
                  Back to Gamer Mode
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="cqr-message cqr-message-fail">
                ❌ You need at least <strong>3 correct answers</strong> to start Checkers.
              </p>
              <div className="cqr-actions">
                <button
                  className="cqr-btn primary"
                  onClick={() =>
                    navigate("/gamer-mode/checkers-quiz", { replace: true })
                  }
                >
                  Try Quiz Again
                </button>
                <button
                  className="cqr-btn ghost"
                  onClick={() => navigate("/gamer-mode")}
                >
                  Back to Gamer Mode
                </button>
              </div>
            </>
          )}
        </section>

        {wrongAnswers.length > 0 && (
          <section className="cqr-review">
            <h3>Review missed questions</h3>
            <p className="cqr-review-sub">
              Take a quick look at what you missed to boost your next streak.
            </p>
            <ul className="cqr-review-list">
              {wrongAnswers.map((item, index) => (
                <li key={index} className="cqr-review-item">
                  <div className="cqr-q-row">
                    <span className="cqr-pill">Q{index + 1}</span>
                    <span className="cqr-q-text">{item.question}</span>
                  </div>
                  <div className="cqr-a-row">
                    <span className="cqr-a-label">Your answer:</span>
                    <span className="cqr-a-value">
                      {item.timedOut
                        ? "No answer (time ran out)"
                        : item.selectedAnswer || "No answer"}
                    </span>
                  </div>
                  <div className="cqr-a-row">
                    <span className="cqr-a-label">Correct answer:</span>
                    <span className="cqr-a-value correct">
                      {item.correctAnswer}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
        <NextStepCard context="checkers_quiz" hasMistakes={wrongAnswers.length > 0} />
      </div>
    </div>
  );
};

export default CheckersQuizResults;
