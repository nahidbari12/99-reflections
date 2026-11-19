// /src/components/DivineDescentGame.jsx

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/DivineDescentGame.css";
import namesOfAllah from "../data/names";
import { recordGameAttempt, saveGameResult } from "../utils/gameUtils";
import NextStepCard from "./NextStepCard";

// Normalize names data to ensure we always have English + meaning
const processedNames = (namesOfAllah || []).map((n, idx) => ({
  id: n.id ?? idx,
  name:
    n.englishName ||
    n.transliteration ||
    n.name ||
    n.english ||
    n.english_name ||
    "",
  meaning: n.meaning || n.enMeaning || n.translation || "",
}));

const TOTAL_HEARTS = 3;
const XP_PER_CORRECT = 10;
const LOCAL_BEST_KEY = "dd_best_score_v1";

function getLevelTag(level) {
  if (level >= 7) return "Supernova Orbit";
  if (level >= 5) return "Meteor Stream";
  if (level >= 3) return "Radiant Path";
  return "Calm Orbit";
}

function getRandomIndex(excludeIndex = null) {
  if (!processedNames.length) return 0;
  let idx = Math.floor(Math.random() * processedNames.length);
  if (excludeIndex !== null && processedNames.length > 1) {
    while (idx === excludeIndex) {
      idx = Math.floor(Math.random() * processedNames.length);
    }
  }
  return idx;
}

function buildOptions(correctIndex) {
  if (!processedNames.length) return [];

  const correct = processedNames[correctIndex];
  const options = [{ text: correct.meaning, correct: true }];

  const used = new Set([correctIndex]);
  const usedMeanings = new Set([correct.meaning]);
  while (options.length < 3 && used.size < processedNames.length) {
    const idx = Math.floor(Math.random() * processedNames.length);
    if (used.has(idx)) continue;
    if (usedMeanings.has(processedNames[idx].meaning)) continue;
    used.add(idx);
    usedMeanings.add(processedNames[idx].meaning);
    options.push({
      text: processedNames[idx].meaning,
      correct: false,
    });
  }

  // Shuffle
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return options;
}

function DivineDescentGame() {
  const navigate = useNavigate();

  // Flow states
  const [isIntro, setIsIntro] = useState(true);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownValue, setCountdownValue] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Core stats
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem(LOCAL_BEST_KEY);
    return saved ? parseInt(saved, 10) || 0 : 0;
  });
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  // Level / XP
  const [level, setLevel] = useState(1);
  const [xpProgress, setXpProgress] = useState(0);
  const [levelTag, setLevelTag] = useState(getLevelTag(1));
  const [levelUpFlash, setLevelUpFlash] = useState(false);

  // Hearts
  const [heartsLeft, setHeartsLeft] = useState(TOTAL_HEARTS);

  // Falling word
  const [currentIndex, setCurrentIndex] = useState(() =>
    getRandomIndex(null)
  );
  const [fallY, setFallY] = useState(0); // percent from top
  const [laneShake, setLaneShake] = useState(false);

  // Options
  const [options, setOptions] = useState(() =>
    buildOptions(currentIndex)
  );

  // Customization
  const [selectedMode, setSelectedMode] = useState("calm"); // calm | meteor | supernova
  const [selectedTrail, setSelectedTrail] = useState("stars"); // stars | aurora
  const [selectedAngel, setSelectedAngel] = useState("angel"); // angel / others later

  // Feedback banners
  const [banner, setBanner] = useState(null); // { type: "correct"|"wrong"|"streak", text: string }
  const bannerTimeoutRef = useRef(null);

  // Names player struggled with
  const [struggledNames, setStruggledNames] = useState([]);

  // Refs for intervals
  const fallIntervalRef = useRef(null);
  const answerLockRef = useRef(false);
  const resultSavedRef = useRef(false);
  const fxTimersRef = useRef(new Set());
  const scheduleFx = (callback, delay) => {
    const id = window.setTimeout(() => { fxTimersRef.current.delete(id); callback(); }, delay);
    fxTimersRef.current.add(id);
  };

  useEffect(() => () => {
    if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
    if (fallIntervalRef.current) clearInterval(fallIntervalRef.current);
    fxTimersRef.current.forEach(window.clearTimeout);
    fxTimersRef.current.clear();
  }, []);

  const currentName = processedNames[currentIndex] || {
    name: "",
    meaning: "",
  };

  const angelChar =
    selectedAngel === "moon"
      ? "🌙"
      : selectedAngel === "star"
      ? "⭐"
      : "👼"; // 👼 angel with wings by default

  /* -------------------- helpers -------------------- */

  function resetGameState(fullResetBest = false) {
    scoreRef.current = 0;
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setTotalAnswered(0);
    setCorrectCount(0);
    setLevel(1);
    setXpProgress(0);
    setLevelTag(getLevelTag(1));
    setHeartsLeft(TOTAL_HEARTS);
    const newIdx = getRandomIndex(null);
    setCurrentIndex(newIdx);
    setOptions(buildOptions(newIdx));
    setFallY(0);
    setIsGameOver(false);
    setIsPaused(false);
    setBanner(null);
    setStruggledNames([]);
    answerLockRef.current = false;
    resultSavedRef.current = false;
    if (fullResetBest) {
      setBestScore(0);
      localStorage.removeItem(LOCAL_BEST_KEY);
    }
  }

  function showBannerMessage(type, text) {
    if (bannerTimeoutRef.current) {
      clearTimeout(bannerTimeoutRef.current);
    }
    setBanner({ type, text });
    bannerTimeoutRef.current = setTimeout(() => {
      setBanner(null);
    }, 800);
  }

  function triggerLaneShake() {
    setLaneShake(true);
    scheduleFx(() => setLaneShake(false), 350);
  }

  function handleLevelGain() {
    setLevel((prev) => {
      const next = prev + 1;
      setLevelTag(getLevelTag(next));
      return next;
    });
    setLevelUpFlash(true);
    scheduleFx(() => setLevelUpFlash(false), 650);
  }

  function endGame() {
    if (!resultSavedRef.current) {
      resultSavedRef.current = true;
      saveGameResult("divine-descent", { outcome: "complete", score: scoreRef.current });
    }
    setIsPlaying(false);
    setIsGameOver(true);
    setShowCountdown(false);
    setIsPaused(false);
  }

  useEffect(() => {
    const pauseWhenHidden = () => { if (document.hidden && isPlaying && !isGameOver) setIsPaused(true); };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => document.removeEventListener("visibilitychange", pauseWhenHidden);
  }, [isPlaying, isGameOver]);

  /* -------------------- countdown flow -------------------- */

  function handleStartFromIntro() {
    setIsIntro(false);
    setShowCountdown(true);
    setCountdownValue(3);
  }

  useEffect(() => {
    if (!showCountdown) return;
    setIsPlaying(false);
    setFallY(0);

    const id = setInterval(() => {
      setCountdownValue((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          setShowCountdown(false);
          setIsPlaying(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [showCountdown]);

  /* -------------------- falling loop -------------------- */

  useEffect(() => {
    if (!isPlaying || isGameOver || isPaused) {
      if (fallIntervalRef.current) {
        clearInterval(fallIntervalRef.current);
        fallIntervalRef.current = null;
      }
      return;
    }

    const baseSpeed = 28; // % per second
    const speedBoost = (level - 1) * 4;
    const modeMultiplier = selectedMode === "supernova" ? 1.45 : selectedMode === "meteor" ? 1.2 : 0.9;
    const speedPerSecond = (baseSpeed + speedBoost) * modeMultiplier;
    const intervalMs = 50;
    const delta = (speedPerSecond * intervalMs) / 1000;

    fallIntervalRef.current = setInterval(() => {
      setFallY((prev) => {
        const next = prev + delta;
        if (next >= 100) return 100;
        return next;
      });
    }, intervalMs);

    return () => {
      if (fallIntervalRef.current) {
        clearInterval(fallIntervalRef.current);
        fallIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, isGameOver, isPaused, level, selectedMode]);

  useEffect(() => {
    if (isPlaying && !isGameOver && !isPaused && fallY >= 100) handleMiss();
  }, [fallY, isPlaying, isGameOver, isPaused]);

  /* -------------------- miss / next word -------------------- */

  function goToNextWord() {
    const nextIndex = getRandomIndex(currentIndex);
    setCurrentIndex(nextIndex);
    setOptions(buildOptions(nextIndex));
    setFallY(0);
    scheduleFx(() => { answerLockRef.current = false; }, 80);
  }

  function handleMiss() {
    if (isGameOver || isPaused || answerLockRef.current) return;
    answerLockRef.current = true;
    triggerLaneShake();
    setStreak(0);
    setTotalAnswered((prev) => prev + 1);
    recordGameAttempt(namesOfAllah[currentIndex] || currentName.name, false, "divine-descent", 4);

    // record struggled name
    if (currentName.name) {
      setStruggledNames((prev) => {
        const exists = prev.some((x) => x.name === currentName.name);
        if (exists) return prev;
        return [
          ...prev,
          {
            name: currentName.name,
            meaning: currentName.meaning,
          },
        ];
      });
    }

    const nextHearts = Math.max(0, heartsLeft - 1);
    setHeartsLeft(nextHearts);
    if (nextHearts === 0) {
      showBannerMessage("wrong", "Out of hearts!");
      endGame();
      return;
    }
    showBannerMessage("wrong", "Missed!");
    goToNextWord();
  }

  /* -------------------- answer handling -------------------- */

  function handleOptionClick(option) {
    if (!isPlaying || isGameOver || isPaused || !option || answerLockRef.current) return;
    answerLockRef.current = true;

    setTotalAnswered((prev) => prev + 1);

    if (option.correct) {
      recordGameAttempt(namesOfAllah[currentIndex] || currentName.name, true, "divine-descent", 3);
      showBannerMessage("correct", "Nice catch!");
      setCorrectCount((prev) => prev + 1);
      setScore((prev) => {
        const newScore = prev + 10;
        scoreRef.current = newScore;
        setBestScore((best) => {
          const updated = Math.max(best, newScore);
          localStorage.setItem(LOCAL_BEST_KEY, String(updated));
          return updated;
        });
        return newScore;
      });

      setStreak((prev) => {
        const next = prev + 1;
        setMaxStreak((max) => Math.max(max, next));
        if (next > 0 && next % 3 === 0) {
          showBannerMessage("streak", `Streak x${next}!`);
        }
        return next;
      });

      // XP / level
      setXpProgress((prev) => {
        const next = prev + XP_PER_CORRECT;
        if (next >= 100) {
          handleLevelGain();
          return next - 100;
        }
        return next;
      });
    } else {
      recordGameAttempt(namesOfAllah[currentIndex] || currentName.name, false, "divine-descent", 3);
      // wrong answer
      showBannerMessage("wrong", "Not this one");
      setStreak(0);

      if (currentName.name) {
        setStruggledNames((prev) => {
          const exists = prev.some((x) => x.name === currentName.name);
          if (exists) return prev;
          return [
            ...prev,
            {
              name: currentName.name,
              meaning: currentName.meaning,
            },
          ];
        });
      }

      const nextHearts = Math.max(0, heartsLeft - 1);
      setHeartsLeft(nextHearts);
      if (nextHearts === 0) {
        showBannerMessage("wrong", `Out of hearts — ${currentName.name} means “${currentName.meaning}.”`);
        endGame();
        return;
      }
      triggerLaneShake();
      showBannerMessage("wrong", `${currentName.name} means “${currentName.meaning}.”`);
    }

    goToNextWord();
  }

  /* -------------------- computed UI bits -------------------- */

  const accuracy =
    totalAnswered > 0
      ? Math.round((correctCount / totalAnswered) * 100)
      : 0;

  const laneClassNames = [
    "dd-falling-lane",
    selectedMode === "calm"
      ? "dd-mode-calm"
      : selectedMode === "meteor"
      ? "dd-mode-meteor"
      : "dd-mode-supernova",
    selectedTrail === "aurora"
      ? "dd-lane-trail-aurora"
      : "dd-lane-trail-stars",
    laneShake ? "dd-lane-shake" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const xpFillClassNames = [
    "dd-xp-bar-fill",
    levelUpFlash ? "dd-level-up" : "",
  ]
    .filter(Boolean)
    .join(" ");

  /* -------------------- navigation -------------------- */

  function handleBackToGamerMode() {
    navigate("/gamer-mode");
  }

  function handleRunItBack() {
    resetGameState(false);
    setIsGameOver(false);
    setIsIntro(false);
    setShowCountdown(true);
    setCountdownValue(3);
  }

  /* -------------------- render sections -------------------- */

  const renderHearts = () => {
    const hearts = [];
    for (let i = 0; i < TOTAL_HEARTS; i++) {
      const lost = i >= heartsLeft;
      hearts.push(
        <span
          key={i}
          className={lost ? "dd-heart-lost" : "dd-heart"}
        >
          {lost ? "♡" : "❤️"}
        </span>
      );
    }
    return <div className="dd-hearts-row">{hearts}</div>;
  };

  const renderIntro = () => (
    <>
      <h1 className="dd-title">Divine Descent</h1>
      <p className="dd-subtitle">
        Catch the{" "}
        <span className="dd-highlight">Names of Allah</span> as they
        descend. Tap the meaning before they drift away.
      </p>
      <p className="dd-run-tagline">
        Build streaks, level up your orbit, and make every catch count.
      </p>

      <div className="dd-hud" style={{ marginTop: 14 }}>
        <div className="dd-hud-col">
          <span className="dd-hud-label">Best</span>
          <span className="dd-hud-value">{bestScore}</span>
        </div>
        <div className="dd-hud-col">
          <span className="dd-hud-label">Level</span>
          <span className="dd-hud-value">{level}</span>
        </div>
        <div className="dd-hud-col">
          <span className="dd-hud-label">Max Streak</span>
          <span className="dd-hud-value">{maxStreak}</span>
        </div>
      </div>

      <div className="dd-customize-panel">
        <div className="dd-customize-section">
          <div className="dd-customize-heading">Orbit Speed</div>
          <div className="dd-customize-options">
            <button
              type="button"
              className={
                selectedMode === "calm"
                  ? "dd-customize-option dd-customize-option-active"
                  : "dd-customize-option"
              }
              onClick={() => setSelectedMode("calm")}
            >
              Calm
              <span className="dd-customize-locked">Chill pace</span>
            </button>
            <button
              type="button"
              className={
                selectedMode === "meteor"
                  ? "dd-customize-option dd-customize-option-active"
                  : "dd-customize-option"
              }
              onClick={() => setSelectedMode("meteor")}
            >
              Meteor
              <span className="dd-customize-locked">
                Faster descent
              </span>
            </button>
            <button
              type="button"
              className={
                selectedMode === "supernova"
                  ? "dd-customize-option dd-customize-option-active"
                  : "dd-customize-option"
              }
              onClick={() => setSelectedMode("supernova")}
            >
              Supernova
              <span className="dd-customize-locked">High intensity</span>
            </button>
          </div>
        </div>

        <div className="dd-customize-section">
          <div className="dd-customize-heading">Trail Style</div>
          <div className="dd-customize-options">
            <button
              type="button"
              className={
                selectedTrail === "stars"
                  ? "dd-customize-option dd-customize-option-active"
                  : "dd-customize-option"
              }
              onClick={() => setSelectedTrail("stars")}
            >
              Starfield
              <span className="dd-customize-locked">Classic</span>
            </button>
            <button
              type="button"
              className={
                selectedTrail === "aurora"
                  ? "dd-customize-option dd-customize-option-active"
                  : "dd-customize-option"
              }
              onClick={() => setSelectedTrail("aurora")}
            >
              Aurora
              <span className="dd-customize-locked">Soft glow</span>
            </button>
          </div>
        </div>

        <div className="dd-customize-section">
          <div className="dd-customize-heading">Guardian Angels</div>
          <div className="dd-customize-options">
            <button
              type="button"
              className={
                selectedAngel === "angel"
                  ? "dd-customize-option dd-customize-option-active"
                  : "dd-customize-option"
              }
              onClick={() => setSelectedAngel("angel")}
            >
              👼 Pair
              <span className="dd-customize-locked">
                Angel with wings
              </span>
            </button>
            <button
              type="button"
              className={
                selectedAngel === "star"
                  ? "dd-customize-option dd-customize-option-active"
                  : "dd-customize-option"
              }
              onClick={() => setSelectedAngel("star")}
            >
              ⭐ Stars
              <span className="dd-customize-locked">Bright guardian</span>
            </button>
            <button
              type="button"
              className={
                selectedAngel === "moon"
                  ? "dd-customize-option dd-customize-option-active"
                  : "dd-customize-option"
              }
              onClick={() => setSelectedAngel("moon")}
            >
              🌙 Moon
              <span className="dd-customize-locked">Calm guardian</span>
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="dd-primary-button"
        onClick={handleStartFromIntro}
        style={{ marginTop: 10 }}
      >
        Start Descent
      </button>
      <button
        type="button"
        className="dd-tertiary-button"
        onClick={handleBackToGamerMode}
      >
        ⬅ Back to Gamer Mode
      </button>
    </>
  );

  const renderCountdown = () => (
    <>
      <h1 className="dd-title">Ready?</h1>
      <p className="dd-subtitle">
        Catch the meaning before the Name reaches the bottom.
      </p>
      <div style={{ marginTop: 24, marginBottom: 10 }}>
        <div className="dd-countdown-circle">{countdownValue}</div>
      </div>
    </>
  );

  const renderHud = () => (
    <>
      <div className="dd-hud">
        <div className="dd-hud-col">
          <span className="dd-hud-label">Score</span>
          <span className="dd-hud-value">{score}</span>
        </div>
        <div className="dd-hud-col">
          <span className="dd-hud-label">Best</span>
          <span className="dd-hud-value">{bestScore}</span>
        </div>
        <div className="dd-hud-col">
          <span className="dd-hud-label">Streak</span>
          <span className="dd-hud-value">{streak}</span>
        </div>
      </div>

      <div className="dd-xp-mini">
        <span className="dd-xp-mini-label">
          Lv {level} · {levelTag}
        </span>
        <div className="dd-xp-bar dd-xp-bar-mini">
          <div
            className={xpFillClassNames}
            style={{ width: `${xpProgress}%` }}
          />
        </div>
      </div>

      {renderHearts()}
    </>
  );

  const renderGameplay = () => (
    <>
      {renderHud()}

      <div className="dd-game-controls"><button type="button" className="dd-pause-button" onClick={() => setIsPaused((value) => !value)}>{isPaused ? "Resume" : "Pause"}</button></div>

      <div className={laneClassNames}>
        {/* Cosmic FX layer */}
        <div className="dd-cosmic-layer">
          <div className="dd-blackhole dd-blackhole-1" />
          <div className="dd-blackhole dd-blackhole-2" />
          <div className="dd-shooting-star dd-shooting-star-1" />
          <div className="dd-shooting-star dd-shooting-star-2" />
          <div className="dd-rocket" />
        </div>

        {/* Feedback banner */}
        {banner && (
          <div
            className={
              banner.type === "correct"
                ? "dd-banner dd-banner-correct"
                : banner.type === "wrong"
                ? "dd-banner dd-banner-wrong"
                : "dd-banner dd-banner-streak"
            }
          >
            {banner.text}
          </div>
        )}

        {/* Falling word + angels */}
        <div
          className="dd-falling-name-card"
          style={{ top: `${fallY}%` }}
        >
          <div className="dd-falling-row">
            <span className="dd-angel dd-angel-left">{angelChar}</span>
            <span className="dd-falling-name-text">
              {currentName.name}
            </span>
            <span className="dd-angel dd-angel-right">{angelChar}</span>
          </div>
        </div>
      </div>

      <div className="dd-options" style={{ marginTop: 12 }}>
        {options.map((opt, idx) => (
          <button
            key={`${opt.text}-${idx}`}
            type="button"
            className="dd-option-button"
            onClick={() => handleOptionClick(opt)}
            disabled={isPaused}
          >
            {opt.text}
          </button>
        ))}
      </div>
      {isPaused && <div className="dd-pause-overlay" role="dialog" aria-modal="true"><strong>Descent paused</strong><span>The Name will remain in place.</span><button type="button" className="dd-primary-button" onClick={() => setIsPaused(false)}>Resume descent</button></div>}
    </>
  );

  const renderGameOver = () => (
    <>
      <h1 className="dd-title">Run Complete</h1>
      <p className="dd-subtitle">
        Beautiful effort. Review the Names you missed, then try again.
      </p>

      <div className="dd-summary-grid">
        <div className="dd-summary-item">
          <span className="dd-summary-label">Score</span>
          <span className="dd-summary-value">{score}</span>
        </div>
        <div className="dd-summary-item">
          <span className="dd-summary-label">Best Score</span>
          <span className="dd-summary-value">{bestScore}</span>
        </div>
        <div className="dd-summary-item">
          <span className="dd-summary-label">Max Streak</span>
          <span className="dd-summary-value">{maxStreak}</span>
        </div>
        <div className="dd-summary-item">
          <span className="dd-summary-label">Accuracy</span>
          <span className="dd-summary-value">{accuracy}%</span>
        </div>
      </div>

      <div className="dd-struggle-block">
        <div className="dd-struggle-title">
          Names to review next time
        </div>
        {struggledNames.length === 0 ? (
          <p className="dd-struggle-meaning">
            You didn’t miss any enough to track here. Mashallah!
          </p>
        ) : (
          <ul className="dd-struggle-list">
            {struggledNames.map((n) => (
              <li key={n.name} className="dd-struggle-item">
                <span className="dd-struggle-name">{n.name}</span>
                <span className="dd-struggle-meaning">
                  {n.meaning}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="dd-gameover-actions">
        <button
          type="button"
          className="dd-primary-button"
          onClick={handleRunItBack}
        >
          🔁 Run it back
        </button>
        <button
          type="button"
          className="dd-secondary-button"
          onClick={handleBackToGamerMode}
        >
          ⬅ Back to Gamer Mode
        </button>
      </div>
      <NextStepCard context="divine_descent" hasMistakes={struggledNames.length > 0} />
    </>
  );

  /* -------------------- main render -------------------- */

  return (
    <div className="divine-descent-page">
      <div className="dd-overlay-gradient" />
      <div
        className={`dd-card ${
          isGameOver ? "dd-gameover" : ""
        } ${isIntro || showCountdown ? "dd-center" : ""}`}
      >
        {isIntro
          ? renderIntro()
          : isGameOver
          ? renderGameOver()
          : showCountdown
          ? renderCountdown()
          : renderGameplay()}
      </div>
    </div>
  );
}

export default DivineDescentGame;
