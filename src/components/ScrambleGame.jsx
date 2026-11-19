// /src/components/ScrambleGame.jsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import namesOfAllah from "../data/names"; // adjust path if needed
import "../styles/ScrambleGame.css";
import { recordGameAttempt, saveGameResult, shuffle } from "../utils/gameUtils";
import NextStepCard from "./NextStepCard";

const TOTAL_ROUNDS = 8;
const ROUND_TIME = 30;

// Helper to safely get the transliteration / English name
function getDisplayName(entry) {
  return (
    entry.transliteration ||
    entry.english ||
    entry.name ||
    entry.title ||
    ""
  ).trim();
}

// Helper to safely get a meaning/description
function getMeaning(entry) {
  return (
    entry.meaning ||
    entry.translation ||
    entry.description ||
    ""
  ).trim();
}

// Normalize strings for comparison (ignore spaces, punctuation, case)
export function normalize(str) {
  return str.toLowerCase().replace(/[^a-z]/g, "");
}

// Shuffle letters
export function shuffleLetters(word) {
  const letters = word
    .toUpperCase()
    .replace(/[^A-Z]/g, "") // letters only
    .split("");

  if (letters.length <= 1) return letters;

  let arr = [...letters];
  let attempts = 0;

  // Make sure not identical order as original
  while (attempts < 10) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    if (arr.join("") !== letters.join("")) break;
    attempts++;
  }

  return arr;
}

function ScrambleGame() {
  const navigate = useNavigate();

  const [currentRound, setCurrentRound] = useState(1);
  const [currentName, setCurrentName] = useState(null); // original object from namesOfAllah
  const [letters, setLetters] = useState([]); // scrambled letters array
  const [usedIndices, setUsedIndices] = useState([]); // which letter indices are chosen
  const [questionTimer, setQuestionTimer] = useState(ROUND_TIME);
  const [timerRunning, setTimerRunning] = useState(true);

  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  const [feedback, setFeedback] = useState(null); // { type: 'correct'|'wrong'|'time'|'skipped', message: string }
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);

  // For results screen: track each word result
  const [history, setHistory] = useState([]); // [{ round, word, userAnswer, status, meaning }]

  // Little "+10" score pop animation
  const [scorePop, setScorePop] = useState(null);
  const remainingNamesRef = useRef([]);
  const resultSavedRef = useRef(false);
  const timersRef = useRef(new Set());
  const initializedRef = useRef(false);
  const schedule = useCallback((callback, delay) => {
    const id = window.setTimeout(() => { timersRef.current.delete(id); callback(); }, delay);
    timersRef.current.add(id);
    return id;
  }, []);
  useEffect(() => () => {
    timersRef.current.forEach(window.clearTimeout);
    timersRef.current.clear();
  }, []);
  useEffect(() => {
    const pauseWhenHidden = () => { if (document.hidden && timerRunning && !gameOver) setPaused(true); };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => document.removeEventListener("visibilitychange", pauseWhenHidden);
  }, [timerRunning, gameOver]);

  // Pool of valid names (only entries with a transliteration/english name)
  const validNames = useMemo(
    () =>
      namesOfAllah.filter((n) => {
        const name = getDisplayName(n);
        return name && name.length > 2;
      }),
    []
  );

  // Build the current answer string from usedIndices
  const userAnswer = useMemo(() => {
    if (!letters || letters.length === 0) return "";
    return usedIndices.map((i) => letters[i]).join("");
  }, [letters, usedIndices]);

  // Progress bar percentage
  const progressPercent = useMemo(() => {
    if (gameOver) return 100;
    return ((currentRound - 1) / TOTAL_ROUNDS) * 100;
  }, [currentRound, gameOver]);

  // Pick a random name and set up a new round
  const setupRound = useCallback(() => {
    if (validNames.length === 0) return;

    if (!remainingNamesRef.current.length) remainingNamesRef.current = shuffle(validNames);
    const chosen = remainingNamesRef.current.pop();
    const displayName = getDisplayName(chosen);

    const scrambledLetters = shuffleLetters(displayName);

    setCurrentName(chosen);
    setLetters(scrambledLetters);
    setUsedIndices([]);
    setQuestionTimer(ROUND_TIME);
    setTimerRunning(true);
    setFeedback(null);
  }, [validNames]);

  // Handle timeout
  const handleTimeout = useCallback(() => {
    if (!currentName || gameOver) return;

    const correctWord = getDisplayName(currentName);

    setTimerRunning(false);
    setFeedback({
      type: "time",
      message: `Time's up! The correct spelling is ${correctWord}.`,
    });

    setWrongCount((prev) => prev + 1);
    recordGameAttempt(currentName, false, "scramble", ROUND_TIME);
    setHistory((prev) => [
      ...prev,
      {
        round: currentRound,
        word: correctWord,
        userAnswer: userAnswer || "(no answer)",
        status: "time",
        meaning: getMeaning(currentName),
        seconds: ROUND_TIME,
      },
    ]);

    schedule(() => {
      if (currentRound >= TOTAL_ROUNDS) {
        setGameOver(true);
        setTimerRunning(false);
      } else {
        setCurrentRound((prev) => prev + 1);
        setupRound();
      }
    }, 1800);
  }, [currentName, currentRound, gameOver, schedule, setupRound, userAnswer]);

  // Timer effect
  useEffect(() => {
    if (!timerRunning || gameOver || paused) return;
    if (questionTimer <= 0) {
      handleTimeout();
      return;
    }

    const timeout = setTimeout(
      () => setQuestionTimer((prev) => Math.max(0, prev - 1)),
      1000
    );
    return () => clearTimeout(timeout);
  }, [timerRunning, gameOver, paused, handleTimeout, questionTimer]);

  // Initialize first round
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    setupRound();
  }, [setupRound]);

  // Letter click
  const handleLetterClick = (index) => {
    if (!timerRunning || gameOver || paused) return;
    if (usedIndices.includes(index)) return;
    setUsedIndices((prev) => [...prev, index]);
  };

  // Clear answer
  const handleClear = () => {
    if (!timerRunning || gameOver || paused) return;
    setUsedIndices([]);
  };

  const handleUndo = () => {
    if (!timerRunning || gameOver || paused) return;
    setUsedIndices((prev) => prev.slice(0, -1));
  };

  // Skip round
  const handleSkip = () => {
    if (!currentName || gameOver || !timerRunning || paused) return;

    const correctWord = getDisplayName(currentName);

    setTimerRunning(false);

    setFeedback({
      type: "skipped",
      message: `Skipped! The correct spelling is ${correctWord}.`,
    });

    setWrongCount((prev) => prev + 1);
    recordGameAttempt(currentName, false, "scramble", Math.max(1, ROUND_TIME - questionTimer));

    setHistory((prev) => [
      ...prev,
      {
        round: currentRound,
        word: correctWord,
        userAnswer: "(skipped)",
        status: "skipped",
        meaning: getMeaning(currentName),
        seconds: Math.max(1, ROUND_TIME - questionTimer),
      },
    ]);

    schedule(() => {
      if (currentRound >= TOTAL_ROUNDS) {
        setGameOver(true);
        setTimerRunning(false);
      } else {
        setCurrentRound((prev) => prev + 1);
        setupRound();
      }
    }, 1500);
  };

  // Submit answer
  const handleSubmit = () => {
    if (!currentName || !letters || letters.length === 0) return;
    if (!userAnswer) return;
    if (!timerRunning || gameOver || paused) return;

    const correctWord = getDisplayName(currentName);
    const normUser = normalize(userAnswer);
    const normCorrect = normalize(correctWord);

    setTimerRunning(false);

    if (normUser === normCorrect) {
      recordGameAttempt(currentName, true, "scramble", Math.max(1, ROUND_TIME - questionTimer));
      setScore((prev) => prev + 10);
      setCorrectCount((prev) => prev + 1);
      setFeedback({
        type: "correct",
        message: "Correct! Well done.",
      });

      setHistory((prev) => [
        ...prev,
        {
          round: currentRound,
          word: correctWord,
          userAnswer,
          status: "correct",
          meaning: getMeaning(currentName),
          seconds: Math.max(1, ROUND_TIME - questionTimer),
        },
      ]);

      setScorePop("+10");
      schedule(() => setScorePop(null), 700);
    } else {
      recordGameAttempt(currentName, false, "scramble", Math.max(1, ROUND_TIME - questionTimer));
      setWrongCount((prev) => prev + 1);
      setFeedback({
        type: "wrong",
        message: `Nice try! The correct spelling is ${correctWord}.`,
      });

      setHistory((prev) => [
        ...prev,
        {
          round: currentRound,
          word: correctWord,
          userAnswer,
          status: "wrong",
          meaning: getMeaning(currentName),
          seconds: Math.max(1, ROUND_TIME - questionTimer),
        },
      ]);
    }

    schedule(() => {
      if (currentRound >= TOTAL_ROUNDS) {
        setGameOver(true);
        setTimerRunning(false);
      } else {
        setCurrentRound((prev) => prev + 1);
        setupRound();
      }
    }, 1800);
  };

  // Quit back to Gamer Mode
  const handleQuit = () => {
    navigate("/gamer-mode");
  };

  // Restart game
  const handlePlayAgain = () => {
    remainingNamesRef.current = shuffle(validNames);
    resultSavedRef.current = false;
    setCurrentRound(1);
    setScore(0);
    setCorrectCount(0);
    setWrongCount(0);
    setHistory([]);
    setGameOver(false);
    setQuestionTimer(ROUND_TIME);
    setTimerRunning(true);
    setFeedback(null);
    setScorePop(null);
    setPaused(false);
    setupRound();
  };

  useEffect(() => {
    if (!gameOver || resultSavedRef.current) return;
    resultSavedRef.current = true;
    saveGameResult("scramble", { outcome: "complete", score });
  }, [gameOver, score]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (!timerRunning || gameOver || feedback || paused) return;
      if (event.key === "Backspace") { event.preventDefault(); handleUndo(); return; }
      if (event.key === "Enter") { handleSubmit(); return; }
      const letter = event.key.toUpperCase();
      if (!/^[A-Z]$/.test(letter)) return;
      const index = letters.findIndex((value, i) => value === letter && !usedIndices.includes(i));
      if (index >= 0) handleLetterClick(index);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  if (!currentName) {
    return (
      <div className="scramble-page">
        <div className="scramble-card">
          <p className="scramble-loading">Loading Scramble Challenge...</p>
        </div>
      </div>
    );
  }

  const meaning = getMeaning(currentName);
  const topRound = history.filter((item) => item.status === "correct").sort((a, b) => a.seconds - b.seconds)[0] || null;

  return (
    <div className="scramble-page">
      <div className="scramble-card">
        {/* Score pop */}
        {scorePop && <div className="score-pop">{scorePop}</div>}

        {/* Header */}
        <div className="scramble-header">
          <div className="scramble-arabic-title">أسماء الحسنى</div>
          <div className="scramble-main-title">Scramble Challenge</div>
          <p className="scramble-subtitle">
            Unscramble the Name of Allah from the letters below.
          </p>
        </div>

        {/* Progress bar */}
        <div className="scramble-progress-wrapper">
          <div className="scramble-progress-track">
            <div
              className="scramble-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="scramble-progress-label">
            Round {currentRound} of {TOTAL_ROUNDS}
          </div>
        </div>

        {/* Stats */}
        <div className="scramble-stats-row">
          <div className="scramble-pill">
            Score <span>{score}</span>
          </div>
          <div
            className={`scramble-timer-pill ${
              questionTimer <= 10 && !gameOver ? "low-time" : ""
            }`}
          >
            Time <span>{questionTimer}s</span>
          </div>
          <button type="button" className="scramble-pause-button" onClick={() => setPaused((value) => !value)}>{paused ? "Resume" : "Pause"}</button>
        </div>

        {/* Meaning hint */}
        {meaning && (
          <div className="scramble-meaning">
            <span className="scramble-meaning-label">Meaning hint:</span>{" "}
            {meaning}
          </div>
        )}

        {/* Letters */}
        <div className="scramble-letters-grid" key={currentRound}>
          {letters.map((letter, index) => (
            <button
              key={index}
              type="button"
              className={`scramble-letter-tile ${
                usedIndices.includes(index) ? "used" : ""
              }`}
              onClick={() => handleLetterClick(index)}
              disabled={usedIndices.includes(index) || !timerRunning || gameOver || paused}
              aria-pressed={usedIndices.includes(index)}
            >
              {letter}
            </button>
          ))}
        </div>

        {/* Answer */}
        <div className="scramble-answer-section">
          <div className="scramble-answer-label">Your answer:</div>
          <div className="scramble-answer-box">
            {userAnswer || <span className="placeholder">Tap the letters</span>}
          </div>
        </div>

        {/* Buttons row with Skip */}
        <div className="scramble-actions">
          <button
            type="button"
            className="scramble-secondary-button"
            onClick={handleUndo}
          >
            Undo
          </button>

          <button
            type="button"
            className="scramble-secondary-button"
            onClick={handleSkip}
          >
            Skip
          </button>

          <button
            type="button"
            className="scramble-primary-button"
            onClick={handleSubmit}
            disabled={!userAnswer || !timerRunning || gameOver || paused}
          >
            Submit
          </button>
        </div>

        {/* Feedback */}
        {feedback && (
          <div className={`scramble-feedback scramble-${feedback.type}`}>
            {feedback.message}
          </div>
        )}

        {/* Quit */}
        <button
          type="button"
          className="scramble-quit-button"
          onClick={handleQuit}
        >
          Quit &amp; Exit
        </button>
        {paused && !gameOver && <div className="scramble-pause-overlay" role="dialog" aria-modal="true"><strong>Game paused</strong><span>The countdown is stopped.</span><button type="button" className="scramble-primary-button" onClick={() => setPaused(false)}>Resume</button></div>}
      </div>

      {/* Results overlay */}
      {gameOver && (
        <div className="scramble-results-overlay">
          <div className="scramble-results-card">
            <div className="results-celebration">🌙✨ Great Session!</div>

            <h2 className="results-title">Scramble Results</h2>
            <p className="results-summary">
              You scored <span>{score}</span> points with{" "}
              <span>{correctCount}</span> correct and{" "}
              <span>{wrongCount}</span> incorrect / skipped.
            </p>

            {topRound && (
              <div className="results-highlight">
                <div className="results-highlight-title">
                  Your highlight round
                </div>
                <div className="results-highlight-body">
                  <span className="results-highlight-word">
                    {topRound.word}
                  </span>
                  {topRound.meaning && (
                    <span className="results-highlight-meaning">
                      – {topRound.meaning}
                    </span>
                  )}
                  <span className="results-highlight-meaning">
                    · solved in {topRound.seconds}s
                  </span>
                </div>
              </div>
            )}

            {history.length > 0 && (
              <div className="results-list">
                {history.map((item, idx) => (
                  <div
                    key={idx}
                    className={`results-item results-${item.status}`}
                  >
                    <div className="results-word-row">
                      <span className="results-round">
                        Round {item.round}:
                      </span>
                      <span className="results-word">{item.word}</span>
                      <span className="results-status">
                        {item.status === "correct"
                          ? "Correct"
                          : item.status === "time"
                          ? "Time"
                          : item.status === "skipped"
                          ? "Skipped"
                          : "Wrong"}
                      </span>
                    </div>
                    {item.userAnswer && (
                      <div className="results-user-answer">
                        Your answer: {item.userAnswer}
                      </div>
                    )}
                    {item.meaning && (
                      <div className="results-meaning">
                        Meaning: {item.meaning}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Buttons moved slightly down */}
            <div className="results-actions">
              <button
                type="button"
                className="scramble-primary-button"
                onClick={handlePlayAgain}
              >
                Play Again
              </button>
              <button
                type="button"
                className="scramble-secondary-button"
                onClick={handleQuit}
              >
                Back to Gamer Mode
              </button>
            </div>
            <NextStepCard context="scramble" hasMistakes={wrongCount > 0} />
          </div>
        </div>
      )}
    </div>
  );
}

export default ScrambleGame;
