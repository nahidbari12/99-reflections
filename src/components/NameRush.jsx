// /src/components/NameRush.jsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import namesOfAllah from "../data/names";
import "../styles/NameRush.css";
import { localDateKey } from "../utils/learningProfile";
import { recordGameAttempt, saveGameResult } from "../utils/gameUtils";
import NextStepCard from "./NextStepCard";

const GAME_DURATION = 60; // seconds
const LIVES_START = 3;

// Helpers to read your data safely
function getDisplayName(entry) {
  return (
    entry.transliteration ||
    entry.english ||
    entry.name ||
    entry.title ||
    ""
  ).trim();
}

function getArabic(entry) {
  return (entry.arabic || entry.arabicName || "").trim();
}

function getMeaning(entry) {
  return (
    entry.meaning ||
    entry.translation ||
    entry.description ||
    ""
  ).trim();
}

function NameRush() {
  const navigate = useNavigate();

  // Core game state
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [lives, setLives] = useState(LIVES_START);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [currentName, setCurrentName] = useState(null);
  const [shownMeaning, setShownMeaning] = useState("");
  const [isPairCorrect, setIsPairCorrect] = useState(true);

  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong' | null
  const [answerLocked, setAnswerLocked] = useState(false);
  const lastNameRef = useRef(null);
  const transientTimersRef = useRef(new Set());
  const schedule = useCallback((callback, delay) => {
    const id = window.setTimeout(() => { transientTimersRef.current.delete(id); callback(); }, delay);
    transientTimersRef.current.add(id);
    return id;
  }, []);
  useEffect(() => () => {
    transientTimersRef.current.forEach(window.clearTimeout);
    transientTimersRef.current.clear();
  }, []);

  // Phase: intro → countdown → playing → gameover
  const [phase, setPhase] = useState("intro");
  const [countdown, setCountdown] = useState(3);

  // UX extras
  const [streakMessage, setStreakMessage] = useState(null);
  const [heartShake, setHeartShake] = useState(false);

  // High score tracking
  const [highScore, setHighScore] = useState(0);
  const [todayBest, setTodayBest] = useState(0);
  const [todayKey, setTodayKey] = useState("");

  useEffect(() => {
    const pauseWhenHidden = () => {
      if (document.hidden) setPhase((current) => current === "playing" ? "paused" : current);
    };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => document.removeEventListener("visibilitychange", pauseWhenHidden);
  }, []);

  // Filter valid entries once
  const validNames = useMemo(
    () =>
      namesOfAllah.filter((n) => {
        const name = getDisplayName(n);
        const meaning = getMeaning(n);
        return name && meaning;
      }),
    []
  );

  // Generate a new pair: sometimes correct, sometimes wrong
  const generatePair = useCallback(() => {
    if (!validNames.length) return;

    // pick a random base name
    const choices = validNames.filter((item) => item !== lastNameRef.current);
    const base = choices[Math.floor(Math.random() * choices.length)] || validNames[0];
    lastNameRef.current = base;

    const correctMeaning = getMeaning(base);

    // flip a coin for correctness
    const shouldBeCorrect = Math.random() < 0.5;

    if (shouldBeCorrect) {
      setCurrentName(base);
      setShownMeaning(correctMeaning);
      setIsPairCorrect(true);
      return;
    }

    // pick an incorrect meaning from another name
    let other = base;
    let guard = 0;
    while (guard < 50 && (other === base || getMeaning(other) === correctMeaning)) {
      const idx = Math.floor(Math.random() * validNames.length);
      other = validNames[idx];
      guard++;
    }

    const wrongMeaning = getMeaning(other);
    if (!wrongMeaning || wrongMeaning === correctMeaning) return generatePair();

    setCurrentName(base);
    setShownMeaning(wrongMeaning);
    setIsPairCorrect(false);
  }, [validNames]);

  // Start first question (used for when phase becomes playing too)
  useEffect(() => {
    generatePair();
  }, [generatePair]);

  // Load high score + today's best from localStorage
  useEffect(() => {
    try {
      const key = localDateKey();
      setTodayKey(key);

      const hsRaw = localStorage.getItem("nameRushHighScore");
      const hs = hsRaw ? parseInt(hsRaw, 10) : 0;
      if (!isNaN(hs)) setHighScore(hs);

      const dailyRaw = localStorage.getItem("nameRushDailyBest_" + key);
      const daily = dailyRaw ? parseInt(dailyRaw, 10) : 0;
      if (!isNaN(daily)) setTodayBest(daily);
    } catch {
      // ignore storage errors silently
    }
  }, []);

  // Countdown effect (3–2–1)
  useEffect(() => {
    if (phase !== "countdown") return;

    if (countdown <= 0) {
      setPhase("playing");
      setTimeLeft(GAME_DURATION);
      setStreak(0);
      setFeedback(null);
      generatePair();
      return;
    }

    const id = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(id);
  }, [phase, countdown, generatePair]);

  // Global game timer (only when playing)
  useEffect(() => {
    if (phase !== "playing") return;

    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "playing") return;
    const id = window.setInterval(() => setElapsedSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  // When timer hits 0, end game
  useEffect(() => {
    if (phase === "playing" && timeLeft === 0) {
      setPhase("gameover");
    }
  }, [phase, timeLeft]);

  // When lives run out, end the game
  useEffect(() => {
    if (phase === "playing" && lives <= 0) {
      setPhase("gameover");
    }
  }, [phase, lives]);

  // When game ends, update high score + today's best
  useEffect(() => {
    if (phase !== "gameover" || !todayKey) return;

    try {
      setHighScore((prev) => {
        const newHigh = score > prev ? score : prev;
        localStorage.setItem("nameRushHighScore", String(newHigh));
        return newHigh;
      });

      setTodayBest((prev) => {
        const newBest = score > prev ? score : prev;
        localStorage.setItem("nameRushDailyBest_" + todayKey, String(newBest));
        return newBest;
      });
      saveGameResult("name-rush", { outcome: "complete", score });
    } catch {
      // ignore storage errors
    }
  }, [phase, score, todayKey]);

  const handleAnswer = (userSaysCorrect) => {
    if (phase !== "playing" || !currentName || answerLocked) return;

    setAnswerLocked(true);
    const userIsRight = userSaysCorrect === isPairCorrect;
    recordGameAttempt(currentName, userIsRight, "name-rush", 2);
    setTotalAnswered((prev) => prev + 1);

    if (userIsRight) {
      const newStreak = streak + 1;
      setScore((prev) => prev + 10);
      setCorrectCount((prev) => prev + 1);
      setStreak(newStreak);
      setBestStreak((prev) => (newStreak > prev ? newStreak : prev));
      setFeedback("correct");

      // small time bonus
      setTimeLeft((prev) => Math.min(prev + 1, GAME_DURATION + 10));

      // streak banner milestones
      let message = null;
      if (newStreak === 3) message = "🔥 Warming up!";
      else if (newStreak === 5) message = "⚡ On a roll!";
      else if (newStreak === 10) message = "👑 Mastery mode!";

      if (message) {
        setStreakMessage(message);
        schedule(() => {
          setStreakMessage(null);
        }, 2000);
      }
    } else {
      setWrongCount((prev) => prev + 1);
      setLives((prev) => Math.max(prev - 1, 0));
      setStreak(0);
      setFeedback("wrong");
      setStreakMessage(null);

      // small time penalty
      setTimeLeft((prev) => Math.max(prev - 2, 0));

      // heart shake animation
      setHeartShake(true);
      schedule(() => {
        setHeartShake(false);
      }, 400);
    }

    // Clear feedback and move to next pair
    schedule(() => {
      setFeedback(null);
      if ((userIsRight ? lives : lives - 1) > 0 && (userIsRight ? timeLeft + 1 : timeLeft - 2) > 0) {
        generatePair();
        setAnswerLocked(false);
      }
    }, 450);
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key.toLowerCase() === "c" || event.key === "ArrowLeft") handleAnswer(true);
      if (event.key.toLowerCase() === "w" || event.key === "ArrowRight") handleAnswer(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const handleQuit = () => {
    navigate("/gamer-mode");
  };

  const handleStartRound = () => {
    setPhase("countdown");
    setCountdown(3);
    setTimeLeft(GAME_DURATION);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setLives(LIVES_START);
    setTotalAnswered(0);
    setCorrectCount(0);
    setWrongCount(0);
    setElapsedSeconds(0);
    setFeedback(null);
    setAnswerLocked(false);
    setStreakMessage(null);
    setHeartShake(false);
    generatePair();
  };

  const handlePlayAgain = () => {
    setPhase("countdown");
    setCountdown(3);
    setTimeLeft(GAME_DURATION);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setLives(LIVES_START);
    setTotalAnswered(0);
    setCorrectCount(0);
    setWrongCount(0);
    setElapsedSeconds(0);
    setFeedback(null);
    setAnswerLocked(false);
    setStreakMessage(null);
    setHeartShake(false);
    generatePair();
  };

  if (!currentName) {
    return (
      <div className="name-rush-page">
        <div className="name-rush-inner">
          <div className="name-rush-card">
            <p className="name-rush-loading">Loading Name Rush…</p>
          </div>
        </div>
      </div>
    );
  }

  const arabic = getArabic(currentName);
  const translit = getDisplayName(currentName);
  const accuracy =
    totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
  const timePlayed = elapsedSeconds;

  return (
    <div className="name-rush-page">
      <div className="name-rush-inner">
        {/* Shared header */}
        <header className="name-rush-header">
          <div className="nr-title-block">
            <div className="nr-game-label">Gamer Mode</div>
            <h1 className="nr-main-title">Name Rush: Speed Tap</h1>
          </div>

          {(phase === "playing" || phase === "paused") && (
            <div className="nr-hud-right">
              <div
                className={
                  "nr-timer-pill" + (timeLeft <= 10 ? " low" : "")
                }
              >
                ⏱ <span>{timeLeft}s</span>
              </div>
              <div className="nr-score-pill">
                Score <span>{score}</span>
              </div>
              <button type="button" className="nr-pause-button" onClick={() => setPhase(phase === "paused" ? "playing" : "paused")}>
                {phase === "paused" ? "Resume" : "Pause"}
              </button>
            </div>
          )}

          {(phase === "intro" || phase === "countdown" || phase === "gameover") && (
            <div className="nr-hud-right">
              <div className="nr-score-pill">
                High Score <span>{highScore}</span>
              </div>
              <div className="nr-score-pill">
                Today’s Best <span>{todayBest}</span>
              </div>
            </div>
          )}
        </header>

        {/* Sub HUD – only when playing */}
        {(phase === "playing" || phase === "paused") && (
          <>
            <div className="name-rush-subhud">
              <div className="nr-streak">
                Streak:
                <span className={streak >= 3 ? "hot" : ""}>
                  {" "}
                  {streak > 0 ? streak : "-"}
                </span>
              </div>
              <div
                className={
                  "nr-lives" + (heartShake ? " shake" : "")
                }
              >
                {Array.from({ length: LIVES_START }).map((_, idx) => {
                  const filled = idx < lives;
                  return (
                    <span
                      key={idx}
                      className={
                        "nr-heart" + (filled ? " filled" : " empty")
                      }
                    >
                      {filled ? "❤" : "♡"}
                    </span>
                  );
                })}
              </div>
            </div>

            {streakMessage && (
              <div className="nr-streak-banner">{streakMessage}</div>
            )}
          </>
        )}

        {/* PHASED CONTENT */}
        {phase === "intro" && (
          <main className="name-rush-card name-rush-intro-card">
            <h2 className="nr-intro-title">60 Seconds. How Many Meanings Can You Verify?</h2>
            <p className="nr-intro-text">
              Name Rush throws Names of Allah at you. Decide fast if the meaning
              shown is correct or not.
            </p>
            <ul className="nr-intro-rules">
              <li>✅ Correct = +10 points and streak</li>
              <li>❌ Wrong = lose a heart and reset streak</li>
              <li>⏱ Time bonus for sharp answers, penalty for misses</li>
            </ul>
            <button
              type="button"
              className="nr-primary-button nr-intro-button"
              onClick={handleStartRound}
            >
              Start Round
            </button>
            <button
              type="button"
              className="nr-secondary-button nr-intro-back"
              onClick={handleQuit}
            >
              Back to Gamer Mode
            </button>
          </main>
        )}

        {phase === "countdown" && (
          <main className="name-rush-card nr-countdown-card">
            <div className="nr-countdown-label">Get Ready</div>
            <div className="nr-countdown-value">{countdown}</div>
            <p className="nr-countdown-text">
              First Name is loading… tap fast and trust your memory.
            </p>
          </main>
        )}

        {(phase === "playing" || phase === "paused") && (
          <>
            {/* Question card */}
            <main className="name-rush-card">
              <div className="nr-card-header">
                <div className="nr-small-label">Is this meaning correct?</div>
                <div className="nr-round-info">
                  {totalAnswered + 1} / ∞
                </div>
              </div>

              <div className="nr-name-block">
                {arabic && <div className="nr-arabic-name">{arabic}</div>}
                <div className="nr-translit">{translit}</div>
              </div>

              <div className="nr-meaning-block">
                <div className="nr-meaning-label">Shown meaning</div>
                <div className="nr-meaning-text">{shownMeaning}</div>
              </div>

              <div className="nr-actions">
                <button
                  type="button"
                  className={
                    "nr-answer-button correct-btn" +
                    (feedback === "correct" ? " pulse" : "")
                  }
                  onClick={() => handleAnswer(true)}
                  disabled={phase !== "playing" || answerLocked}
                >
                  ✅ Correct
                </button>
                <button
                  type="button"
                  className={
                    "nr-answer-button wrong-btn" +
                    (feedback === "wrong" ? " shake" : "")
                  }
                  onClick={() => handleAnswer(false)}
                  disabled={phase !== "playing" || answerLocked}
                >
                  ❌ Wrong
                </button>
              </div>

              {feedback && (
                <div
                  className={
                    "nr-feedback-banner " +
                    (feedback === "correct"
                      ? "nr-feedback-correct"
                      : "nr-feedback-wrong")
                  }
                >
                  {feedback === "correct"
                    ? "Nice! Keep the streak going."
                    : `Not this time. ${getDisplayName(currentName)} means “${getMeaning(currentName)}.”`}
                </div>
              )}
            </main>

            {/* Quit button */}
            <button
              type="button"
              className="nr-quit-button"
              onClick={handleQuit}
            >
              Quit &amp; Exit
            </button>
            {phase === "paused" && <div className="nr-pause-overlay" role="dialog" aria-modal="true"><strong>Game paused</strong><span>Your time and streak are safe.</span><button type="button" className="nr-primary-button" onClick={() => setPhase("playing")}>Resume</button></div>}
          </>
        )}

        {phase === "gameover" && (
          <>
            {/* Small spacer so overlay has context; content itself is in overlay */}
            <div style={{ height: "8px" }} />
          </>
        )}
      </div>

      {/* Game over overlay */}
      {phase === "gameover" && (
        <div className="nr-results-overlay">
          <div className="nr-results-card">
            <div className="nr-results-title">Session Complete</div>
            <p className="nr-results-subtitle">
              You just finished a round of <strong>Name Rush: Speed Tap</strong>.
            </p>

            <div className="nr-results-grid">
              <div className="nr-results-item">
                <div className="nr-results-label">Score</div>
                <div className="nr-results-value">{score}</div>
              </div>
              <div className="nr-results-item">
                <div className="nr-results-label">Correct</div>
                <div className="nr-results-value">{correctCount}</div>
              </div>
              <div className="nr-results-item">
                <div className="nr-results-label">Wrong</div>
                <div className="nr-results-value">{wrongCount}</div>
              </div>
              <div className="nr-results-item">
                <div className="nr-results-label">Accuracy</div>
                <div className="nr-results-value">{accuracy}%</div>
              </div>
              <div className="nr-results-item">
                <div className="nr-results-label">Best Streak</div>
                <div className="nr-results-value">{bestStreak}</div>
              </div>
              <div className="nr-results-item">
                <div className="nr-results-label">Time Played</div>
                <div className="nr-results-value">
                  {timePlayed}s
                </div>
              </div>
            </div>

            <div className="nr-highscores-row">
              <div className="nr-highscore-item">
                High Score: <span>{highScore}</span>
              </div>
              <div className="nr-highscore-item">
                Today’s Best: <span>{todayBest}</span>
              </div>
            </div>

            <div className="nr-results-meaning-note">
              Tip: Compare the shown meanings with Learn Mode to reinforce what you just saw.
            </div>

            <div className="nr-results-actions">
              <button
                type="button"
                className="nr-primary-button"
                onClick={handlePlayAgain}
              >
                Run It Back
              </button>
              <button
                type="button"
                className="nr-secondary-button"
                onClick={handleQuit}
              >
                Back to Gamer Mode
              </button>
            </div>
            <NextStepCard context="name_rush" hasMistakes={wrongCount > 0} />
          </div>
        </div>
      )}
    </div>
  );
}

export default NameRush;
