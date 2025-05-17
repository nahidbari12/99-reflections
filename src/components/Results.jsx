import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { socket } from "../socket";
import "../styles/Results.css";

function Results() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    score,
    correct = 0,
    wrong = 0,
    totalQuestions = correct + wrong,
    longestStreak = 0,
    wrongAnswers = [],
    username = "You",
    isMultiplayer = false,
    roomCode = null,
    opponentUsername,
    opponentScore,
    opponentStreak,
    opponentCorrect,
  } = location.state || {};

  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    setFadeIn(true);

    socket.on("restart-game", () => {
      navigate("/challenge", { state: { username, roomCode, isMultiplayer } });
    });

    return () => {
      socket.off("restart-game");
    };
  }, [navigate, username, roomCode, isMultiplayer]);

  const handlePlayAgain = () => {
    if (isMultiplayer && roomCode) {
      socket.emit("play-again", { roomCode });
    } else {
      navigate("/challenge");
    }
  };

  return (
    <div className={`results-page ${fadeIn ? "fade-in" : ""}`}>
      <h1>🎉 Challenge Complete!</h1>
      <p className="results-player">👤 {username}</p>

      {isMultiplayer && roomCode && (
        <p className="results-room">🏷️ Room Code: <strong>{roomCode}</strong></p>
      )}

      <p className="results-streak">🔥 Longest Streak: {longestStreak}</p>
      <p className="results-accuracy">✅ You got {correct} out of {totalQuestions} correct</p>
      <p className="results-score">🏆 Final Score: {score}</p>

      {isMultiplayer && opponentUsername && (
        <div className="head-to-head">
          <h3>⚔️ Match Summary</h3>
          <div className="head-to-head-row">
            <div className="player-box">
              <h4>{username}</h4>
              <p>Score: {score}</p>
              <p>Streak: {longestStreak}</p>
              <p>Correct: {correct}</p>
            </div>
            <div className="vs">VS</div>
            <div className="player-box">
              <h4>{opponentUsername}</h4>
              <p>Score: {opponentScore}</p>
              <p>Streak: {opponentStreak}</p>
              <p>Correct: {opponentCorrect}</p>
            </div>
          </div>
        </div>
      )}

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
        <button className="gold-button" onClick={handlePlayAgain}>
          🔁 Play Again
        </button>
      </div>

      <button className="back-home-button" onClick={() => navigate("/")}>
        ⬅ Back to Home
      </button>
    </div>
  );
}

export default Results;
