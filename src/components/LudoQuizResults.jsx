// /src/components/LudoQuizResults.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/GameQuizGate.css"; // reuse same styling

const LudoQuizResults = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    correct = 0,
    wrong = 0,
    total = 5,
    wrongAnswers = [],
  } = location.state || {};
  const passed = correct >= 3;

  const [countdown, setCountdown] = useState(10);

  // Redirect if page is opened manually (no state)
  useEffect(() => {
    if (!location.state) {
      navigate("/gamer-mode", { replace: true });
    }
  }, [location.state, navigate]);

  // Countdown + auto start Ludo if passed
  useEffect(() => {
    if (!passed) return;

    const id = setInterval(() => {
      setCountdown((t) => {
        if (t <= 1) {
          clearInterval(id);
          navigate("/gamer-mode/ludo");
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [passed, navigate]);

  return (
    <div className="game-quiz-gate">
      <h2>Ludo Quiz Results</h2>
      <p>
        You answered <strong>{correct}</strong> out of <strong>{total}</strong>{" "}
        correctly.
      </p>

      {passed ? (
        <>
          <p>✅ Great job! You’ve unlocked Ludo.</p>
          <div className="countdown">Starting in {countdown} seconds…</div>
          <div className="button-container" style={{ marginTop: 30 }}>
            <button onClick={() => navigate("/gamer-mode/ludo")}>
              Start Now
            </button>
            <button onClick={() => navigate("/gamer-mode")}>
              Back to Gamer Mode
            </button>
          </div>
        </>
      ) : (
        <>
          <p>❌ You need at least 3 correct answers to start Ludo.</p>
          <div className="button-container" style={{ marginTop: 30 }}>
            <button
              onClick={() =>
                navigate("/gamer-mode/ludo-quiz", { replace: true })
              }
            >
              Try Again
            </button>
            <button onClick={() => navigate("/gamer-mode")}>
              Back to Gamer Mode
            </button>
          </div>
        </>
      )}

      {/* Review section for missed questions */}
      {wrongAnswers.length > 0 && (
        <div className="quiz-log" style={{ marginTop: 30 }}>
          <p>
            <strong>Review the questions you missed:</strong>
          </p>
          <ul style={{ textAlign: "left", marginTop: 10 }}>
            {wrongAnswers.map((item, index) => (
              <li key={index} style={{ marginBottom: 10, lineHeight: 1.5 }}>
                <div>
                  <strong>Q:</strong> {item.question}
                </div>
                <div>
                  <strong>Your answer:</strong>{" "}
                  {item.timedOut
                    ? "No answer (time ran out)"
                    : item.selectedAnswer || "No answer"}
                </div>
                <div>
                  <strong>Correct answer:</strong> {item.correctAnswer}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LudoQuizResults;