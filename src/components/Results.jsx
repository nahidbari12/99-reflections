// /src/components/Results.jsx

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { socket } from "../socket";
import { trackEvent } from "../utils/analytics";
import NextStepCard from "./NextStepCard";
import "../styles/Results.css";

function Results() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    score = 0,
    correct = 0,
    wrong = 0,
    totalQuestions = correct + wrong,
    longestStreak = 0,
    wrongAnswers = [],
    username = "You",
    isMultiplayer = false,
    roomCode = null,
    difficulty = "easy",
    dailyKey = null,
    opponentUsername,
    opponentScore,
    opponentStreak,
    opponentCorrect,
    winner,
  } = location.state || {};

  const [fadeIn, setFadeIn] = useState(false);
  const [displayedScore, setDisplayedScore] = useState(0);
  const [bestScore, setBestScore] = useState(null);
  const [shareStatus, setShareStatus] = useState("");

  const accuracy =
    totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;

  let performanceTitle = "📚 Every Try Counts";
  if (accuracy >= 90) performanceTitle = "🌙 Stellar Session";
  else if (accuracy >= 70) performanceTitle = "✨ Great Run";
  else if (accuracy >= 40) performanceTitle = "🌱 Keep Growing";

  useEffect(() => {
    setFadeIn(true);

    socket.on("restart-game", () => {
      navigate("/challenge", { state: { username, roomCode, isMultiplayer, difficulty } });
    });

    return () => {
      socket.off("restart-game");
    };
  }, [navigate, username, roomCode, isMultiplayer, difficulty]);

  // Score count-up animation
  useEffect(() => {
    if (score <= 0) {
      setDisplayedScore(score);
      return;
    }

    let current = 0;
    const duration = 600; // ms
    const stepTime = 30;
    const steps = Math.ceil(duration / stepTime);
    const increment = score / steps;

    const interval = setInterval(() => {
      current += increment;
      if (current >= score) {
        current = score;
        clearInterval(interval);
      }
      setDisplayedScore(Math.round(current));
    }, stepTime);

    return () => clearInterval(interval);
  }, [score]);

  // Best score caching in localStorage
  useEffect(() => {
    if (typeof window === "undefined") {
      setBestScore(score);
      return;
    }

    try {
      const storageKey = dailyKey ? "dailyChallengeBestScore" : `challengeBestScore:${difficulty}`;
      const stored = window.localStorage.getItem(storageKey);
      const storedNum = stored ? parseInt(stored, 10) : 0;

      if (score > storedNum) {
        window.localStorage.setItem(storageKey, String(score));
        setBestScore(score);
      } else {
        setBestScore(storedNum || score || 0);
      }
    } catch (e) {
      // If localStorage is blocked/unavailable, just fall back to current score
      setBestScore(score);
    }
  }, [score, difficulty, dailyKey]);

  const handlePlayAgain = () => {
    if (isMultiplayer && roomCode) {
      socket.emit("play-again", { roomCode });
    } else if (dailyKey) {
      navigate("/daily-challenge");
    } else {
      navigate("/challenge", { state: { difficulty } });
    }
  };

  const shareDailyChallenge = async () => {
    const text = `99 Reflections Daily Challenge 🌙\n${correct}/${totalQuestions} correct · ${score} points · ${longestStreak} streak\nCan you beat my score? https://99namesofallah.org/daily-challenge`;
    try {
      if (navigator.share) await navigator.share({ title: "99 Reflections Daily Challenge", text });
      else if (navigator.clipboard) { await navigator.clipboard.writeText(text); setShareStatus("Result copied!"); }
      else setShareStatus("Copy your score and invite a friend to play.");
      trackEvent("share", { method: navigator.share ? "native" : "clipboard", content_type: "daily_challenge" });
    } catch { setShareStatus("Sharing was cancelled."); }
  };

  const retryMistakes = () => {
    const reviewNames = [...new Set(wrongAnswers.map((item) => item.name).filter(Boolean))];
    navigate("/challenge", { state: { difficulty, reviewNames } });
  };

  return (
    <div className={`results-page ${fadeIn ? "fade-in" : ""}`}>
      <div className="results-card">
        <h1 className="results-title">{dailyKey ? "🌙 Daily Challenge Complete!" : "🎉 Challenge Complete!"}</h1>
        <p className="results-player">👤 {username}</p>

        <p className="results-performance">{performanceTitle}</p>
        <p className={`results-difficulty ${difficulty}`}>{difficulty} challenge</p>

        {winner && (
          <p className="results-winner">
            🏁 Winner: <span>{winner}</span>
          </p>
        )}

        {isMultiplayer && roomCode && (
          <p className="results-room">
            🏷️ Room Code: <strong>{roomCode}</strong>
          </p>
        )}

        {/* Stat pills */}
        <div className="results-stats-grid">
          <div className="stat-pill">
            <span className="stat-label">Score</span>
            <span className="stat-value">{displayedScore}</span>
          </div>
          {bestScore !== null && (
            <div className="stat-pill">
              <span className="stat-label">Best Score</span>
              <span className="stat-value">{bestScore}</span>
            </div>
          )}
          <div className="stat-pill">
            <span className="stat-label">Accuracy</span>
            <span className="stat-value">{accuracy}%</span>
          </div>
          <div className="stat-pill">
            <span className="stat-label">Correct</span>
            <span className="stat-value">
              {correct}/{totalQuestions}
            </span>
          </div>
          <div className="stat-pill">
            <span className="stat-label">Longest Streak</span>
            <span className="stat-value">{longestStreak}</span>
          </div>
        </div>

        {/* Multiplayer comparison */}
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

        {/* Wrong answer review */}
        {wrongAnswers.length > 0 && (
          <div className="review-section">
            <h3>❌ Review Incorrect Answers</h3>
            <ul>
              {wrongAnswers.map((item, idx) => (
                <li key={idx}>
                  <strong>{item.prompt || item.name}</strong>
                  <span>Your answer: {item.selected || (item.timedOut ? "No answer" : "Not recorded")}</span>
                  <span>Correct: {item.correct}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="results-buttons">
          <button className="gold-button" onClick={handlePlayAgain}>
            🔁 {dailyKey ? "Replay today’s challenge" : `Play ${difficulty} again`}
          </button>
          {wrongAnswers.length > 0 && <button className="review-button" onClick={retryMistakes}>Practice mistakes</button>}
        </div>

        {dailyKey && <><button className="share-challenge-button" onClick={shareDailyChallenge}>Share today’s score</button>{shareStatus && <p className="share-status" role="status">{shareStatus}</p>}</>}

        {wrongAnswers.length > 0 && <button className="learn-link-button" onClick={() => navigate("/smart-learn")}>Strengthen these Names in Learn Mode →</button>}
        <NextStepCard context={dailyKey ? "daily_challenge" : "challenge"} hasMistakes={wrongAnswers.length > 0} />

        <button className="back-home-button" onClick={() => navigate(dailyKey ? "/" : "/learning-mode")}>
          {dailyKey ? "Back to Home" : "Back to Learn"}
        </button>
      </div>
    </div>
  );
}

export default Results;
