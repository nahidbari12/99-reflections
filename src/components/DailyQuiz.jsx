// /src/components/DailyQuiz.jsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/DailyQuiz.css";
import names from "../data/names"; // ✅ src/data/names.jsx
import { recordNameAttempt } from "../utils/learningProfile";
import NextStepCard from "./NextStepCard";
import { trackEvent } from "../utils/analytics";
import { markDailyStep } from "../utils/dailyEngagement";

const TOTAL_QUESTIONS = 5;
const CONFETTI_COUNT = 40;
const SCORE_ARC_RADIUS = 54;
const SCORE_ARC_CIRCUMFERENCE = 2 * Math.PI * SCORE_ARC_RADIUS;

// ✅ New localStorage keys (V2) so old UTC-based data doesn't interfere
const LAST_DATE_KEY = "dailyQuizLastDateV2";
const LAST_SCORE_KEY = "dailyQuizLastScoreV2";
const STREAK_KEY = "dailyQuizStreakV2";

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getSeedFromDateStr(dateStr) {
  let seed = 0;
  for (let i = 0; i < dateStr.length; i++) {
    seed = (seed * 31 + dateStr.charCodeAt(i)) >>> 0;
  }
  return seed;
}

function shuffleWithSeed(array, seed) {
  const rng = mulberry32(seed);
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ✅ Local date key based on the user's timezone, not UTC
function getLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateDisplay(date) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const DailyQuiz = () => {
  const navigate = useNavigate();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [streak, setStreak] = useState(0);
  const [hasCompletedToday, setHasCompletedToday] = useState(false);
  const [animateScoreArc, setAnimateScoreArc] = useState(false);
  const [answerHistory, setAnswerHistory] = useState([]);
  const [showReview, setShowReview] = useState(false);
  const [lockedForToday, setLockedForToday] = useState(false);
  const [timeUntilNextQuiz, setTimeUntilNextQuiz] = useState("");
  const optionsRef = useRef(null);

  // Use local time for "today"
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => getLocalDateKey(today), [today]);
  const yesterdayKey = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    return getLocalDateKey(d);
  }, [today]);

  const displayDate = useMemo(() => formatDateDisplay(today), [today]);
  const isFriday = today.getDay() === 5;

  // ⭐ HARD MODE FEEL: 4 options, random question type (name→meaning OR meaning→name)
  // ✅ Ensures all 4 option texts are unique
  const questions = useMemo(() => {
    if (!Array.isArray(names) || names.length < 4) return [];

    const seed = getSeedFromDateStr(todayKey);
    const shuffledNames = shuffleWithSeed(names, seed);
    const totalNames = shuffledNames.length;
    const questionList = [];

    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
      const correctName = shuffledNames[i];

      // deterministic random: switch between name→meaning and meaning→name
      const isNameQuestion = ((seed + i) % 2) === 0;
      const questionType = isNameQuestion ? "name" : "meaning";

      const correctText = isNameQuestion
        ? correctName.meaning
        : correctName.name;

      // Build unique distractors by text
      const candidateIndices = [];
      for (let k = 0; k < totalNames; k++) {
        if (k !== i) candidateIndices.push(k);
      }

      const shuffledCandidates = shuffleWithSeed(
        candidateIndices,
        seed + i + 200
      );

      const distractors = [];
      for (let idx of shuffledCandidates) {
        if (distractors.length === 3) break;
        const cand = shuffledNames[idx];
        const candText = isNameQuestion ? cand.meaning : cand.name;
        if (candText === correctText) continue;
        if (distractors.some((d) => d.text === candText)) continue;
        distractors.push({ text: candText, correct: false });
      }

      const optionsRaw = [
        { text: correctText, correct: true },
        ...distractors,
      ].slice(0, 4);

      const optionsShuffled = shuffleWithSeed(
        optionsRaw,
        seed + i + 100
      );
      const correctIndex = optionsShuffled.findIndex((o) => o.correct);

      questionList.push({
        id: i + 1,
        englishName: correctName.name,
        arabic: correctName.arabic,
        meaning: correctName.meaning,
        questionType, // "name" or "meaning"
        options: optionsShuffled.map((o) => o.text),
        correctIndex,
      });
    }

    return questionList;
  }, [todayKey]);

  // Load streak (V2 key)
  useEffect(() => {
    try {
      const storedStreak = localStorage.getItem(STREAK_KEY);
      if (storedStreak) {
        setStreak(parseInt(storedStreak, 10) || 0);
      }
    } catch (e) {
      console.error("Error reading daily quiz data (streak)", e);
    }
  }, [todayKey]);

  // Once-a-day lock: if they've already completed *today's local* quiz, show results using stored score
  useEffect(() => {
    try {
      const lastDate = localStorage.getItem(LAST_DATE_KEY);
      const lastScore = localStorage.getItem(LAST_SCORE_KEY);

      if (lastDate === todayKey && lastScore !== null) {
        setScore(parseInt(lastScore, 10) || 0);
        setShowResults(true);
        setHasCompletedToday(true);
        setLockedForToday(true);
      }
    } catch (e) {
      console.error("Error reading daily quiz data (lock)", e);
    }
  }, [todayKey]);

  // Animate score arc when results appear
  useEffect(() => {
    if (showResults) {
      const t = setTimeout(() => setAnimateScoreArc(true), 50);
      return () => clearTimeout(t);
    } else {
      setAnimateScoreArc(false);
    }
  }, [showResults, score]);

  // Live countdown until local midnight
  useEffect(() => {
    if (!showResults) return;

    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const diff = tomorrow.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeUntilNextQuiz("Available now");
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const parts = [];
      if (hours > 0) parts.push(`${hours}h`);
      parts.push(`${minutes.toString().padStart(2, "0")}m`);
      parts.push(`${seconds.toString().padStart(2, "0")}s`);

      setTimeUntilNextQuiz(parts.join(" "));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [showResults]);

  const currentQuestion = questions[currentIndex];
  const scoreRatio =
    TOTAL_QUESTIONS === 0 ? 0 : score / TOTAL_QUESTIONS;
  const scoreDashOffset = animateScoreArc
    ? SCORE_ARC_CIRCUMFERENCE * (1 - scoreRatio)
    : SCORE_ARC_CIRCUMFERENCE;

  const confettiPieces = useMemo(
    () => Array.from({ length: CONFETTI_COUNT }),
    []
  );

  const getStreakFlameClass = () => {
    if (streak >= 14) return "streak-flame glow-high";
    if (streak >= 7) return "streak-flame glow-medium";
    if (streak >= 3) return "streak-flame glow-low";
    return "streak-flame";
  };

  const getMilestoneLabel = () => {
    if (streak >= 21) return "Husna Scholar";
    if (streak >= 14) return "Star Seeker";
    if (streak >= 7) return "Moon Walker";
    if (streak >= 3) return "Daily Starter";
    return "";
  };

  // For consistency meter
  const getNextMilestoneInfo = () => {
    const thresholds = [3, 7, 14, 21];
    const current = streak;
    const next = thresholds.find((t) => t > current);
    if (!next) {
      return {
        nextThreshold: null,
        remaining: 0,
        progressRatio: 1,
      };
    }

    const prev =
      thresholds.slice(0, thresholds.indexOf(next)).pop() ?? 0;
    const span = next - prev;
    const progressed = Math.max(0, current - prev);
    const ratio = Math.max(0, Math.min(1, progressed / span));

    return {
      nextThreshold: next,
      remaining: Math.max(0, next - current),
      progressRatio: ratio,
    };
  };

  const { nextThreshold, remaining, progressRatio } =
    getNextMilestoneInfo();

  const handleOptionClick = (index, event) => {
    if (
      !currentQuestion ||
      selectedOption !== null ||
      showResults ||
      lockedForToday
    ) {
      return;
    }

    // Blur while the button is still enabled. Some browsers will not reliably
    // blur a control after React disables it to show answer feedback.
    event.currentTarget.blur();

    const correct = index === currentQuestion.correctIndex;
    recordNameAttempt({ name: currentQuestion.englishName, arabic: currentQuestion.arabic }, correct, { source: "daily-quiz", seconds: 12 });
    setSelectedOption(index);
    setIsCorrect(correct);

    // record answer for review
    setAnswerHistory((prev) => [
      ...prev,
      {
        id: currentQuestion.id,
        questionType: currentQuestion.questionType,
        englishName: currentQuestion.englishName,
        meaning: currentQuestion.meaning,
        chosenText: currentQuestion.options[index],
        correctText:
          currentQuestion.options[currentQuestion.correctIndex],
        wasCorrect: correct,
      },
    ]);

    const updatedScore = correct ? score + 1 : score;
    if (correct) {
      setScore((prev) => prev + 1);
    }

    // ✅ Clear selection BEFORE switching to next question
    setTimeout(() => {
      setSelectedOption(null);
      setIsCorrect(null);

      // A focused button can keep its browser focus styling after React reuses
      // the option elements for the next question. Remove that focus before
      // advancing so no answer appears preselected.
      const focusedOption = document.activeElement;
      if (optionsRef.current?.contains(focusedOption)) {
        focusedOption.blur();
      }

      if (currentIndex + 1 < TOTAL_QUESTIONS) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        finishQuiz(updatedScore);
      }
    }, 1100);
  };

  const finishQuiz = (finalScore) => {
    markDailyStep("quiz", 30);
    setShowResults(true);
    setHasCompletedToday(true);
    setLockedForToday(true);
    trackEvent("daily_quiz_complete", { score: finalScore, total_questions: TOTAL_QUESTIONS });

    try {
      const previousDate = localStorage.getItem(LAST_DATE_KEY);
      const previousStreakRaw = localStorage.getItem(STREAK_KEY);
      const previousStreak = previousStreakRaw
        ? parseInt(previousStreakRaw, 10)
        : 0;

      const threshold = Math.ceil(TOTAL_QUESTIONS * 0.6);
      let newStreak = previousStreak;

      if (finalScore >= threshold) {
        // ✅ Passing attempt
        if (!previousDate) {
          newStreak = 1;
        } else if (previousDate === todayKey) {
          newStreak = previousStreak || 1;
        } else if (previousDate === yesterdayKey) {
          newStreak = previousStreak + 1;
        } else {
          newStreak = 1;
        }
      } else {
        // ❌ Failing attempt
        if (!previousDate || previousDate !== todayKey) {
          newStreak = 0;
        } else {
          newStreak = previousStreak;
        }
      }

      localStorage.setItem(LAST_DATE_KEY, todayKey);
      localStorage.setItem(LAST_SCORE_KEY, String(finalScore));
      localStorage.setItem(STREAK_KEY, String(newStreak));

      setStreak(newStreak);
    } catch (e) {
      console.error("Error saving daily quiz data", e);
    }
  };

  const handleBackToModes = () => {
    navigate("/");
  };

  const handleBackHome = () => {
    navigate("/");
  };

  const handleShareResults = async () => {
    const siteUrl = "https://99namesofallah.org";
    const shareText = `I just scored ${score}/${TOTAL_QUESTIONS} on today's 99 Names of Allah Daily Quiz and I'm on a ${streak}-day streak! 🌙✨

Tap in and see how many Names you remember today: ${siteUrl}`;

    // 1) Try native share sheet if available
    try {
      if (navigator.share) {
        await navigator.share({
          title: "My Daily Quiz on 99NamesOfAllah.org",
          text: shareText,
          url: siteUrl,
        });
        return;
      }
    } catch (e) {
      console.error("Web Share API failed", e);
      // fall through to clipboard / manual
    }

    // 2) Try clipboard copy if possible
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareText);
        alert(
          "Your Daily Quiz message is copied to your clipboard! Paste it into Snapchat, WhatsApp, Instagram, etc."
        );
        return;
      }
    } catch (e) {
      console.error("Clipboard copy failed", e);
      // fall through
    }

    // 3) Last resort: explain manual copy from preview text
    alert(
      "Sharing isn’t available in this browser, but you can long-press the message under the Share button to copy and share your Daily Quiz result."
    );
  };

  if (!questions.length && !showResults) {
    return (
      <div className="daily-quiz-page">
        <div className="daily-quiz-card daily-quiz-card-enter">
          <div className="daily-quiz-topbar">
            <button
              className="daily-quiz-back-button"
              onClick={handleBackToModes}
            >
              ← Home
            </button>
          </div>
          <h1 className="daily-quiz-title">Daily Quiz</h1>
          <p>Questions are loading or unavailable. Please try again later.</p>
        </div>
      </div>
    );
  }

  const milestoneLabel = getMilestoneLabel();
  const showConfetti = showResults && score === TOTAL_QUESTIONS;

  const resultsMessage = (() => {
    if (isFriday) {
      if (score === TOTAL_QUESTIONS) {
        return "Jumu’ah complete 🌙 A perfect score on a blessed day.";
      }
      if (score >= Math.ceil(TOTAL_QUESTIONS * 0.6)) {
        return "Beautiful Jumu’ah effort. Keep the Names close to your heart.";
      }
      return "Every Jumu’ah step counts. Come back tomorrow and try again.";
    } else {
      if (score === TOTAL_QUESTIONS) return "Amazing! A perfect score. 🌟";
      if (score >= Math.ceil(TOTAL_QUESTIONS * 0.6))
        return "Nice work! Keep building your daily habit.";
      return "Good effort! Come back tomorrow and try again.";
    }
  })();

  return (
    <div className="daily-quiz-page">
      <div className="daily-quiz-card daily-quiz-card-enter">
        {/* Floating ambient orbs inside card */}
        <span className="daily-quiz-orb orb-1" />
        <span className="daily-quiz-orb orb-2" />
        <span className="daily-quiz-orb orb-3" />

        {/* Top bar with back button */}
        <div className="daily-quiz-topbar">
          <button
            className="daily-quiz-back-button"
            onClick={handleBackToModes}
          >
            ← Home
          </button>
        </div>

        <div className="daily-quiz-header">
          <h1 className="daily-quiz-title">🌙 Daily Quiz</h1>
          <p className="daily-quiz-date">{displayDate}</p>

          {isFriday && (
            <div className="friday-banner">
              ☪️ Jumu&apos;ah Boost – Don&apos;t skip today&apos;s quiz!
            </div>
          )}

          {!showResults && (
            <p className="daily-quiz-reminder">
              Takes less than a minute. Don&apos;t break your streak 🔥
            </p>
          )}
        </div>

        <div className="daily-quiz-streak">
          <span className={getStreakFlameClass()}>🔥</span>
          <span className="streak-text">
            <span className="streak-number">{streak}</span>
            <span className="streak-label">
              day{streak === 1 ? "" : "s"} streak
            </span>
          </span>
        </div>

        {milestoneLabel && (
          <div className="streak-milestone">
            🎖 Current rank: <span>{milestoneLabel}</span>
          </div>
        )}

        {/* QUIZ PHASE (only if not locked & no results yet) */}
        {!showResults && currentQuestion && !lockedForToday && (
          <>
            <div className="daily-quiz-progress">
              Question {currentIndex + 1} of {TOTAL_QUESTIONS}
            </div>

            {currentQuestion.questionType === "name" && (
              <div className="daily-quiz-name-block">
                <div className="daily-quiz-transliteration">
                  {currentQuestion.englishName}
                </div>
              </div>
            )}

            {currentQuestion.questionType === "name" ? (
              <p className="daily-quiz-question">
                What is the meaning of{" "}
                <span className="quiz-name-highlight">
                  {currentQuestion.englishName}
                </span>
                ?
              </p>
            ) : (
              <p className="daily-quiz-question">
                Which Name of Allah means{" "}
                <span className="quiz-name-highlight">
                  {currentQuestion.meaning}
                </span>
                ?
              </p>
            )}

            <div className="daily-quiz-options" ref={optionsRef}>
              {currentQuestion.options.map((option, index) => {
                let optionClass = "daily-quiz-option option-animate";
                if (selectedOption !== null) {
                  if (index === currentQuestion.correctIndex) {
                    optionClass += " correct";
                  } else if (index === selectedOption) {
                    optionClass += " wrong";
                  }
                }

                return (
                  <button
                    key={`${currentQuestion.id}-${index}-${option}`}
                    className={optionClass}
                    onClick={(event) => handleOptionClick(index, event)}
                    disabled={selectedOption !== null}
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {selectedOption !== null && (
              <div
                className={
                  isCorrect
                    ? "daily-quiz-feedback correct"
                    : "daily-quiz-feedback wrong"
                }
              >
                {isCorrect ? "✅ Correct!" : "❌ Not this time"}
              </div>
            )}
          </>
        )}

        {/* RESULTS / LOCKED VIEW */}
        {showResults && (
          <div className="daily-quiz-results">
            {/* Confetti overlay for perfect score */}
            {showConfetti && (
              <div className="daily-quiz-confetti">
                {confettiPieces.map((_, i) => (
                  <span key={i} className="confetti-piece" />
                ))}
              </div>
            )}

            {/* Reward chest */}
            <div className="reward-chest">
              <div className="chest-emoji">🎁</div>
              <div className="chest-text">
                <div className="chest-title">Daily Reward Unlocked</div>
                <div className="chest-sub">{resultsMessage}</div>
              </div>
            </div>

            {/* Score arc */}
            <div className="score-arc-wrapper">
              <svg
                className="score-arc-svg"
                viewBox="0 0 140 80"
              >
                <defs>
                  <linearGradient
                    id="scoreGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#facc15" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>
                </defs>
                <path
                  className="score-arc-bg"
                  d="
                    M 20 70
                    A 50 50 0 0 1 120 70
                  "
                  fill="none"
                  stroke="rgba(30,64,175,0.6)"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
                <path
                  className="score-arc-progress"
                  d="
                    M 20 70
                    A 50 50 0 0 1 120 70
                  "
                  fill="none"
                  stroke="url(#scoreGradient)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={SCORE_ARC_CIRCUMFERENCE}
                  strokeDashoffset={
                    scoreRatio === 0
                      ? SCORE_ARC_CIRCUMFERENCE
                      : scoreDashOffset
                  }
                />
                <text
                  x="50%"
                  y="70%"
                  dominantBaseline="middle"
                  textAnchor="middle"
                  className="score-arc-text"
                >
                  {Math.round(scoreRatio * 100)}%
                </text>
              </svg>
              <div className="score-line">
                You scored{" "}
                <span className="score-highlight">
                  {score} / {TOTAL_QUESTIONS}
                </span>
              </div>
            </div>

            <p className="results-message">{resultsMessage}</p>

            <p className="results-streak-message">
              Current streak:{" "}
              <span className="streak-value">
                {streak} day{streak === 1 ? "" : "s"}
              </span>
            </p>

            {milestoneLabel && (
              <p className="results-milestone-message">
                Current rank: <span>{milestoneLabel}</span>
              </p>
            )}

            {/* Consistency meter on results page */}
            {nextThreshold && (
              <div className="streak-progress-wrapper">
                <div className="streak-progress-label">
                  {remaining === 0
                    ? "New rank is almost here."
                    : `Only ${remaining} more day${
                        remaining === 1 ? "" : "s"
                      } until your next rank at ${nextThreshold} days.`}
                </div>
                <div className="streak-progress-bar">
                  <div
                    className="streak-progress-fill"
                    style={{ width: `${progressRatio * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* ⏱️ Next quiz unlock timer */}
            {timeUntilNextQuiz && (
              <div className="daily-quiz-next-unlock">
                <div className="next-unlock-label">
                  Next daily quiz unlocks in
                </div>
                <div className="next-unlock-time">
                  {timeUntilNextQuiz}
                </div>
                <div className="next-unlock-sub">
                  A fresh set of questions drops at midnight your time.
                </div>
              </div>
            )}

            {/* Review section */}
            {answerHistory.length > 0 && (
              <div className="daily-quiz-review">
                <button
                  className="daily-quiz-review-toggle"
                  onClick={() => setShowReview((prev) => !prev)}
                >
                  {showReview
                    ? "🔽 Hide review"
                    : "📝 Review today’s questions"}
                </button>
                <p className="daily-quiz-review-hint">
                  See the correct Name and meaning for each question.
                </p>

                {showReview && (
                  <div className="daily-quiz-review-list">
                    {answerHistory.map((entry) => (
                      <div
                        key={entry.id}
                        className={`daily-quiz-review-item ${
                          entry.wasCorrect ? "correct" : "wrong"
                        }`}
                      >
                        <div className="review-q-label">
                          Q{entry.id}
                        </div>
                        <div className="review-q-main">
                          {entry.questionType === "name" ? (
                            <>
                              <div className="review-q-text">
                                {entry.englishName} →{" "}
                                <span>{entry.correctText}</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="review-q-text">
                                {entry.meaning} →{" "}
                                <span>{entry.correctText}</span>
                              </div>
                            </>
                          )}
                          {!entry.wasCorrect && (
                            <div className="review-q-your">
                              Your answer: {entry.chosenText}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="daily-quiz-share">
              <p className="daily-quiz-share-label">Show off your streak:</p>
              <button
                className="daily-quiz-share-button"
                onClick={handleShareResults}
              >
                📤 Share My Streak
              </button>
              <p className="daily-quiz-share-preview">
                I just scored {score}/{TOTAL_QUESTIONS} on today&apos;s 99
                Names of Allah Daily Quiz and I&apos;m on a {streak}-day
                streak. 🌙✨ Tap in and see how many Names you remember
                today: 99NamesOfAllah.org
              </p>
            </div>
            <NextStepCard context="daily_quiz" hasMistakes={answerHistory.some((entry) => !entry.wasCorrect)} />
          </div>
        )}

        {hasCompletedToday && (
          <div className="daily-quiz-footer">
            <p className="daily-quiz-footer-note">
              Don&apos;t let another day pass without revisiting the Names of
              Allah. Come back tomorrow for a new Daily Quiz, inshaAllah.
            </p>
            <button
              className="daily-quiz-home-link"
              onClick={handleBackHome}
            >
              🏠 Back to Home Page
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyQuiz;
