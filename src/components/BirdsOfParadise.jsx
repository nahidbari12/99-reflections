// /src/components/BirdsOfParadise.jsx

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import namesOfAllah from "../data/names";
import "../styles/BirdsOfParadise.css";
import { recordGameAttempt, saveGameResult } from "../utils/gameUtils";
import NextStepCard from "./NextStepCard";
import {
  BIRD_COSMETICS,
  BIRD_DIFFICULTIES,
  birdDailyKey,
  birdFeatherRating,
  birdRewardScore,
  birdRouteProfile,
  evaluateBirdMissions,
  getBirdChapter,
  recommendedBirdQuality,
  seededBirdRandom,
} from "../utils/birdsGame";

export { BIRD_DIFFICULTIES } from "../utils/birdsGame";

// Utility for random
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* ============================================================
   SAFELY BUILD QUIZ QUESTIONS
============================================================ */
function buildQuizQuestions() {
  let source = [];
  if (Array.isArray(namesOfAllah)) {
    source = namesOfAllah
      .filter((n) => n)
      .map((n, idx) => ({
        id: n.id ?? idx,
        english: n.english ?? n.name ?? `Name ${idx + 1}`,
        transliteration: n.transliteration,
        meaning: n.meaning ?? "",
      }));
  }

  if (!source || source.length < 2) {
    // fallback set
    return [
      {
        id: 1,
        displayName: "Ar-Rahman",
        options: [
          { text: "The Most Merciful", isCorrect: true },
          { text: "The All-Seeing", isCorrect: false },
        ],
      },
      {
        id: 2,
        displayName: "Ar-Rahim",
        options: [
          { text: "The Especially Merciful", isCorrect: true },
          { text: "The Provider", isCorrect: false },
        ],
      },
      {
        id: 3,
        displayName: "Al-Malik",
        options: [
          { text: "The King", isCorrect: true },
          { text: "The Forgiver", isCorrect: false },
        ],
      },
    ];
  }

  const questions = [];
  const pool = [...source];

  for (let i = 0; i < 3; i++) {
    if (pool.length === 0) break;

    const correctIndex = getRandomInt(0, pool.length - 1);
    const correct = pool.splice(correctIndex, 1)[0];

    const wrongCandidates = source.filter((n) => n.id !== correct.id && n.meaning !== correct.meaning);
    const wrong =
      wrongCandidates.length > 0
        ? wrongCandidates[getRandomInt(0, wrongCandidates.length - 1)]
        : null;

    const correctText =
      correct.meaning || correct.english || `Correct option ${i + 1}`;
    const wrongText =
      (wrong && (wrong.meaning || wrong.english)) ||
      `Alternate option ${i + 1}`;

    const options = [
      { text: correctText, isCorrect: true },
      { text: wrongText, isCorrect: false },
    ];

    if (Math.random() > 0.5) {
      options.reverse();
    }

    questions.push({
      id: correct.id,
      displayName:
        correct.english || correct.transliteration || `Name ${i + 1}`,
      options,
    });
  }

  while (questions.length < 3) {
    const idx = questions.length + 1;
    questions.push({
      id: 1000 + idx,
      displayName: `Fallback ${idx}`,
      options: [
        { text: `Correct fallback ${idx}`, isCorrect: true },
        { text: `Incorrect fallback ${idx}`, isCorrect: false },
      ],
    });
  }

  return questions;
}

/* ============================================================
   LEVEL TITLES (kept for future use if needed)
============================================================ */
function getLevelTitle(level) {
  if (level <= 3) return "Dawn Sky";
  if (level <= 6) return "Gentle Daylight";
  if (level <= 9) return "Golden Sunset";
  if (level <= 12) return "Starry Night";
  if (level <= 20) return "Aurora Horizon";
  return "Gardens of Paradise";
}

/* ============================================================
   TIME OF DAY HELPER (UPDATED WINDOWS)
============================================================ */
function getTimeOfDay() {
  const hour = new Date().getHours(); // 0–23

  if (hour >= 5 && hour < 12) return "morning"; // 5am – 12pm
  if (hour >= 12 && hour < 17) return "afternoon"; // 12pm – 5pm
  if (hour >= 17 && hour < 20) return "evening"; // 5pm – 8pm
  return "night"; // 8pm – 5am
}

/* ============================================================
   MAIN COMPONENT
============================================================ */
export default function BirdsOfParadise() {
  const navigate = useNavigate();

  // Intro screen flag
  const [showIntro, setShowIntro] = useState(true);
  const [showFlightGuide, setShowFlightGuide] = useState(
    () => localStorage.getItem("bop_controls_seen") !== "true"
  );
  const [difficulty, setDifficulty] = useState(
    () => localStorage.getItem("bop_difficulty") || "gentle"
  );
  const [reducedMotion, setReducedMotion] = useState(
    () => localStorage.getItem("bop_reduced_motion") === "true"
  );
  const [soundEnabled, setSoundEnabled] = useState(
    () => localStorage.getItem("bop_sound") !== "false"
  );
  const [hapticsEnabled, setHapticsEnabled] = useState(
    () => localStorage.getItem("bop_haptics") !== "false"
  );
  const [dailyMode, setDailyMode] = useState(false);
  const [trail, setTrail] = useState(() => localStorage.getItem("bop_trail") || "starlight");
  const [collisions, setCollisions] = useState(0);
  const [flightStartedAt, setFlightStartedAt] = useState(null);
  const [flightDuration, setFlightDuration] = useState(0);
  const [achievement, setAchievement] = useState(null);
  const [quality] = useState(() => recommendedBirdQuality({
    reducedMotion: localStorage.getItem("bop_reduced_motion") === "true",
    deviceMemory: navigator.deviceMemory,
    cores: navigator.hardwareConcurrency,
  }));
  const gameAreaRef = useRef(null);

  const [level, setLevel] = useState(() => {
    const saved = Number(localStorage.getItem("bop_level"));
    return Number.isInteger(saved) && saved >= 1 && saved <= 100 ? saved : 1;
  });

  // MODE = quiz OR game
  const [mode, setMode] = useState("quiz");

  // QUIZ STATE
  const [quizQuestions, setQuizQuestions] = useState(() =>
    buildQuizQuestions()
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizCorrectCount, setQuizCorrectCount] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [quizSelectedIndex, setQuizSelectedIndex] = useState(null);
  const quizTransitionRef = useRef(null);

  useEffect(() => () => window.clearTimeout(quizTransitionRef.current), []);

  // GAME STATE (flight)
  const [birdY, setBirdY] = useState(50); // percentage from top
  const [birdVelocity, setBirdVelocity] = useState(0);
  const birdYRef = useRef(50);
  const velocityRef = useRef(0);

  const [obstacles, setObstacles] = useState([]);
  const [gameRunning, setGameRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [levelCleared, setLevelCleared] = useState(false);
  const [gateOpening, setGateOpening] = useState(false);
  const [score, setScore] = useState(0);
  const [collectedStars, setCollectedStars] = useState(0);
  const flightSavedRef = useRef(false);
  const gateOpeningRef = useRef(false);
  const gateTimerRef = useRef(null);

  useEffect(() => () => window.clearTimeout(gateTimerRef.current), []);

  // 🔍 DEBUG: last important event (hit / goal / missed-goal / near-miss)
  const [lastDebugEvent, setLastDebugEvent] = useState(null);

  // 🎮 Juice / UX state
  const [isShaking, setIsShaking] = useState(false);
  const [isFlappingAnim, setIsFlappingAnim] = useState(false);
  const [showNearMiss, setShowNearMiss] = useState(false);
  const [slowMo, setSlowMo] = useState(false);

  // Progress toward goal gate + static gate visibility
  const [goalStartX, setGoalStartX] = useState(null);
  const [progress, setProgress] = useState(0);
  const [showGoalGate, setShowGoalGate] = useState(false);

  // 🕊 Pull motion state: after gate appears + 2 taps
  const [pullToGate, setPullToGate] = useState(false);
  const [tapsAfterGateShown, setTapsAfterGateShown] = useState(0);

  // ⭐ 3-2-1 premium countdown before each level flight
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownValue, setCountdownValue] = useState(3);

  // ⏰ Time of day (for theme + prayer label)
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay());

  useEffect(() => {
    // refresh every minute so if user plays a long time it can shift
    const timer = setInterval(() => {
      setTimeOfDay(getTimeOfDay());
    }, 60 * 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const pauseWhenHidden = () => {
      if (document.hidden && gameRunning && !gameOver && !levelCleared && !gateOpening) {
        setIsPaused(true);
      }
    };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => document.removeEventListener("visibilitychange", pauseWhenHidden);
  }, [gameRunning, gameOver, levelCleared, gateOpening]);

  useEffect(() => {
    ["/images/bow-flight-sprite.png", "/images/heavenly-cloud-column.webp", "/images/heavenly-gate-sprite.png"].forEach((source) => {
      const image = new Image();
      image.src = source;
    });
  }, []);

  // keep refs synced
  useEffect(() => {
    birdYRef.current = birdY;
  }, [birdY]);

  useEffect(() => {
    velocityRef.current = birdVelocity;
  }, [birdVelocity]);

  /* ============================================================
     SMALL UX HELPERS
  ============================================================ */
  const triggerShake = () => {
    if (reducedMotion) return;
    setIsShaking(true);
  };

  const giveHaptic = (pattern = 12) => {
    if (hapticsEnabled && typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  const playSoundCue = (cue = "flap") => {
    if (!soundEnabled || typeof window === "undefined") return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    try {
      const context = new AudioContext();
      const patterns = {
        flap: [[330, .045, 0], [440, .04, .025]],
        star: [[660, .07, 0], [880, .1, .055]],
        near: [[520, .06, 0]],
        hit: [[190, .16, 0], [130, .18, .06]],
        gate: [[523, .18, 0], [659, .18, .12], [784, .3, .24]],
      };
      const notes = patterns[cue] || patterns.flap;
      notes.forEach(([frequency, duration, delay]) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = cue === "hit" ? "sawtooth" : "sine";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.025, context.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + delay + duration);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(context.currentTime + delay);
        oscillator.stop(context.currentTime + delay + duration);
      });
      window.setTimeout(() => context.close(), 700);
    } catch {
      // Audio feedback is optional; gameplay must continue if a browser blocks it.
    }
  };

  const triggerFlapAnim = () => {
    setIsFlappingAnim(true);
  };

  useEffect(() => {
    if (!isShaking) return;
    const t = setTimeout(() => setIsShaking(false), 120);
    return () => clearTimeout(t);
  }, [isShaking]);

  useEffect(() => {
    if (!isFlappingAnim) return;
    const t = setTimeout(() => setIsFlappingAnim(false), 150);
    return () => clearTimeout(t);
  }, [isFlappingAnim]);

  useEffect(() => {
    if (!showNearMiss) return;
    const t = setTimeout(() => setShowNearMiss(false), 500);
    return () => clearTimeout(t);
  }, [showNearMiss]);

  /* ⭐ Countdown effect: run 3-2-1, then start the flight */
  useEffect(() => {
    if (!showCountdown || mode !== "game") return;

    // make sure nothing moves while counting down
    setGameRunning(false);

    setCountdownValue(3);
    let launchTimer;
    const interval = setInterval(() => {
      setCountdownValue((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          launchTimer = window.setTimeout(() => {
            setShowCountdown(false);
            setFlightStartedAt(Date.now());
            setGameRunning(true);
          }, 350);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      window.clearTimeout(launchTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCountdown, mode]);

  /* ============================================================
     QUIZ LOGIC
  ============================================================ */
  const handleQuizOptionClick = (idx) => {
    if (quizCompleted || quizSelectedIndex !== null) return;

    const currentQuestion = quizQuestions[currentQuestionIndex];
    const chosen = currentQuestion.options[idx];

    setQuizSelectedIndex(idx);
    const sourceCard = namesOfAllah.find((item) => (item.id ?? namesOfAllah.indexOf(item)) === currentQuestion.id);
    recordGameAttempt(sourceCard || currentQuestion.displayName, chosen.isCorrect, "birds-of-paradise", 5);

    const nextCorrectCount = chosen.isCorrect
      ? quizCorrectCount + 1
      : quizCorrectCount;

    if (chosen.isCorrect) {
      setQuizCorrectCount(nextCorrectCount);
    }

    quizTransitionRef.current = window.setTimeout(() => {
      if (currentQuestionIndex === quizQuestions.length - 1) {
        setQuizCompleted(true);
        setQuizPassed(nextCorrectCount >= 2);
      } else {
        setCurrentQuestionIndex((prev) => prev + 1);
        setQuizSelectedIndex(null);
      }
    }, 650);
  };

  const resetQuiz = () => {
    setQuizQuestions(buildQuizQuestions());
    setCurrentQuestionIndex(0);
    setQuizCorrectCount(0);
    setQuizCompleted(false);
    setQuizPassed(false);
    setQuizSelectedIndex(null);
    setMode("quiz");
  };

  /* ⭐ Helper: begin a flight with 3-2-1 countdown */
  const beginFlightWithCountdown = () => {
    setMode("game");
    startNewFlight(false); // prepare level, but don't run yet
    if (showFlightGuide) {
      setShowCountdown(false);
      return;
    }
    setShowCountdown(true);
    setCountdownValue(3);
  };

  const handleQuizContinue = () => {
    if (!quizCompleted) return;

    if (quizPassed) {
      // use premium countdown for first flight after quiz
      beginFlightWithCountdown();
    } else {
      resetQuiz();
    }
  };

  const handleBackToGamerMode = () => {
    navigate("/gamer-mode");
  };

  /* ============================================================
     GAME LOGIC (Flight through gates)
  ============================================================ */
  const startNewFlight = (startImmediately = true, difficultyOverride = difficulty) => {
    setBirdY(50);
    setBirdVelocity(0);
    birdYRef.current = 50;
    velocityRef.current = 0;
    setScore(0);
    setCollectedStars(0);
    setCollisions(0);
    setFlightDuration(0);
    setFlightStartedAt(startImmediately ? Date.now() : null);
    setAchievement(null);
    flightSavedRef.current = false;
    setGameOver(false);
    setLevelCleared(false);
    setGateOpening(false);
    gateOpeningRef.current = false;
    window.clearTimeout(gateTimerRef.current);
    setGameRunning(startImmediately);
    setIsPaused(false);
    setLastDebugEvent(null);
    setSlowMo(false);
    setProgress(0);
    setShowGoalGate(false);
    setPullToGate(false);
    setTapsAfterGateShown(0);

    // Progression: early flights are short and forgiving; every two levels
    // adds another cloud passage, up to a still-playable ten-gate journey.
    const routeProfile = birdRouteProfile(level, difficultyOverride);
    const normalGateCount = routeProfile.passageCount;
    const startX = 110;
    const spacing = routeProfile.spacing;
    const gapHeight = routeProfile.gapHeight;

    const nextObstacles = [];

    // 💫 track previous gap center so we can force zig-zags on early levels
    let lastGapCenter = null;

    const random = dailyMode ? seededBirdRandom(`${birdDailyKey()}-${difficultyOverride}`) : Math.random;
    for (let i = 0; i < normalGateCount; i++) {
      let gapStart;

      if (level <= 7) {
        // Guided paths introduce vertical movement gradually instead of
        // producing sudden random jumps that feel unfair on early levels.
        const margin = 5;
        const minCenter = gapHeight / 2 + margin;
        const maxCenter = 100 - gapHeight / 2 - margin;

        if (i === 0 || lastGapCenter == null) {
          // Level 1 begins centered, then deliberately introduces a climb or dip.
          const firstCenter = level === 1 ? 50 : Math.round(minCenter + random() * (maxCenter - minCenter));
          gapStart = firstCenter - gapHeight / 2;
          lastGapCenter = firstCenter;
        } else {
          const minShift = level <= 2 ? 10 : level <= 4 ? 11 : 12;
          const maxShift = level <= 2 ? 15 : level <= 4 ? 17 : 19;
          const desiredDelta = Math.round(minShift + random() * (maxShift - minShift));
          const direction = random() > 0.5 ? 1 : -1;

          let center = lastGapCenter + direction * desiredDelta;

          // Clamp into safe range
          if (center < minCenter) {
            center = lastGapCenter + desiredDelta;
          } else if (center > maxCenter) {
            center = lastGapCenter - desiredDelta;
          }

          // Still too close? Force a stronger move if possible
          if (Math.abs(center - lastGapCenter) < minShift) {
            if (lastGapCenter + minShift <= maxCenter) {
              center = lastGapCenter + minShift;
            } else if (lastGapCenter - minShift >= minCenter) {
              center = lastGapCenter - minShift;
            }
          }

          gapStart = center - gapHeight / 2;
          lastGapCenter = center;
        }
      } else {
        const margin = 4;
        const minCenter = gapHeight / 2 + margin;
        const maxCenter = 100 - gapHeight / 2 - margin;
        const center = Math.round(minCenter + random() * (maxCenter - minCenter));
        gapStart = center - gapHeight / 2;
      }

      nextObstacles.push({
        id: `gate-${i}`,
        x: startX + i * spacing,
        gapStart,
        gapHeight,
        passed: false,
        type: "normal",
        collectibleY: gapStart + gapHeight / 2,
        collected: false,
      });
    }

    // Final GOAL gate – invisible logic gate only (visual is static)
    const goalGapHeight = Math.max(42, gapHeight);
    const goalX = startX + normalGateCount * spacing + 10;

    nextObstacles.push({
      id: "goal-gate",
      x: goalX,
      gapStart: 50 - goalGapHeight / 2,
      gapHeight: goalGapHeight,
      passed: false,
      type: "goal",
    });

    setObstacles(nextObstacles);
    setGoalStartX(goalX);
    // getLevelTitle(level); // kept for future if you want to re-add level labels
  };

  // Bird physics
  useEffect(() => {
    if (mode !== "game" || !gameRunning || isPaused) return;
    let frameId;
    let previousTime = performance.now();
    const animatePhysics = (now) => {
      const frameScale = Math.min(2, (now - previousTime) / 50);
      previousTime = now;
      setBirdVelocity((prevV) => {
        const gravity = (BIRD_DIFFICULTIES[difficulty] || BIRD_DIFFICULTIES.gentle).gravity;
        const slowFactor = slowMo ? 0.6 : 1;
        const nextV = Math.min(3.2 * slowFactor, prevV + gravity * slowFactor * frameScale);
        velocityRef.current = nextV;
        return nextV;
      });

      setBirdY((prevY) => {
        const nextY = Math.min(92, Math.max(8, prevY + velocityRef.current * frameScale));
        birdYRef.current = nextY;
        return nextY;
      });
      frameId = requestAnimationFrame(animatePhysics);
    };
    frameId = requestAnimationFrame(animatePhysics);

    return () => cancelAnimationFrame(frameId);
  }, [mode, gameRunning, slowMo, isPaused, difficulty]);

  // Gates movement + collisions + goal detection (softer top/bottom logic)
  useEffect(() => {
    if (mode !== "game" || !gameRunning || isPaused) return;

    let frameId;
    let previousTime = performance.now();
    const animateWorld = (now) => {
      const frameScale = Math.min(2, (now - previousTime) / 50);
      previousTime = now;
      setObstacles((prev) => {
        if (!prev || prev.length === 0) return prev;

        const baseSpeed = 0.76;
        const speedFromLevel = Math.min(0.74, (level - 1) * 0.045);
        const slowFactor = slowMo ? 0.55 : 1;
        const difficultySpeed = (BIRD_DIFFICULTIES[difficulty] || BIRD_DIFFICULTIES.gentle).speed;
        const stepX = (baseSpeed + speedFromLevel) * difficultySpeed * slowFactor * frameScale;

        // Logic hitbox values
        const gateWidth = 31.2;

        const birdX = 8.5;
        const birdWidth = 20.8;
        const birdCenterXConst = birdX + birdWidth / 2;

        // 🔧 Softer margins so Bow can hug the clouds more
        const safetyMarginTop = 3;
        const safetyMarginBottom = 4;

        const birdTop = birdYRef.current - 6;
        const birdBottom = birdYRef.current + 6;

        const overlapsHorizFor = (movedX) =>
          movedX < birdX + birdWidth && movedX + gateWidth > birdX;

        const birdTopSafe = () => birdTop + safetyMarginTop;
        const birdBottomSafe = () => birdBottom - safetyMarginBottom;

        let hit = false;
        let scored = false;
        let cleared = false;
        let debugEvent = null;
        let triggeredNearMiss = false;
        let goalXCurrent = null;
        let nearGoal = false;
        let collected = 0;

        // Is there any normal gate still AHEAD of the bird?
        let anyGateAheadOfBird = false;

        const updated = prev
          .map((gate) => {
            const movedX = gate.x - stepX;
            const u = { ...gate, x: movedX };

            const overlapsHoriz = overlapsHorizFor(movedX);

            // ----- LOGICAL GAP (slightly taller than the visual one) -----
            const rawGapTop = u.gapStart;
            const rawGapBottom = u.gapStart + u.gapHeight;

            const logicPad = 4; // expand tunnel by ~4% up and down
            const gapTop = Math.max(0, rawGapTop - logicPad);
            const gapBottom = Math.min(100, rawGapBottom + logicPad);

            const birdTopSafeVal = birdTopSafe();
            const birdBottomSafeVal = birdBottomSafe();

            const gateCenterX = movedX + gateWidth / 2;

            if (u.type === "normal") {
              const collectibleNearBird = !u.collected && Math.abs(gateCenterX - birdCenterXConst) < 6;
              if (collectibleNearBird && Math.abs(birdYRef.current - u.collectibleY) < 10) {
                u.collected = true;
                collected += 1;
              }
              // Track if any normal gate is still ahead of the bird
              if (gateCenterX >= birdCenterXConst + 2) {
                anyGateAheadOfBird = true;
              }

              // score when gate center passes behind bird center
              if (!u.passed && gateCenterX < birdCenterXConst) {
                u.passed = true;
                scored = true;
              }

              // Every visible, unpassed cloud remains a real obstacle.
              if (!u.passed && overlapsHoriz) {
                const insideGap =
                  birdTopSafeVal >= gapTop && birdBottomSafeVal <= gapBottom;

                if (!hit && insideGap) {
                  const nearThreshold = 3;
                  const nearTop = Math.abs(birdTopSafeVal - gapTop);
                  const nearBottom = Math.abs(birdBottomSafeVal - gapBottom);

                  if (nearTop < nearThreshold || nearBottom < nearThreshold) {
                    triggeredNearMiss = true;
                    debugEvent = {
                      type: "near-miss",
                      gateId: u.id,
                      gateX: movedX,
                      birdY: birdYRef.current,
                      birdTopSafe: birdTopSafeVal,
                      birdBottomSafe: birdBottomSafeVal,
                      gapTop,
                      gapBottom,
                      level,
                      scoreBeforeNearMiss: score,
                    };
                  }
                }

                // 💥 Only count as a hit if we are clearly outside the expanded tunnel
                if (birdTopSafeVal < gapTop || birdBottomSafeVal > gapBottom) {
                  hit = true;
                  debugEvent = {
                    type: "hit",
                    gateId: u.id,
                    gateX: movedX,
                    birdY: birdYRef.current,
                    birdTopSafe: birdTopSafeVal,
                    birdBottomSafe: birdBottomSafeVal,
                    gapTop,
                    gapBottom,
                    level,
                    scoreBeforeHit: score,
                  };
                  triggerShake();
                }
              }
            } else if (u.type === "goal") {
              const gateRight = movedX + gateWidth;
              goalXCurrent = movedX;

              if (goalStartX != null) {
                const totalDist = goalStartX - birdX;
                const currentDist = movedX - birdX;
                if (totalDist > 0 && currentDist / totalDist < 0.2) {
                  nearGoal = true;
                }
              }

              if (overlapsHoriz) {
                // 💛 More forgiving goal zone, using expanded gap
                const goalTop = gapTop - 8;
                const goalBottom = gapBottom + 8;

                const birdTopHit = birdTop; // raw bird edges
                const birdBottomHit = birdBottom;

                const touchesVert =
                  birdBottomHit > goalTop && birdTopHit < goalBottom;

                const progressedEnough =
                  gateCenterX <= birdCenterXConst || nearGoal;

                if (touchesVert && progressedEnough) {
                  cleared = true;
                  u.passed = true;
                  debugEvent = {
                    type: "goal",
                    gateId: u.id,
                    gateX: movedX,
                    birdY: birdYRef.current,
                    birdTopHit,
                    birdBottomHit,
                    goalTop,
                    goalBottom,
                    birdCenterX: birdCenterXConst,
                    gateCenterX,
                    level,
                    finalScore: score,
                  };
                  triggerShake();
                }
              }

              // Missing the glowing goal is a failed flight, not a free clear.
              if (!cleared && !u.passed && gateRight < birdX) {
                hit = true;
                u.passed = true;
                debugEvent = {
                  type: "missed-goal",
                  gateId: u.id,
                  gateX: movedX,
                  birdY: birdYRef.current,
                  gateRight,
                  birdX,
                  level,
                  scoreBeforeAutoGoal: score,
                };
                triggerShake();
              }
            }

            return u;
          })
          .filter((g) => g.x > -40);

        // update progress bar based on logical goal position
        if (goalStartX != null && goalXCurrent != null) {
          const birdXConst = 8.5;
          const denom = goalStartX - birdXConst;
          if (denom > 0) {
            const num = Math.min(denom, goalStartX - goalXCurrent);
            const p = Math.max(0, num / denom);
            setProgress(p);
          }
        }

        // Static goal gate appears when:
        //  - level is cleared, OR
        //  - there are no normal cloud gates ahead of the bird anymore
        if (!anyGateAheadOfBird && !gateOpeningRef.current) {
          cleared = true;
          debugEvent = {
            type: "final-approach",
            level,
            finalScore: score,
            birdY: birdYRef.current,
          };
        }

        if (cleared || !anyGateAheadOfBird) {
          setShowGoalGate(true);
        }

        setSlowMo(nearGoal);

        if (scored) {
          setScore((s) => s + 1);
        }

        if (collected) {
          setCollectedStars((value) => value + collected);
          playSoundCue("star");
          giveHaptic(8);
        }

        if (triggeredNearMiss) {
          setShowNearMiss(true);
          playSoundCue("near");
        }

        if (debugEvent) {
          setLastDebugEvent(debugEvent);
        }

        if (hit) {
          setGateOpening(false);
          gateOpeningRef.current = false;
          setGameOver(true);
          setLevelCleared(false);
          setGameRunning(false);
          setCollisions((value) => value + 1);
          setFlightDuration(flightStartedAt ? Math.max(1, Math.round((Date.now() - flightStartedAt) / 1000)) : 0);
          playSoundCue("hit");
          giveHaptic([35, 30, 35]);
        }

        if (cleared) {
          if (!gateOpeningRef.current) {
            gateOpeningRef.current = true;
            setGateOpening(true);
            setPullToGate(true);
            setGameOver(false);
            setGameRunning(false);
            setProgress(1);
            setFlightDuration(flightStartedAt ? Math.max(1, Math.round((Date.now() - flightStartedAt) / 1000)) : 0);
            playSoundCue("gate");
            giveHaptic([15, 35, 20]);
            gateTimerRef.current = window.setTimeout(() => {
              setGateOpening(false);
              setLevelCleared(true);
            }, 1600);
          }
        }

        return updated;
      });
      frameId = requestAnimationFrame(animateWorld);
    };
    frameId = requestAnimationFrame(animateWorld);

    return () => cancelAnimationFrame(frameId);
  }, [mode, gameRunning, level, goalStartX, slowMo, showGoalGate, isPaused, difficulty, soundEnabled, hapticsEnabled, flightStartedAt]);

  useEffect(() => {
    if (flightSavedRef.current || (!gameOver && !levelCleared)) return;
    flightSavedRef.current = true;
    const rewardScore = birdRewardScore({ passages: score, stars: collectedStars, cleared: levelCleared, difficulty });
    saveGameResult("birds-of-paradise", { outcome: levelCleared ? "win" : "loss", score: rewardScore });
    if (levelCleared) {
      const unlocked = collectedStars >= obstacles.filter((item) => item.type === "normal").length ? "Perfect Passage" : "Heavenly Arrival";
      setAchievement(unlocked);
      localStorage.setItem(`bop_achievement_${unlocked.toLowerCase().replaceAll(" ", "_")}`, "true");
      if (dailyMode) localStorage.setItem(`bop_daily_${birdDailyKey()}`, String(rewardScore));
    }
  }, [gameOver, levelCleared, score, collectedStars, difficulty, dailyMode]);

  /* ✅ UPDATED: lock bird during countdown */
  const handleFlap = () => {
    if (mode !== "game") return;
    if (showCountdown) return; // no movement while 3-2-1 is on screen
    if (isPaused) return;
    if (levelCleared || gateOpening) return;

    if (gameOver) {
      // Restart flight with 3-2-1 countdown as well
      beginFlightWithCountdown();
      return;
    }

    // Count taps AFTER the gate is visible; on 2nd tap, trigger pull motion
    if (showGoalGate && !pullToGate) {
      setTapsAfterGateShown((prev) => {
        const next = prev + 1;
        if (next >= 2) {
          setPullToGate(true);
        }
        return next;
      });
    }

    setGameRunning(true);
    if (!flightStartedAt) setFlightStartedAt(Date.now());
    triggerFlapAnim();
    playSoundCue("flap");

    setBirdVelocity(() => {
      const flapStrength = (BIRD_DIFFICULTIES[difficulty] || BIRD_DIFFICULTIES.gentle).flap;
      velocityRef.current = flapStrength;
      return flapStrength;
    });
  };

  const handleCompleteLevel = () => {
    const next = level === 100 ? 1 : level + 1;
    setLevel(next);
    localStorage.setItem("bop_level", String(next));
    resetQuiz();
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if (mode !== "game" || ![" ", "ArrowUp", "w", "W"].includes(event.key)) return;
      event.preventDefault();
      handleFlap();
    };
    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const updateSetting = (key, value, setter) => {
    setter(value);
    localStorage.setItem(key, String(value));
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await gameAreaRef.current?.requestFullscreen?.();
    } catch {
      // Fullscreen is an enhancement and may be unavailable in embedded browsers.
    }
  };

  /* ============================================================
     RENDERS
  ============================================================ */

  // 🔔 Prayer label mapped to timeOfDay
  const isFridayAfternoon =
    timeOfDay === "afternoon" && new Date().getDay() === 5;

  const prayerLabel =
    {
      morning: "Fajr / Sunrise",
      afternoon: isFridayAfternoon ? "Jummah / Asr" : "Dhuhr / Asr",
      evening: "Maghrib",
      night: "Isha",
    }[timeOfDay] || "";

  const timeOfDayLabel =
    {
      morning: "Morning",
      afternoon: "Afternoon",
      evening: "Evening",
      night: "Starry Night",
    }[timeOfDay] || "Sky";

  const timeOfDayIcon =
    timeOfDay === "night"
      ? "🌙"
      : timeOfDay === "evening"
      ? "🌅"
      : "☀️";

  // Intro card
  const renderIntroCard = () => {
    if (!showIntro) return null;

    return (
      <div className="birds-quiz-card birds-intro-card">
        <div className="birds-quiz-badge">Meet Bow</div>
        <h2 className="birds-quiz-title">
          Help Bow reach the gardens of Paradise
        </h2>
        <p className="birds-quiz-subtitle">
          Help Bow the bird navigate cloud obstacles and glide through the
          gates to reach the lush gardens of Paradise. Each journey begins by
          remembering the Beautiful Names of Allāh ﷻ.
        </p>

        <div
          style={{
            display: "flex",
            gap: 14,
            alignItems: "center",
            margin: "10px 0 6px",
          }}
        >
          <div style={{ width: 70, height: 70 }}>
            <div className="dove-sprite" />
          </div>
          <div style={{ fontSize: "0.85rem", color: "#e5e7eb" }}>
            <div>• Tap the sky, press Space, ↑, or W to flap</div>
            <div>• Glide gently through the cloud gates</div>
            <div>• Collect stars and reach the glowing gate</div>
          </div>
        </div>

        <fieldset className="birds-difficulty-picker">
          <legend>Choose your flight</legend>
          {Object.entries(BIRD_DIFFICULTIES).map(([value, config]) => (
            <button
              type="button"
              key={value}
              className={difficulty === value ? "selected" : ""}
              aria-pressed={difficulty === value}
              onClick={() => {
                setDifficulty(value);
                localStorage.setItem("bop_difficulty", value);
              }}
            >
              <strong>{config.label}</strong>
              <span>{value === "gentle" ? "Wide gaps" : value === "steady" ? "Balanced" : "Fast + precise"}</span>
            </button>
          ))}
        </fieldset>

        <label className="birds-daily-toggle">
          <input type="checkbox" checked={dailyMode} onChange={(event) => setDailyMode(event.target.checked)} />
          <span><strong>Daily Flight</strong> Same cloud course for everyone today</span>
        </label>

        <button
          className="birds-primary-btn"
          onClick={() => setShowIntro(false)}
        >
          🌈 Got it — start my journey
        </button>
      </div>
    );
  };

  const renderQuizSection = () => {
    if (!quizCompleted) {
      const q = quizQuestions[currentQuestionIndex];

      return (
        <div className="birds-quiz-card birds-quiz-card-enter">
          {/* was "Heavenly Gate • Quiz" */}
          <div className="birds-quiz-badge">Paradise Gate • Quiz</div>
          <h2 className="birds-quiz-title">🕊 Birds of Paradise</h2>
          <p className="birds-quiz-level">Level {level}</p>
          <p className="birds-quiz-subtitle">
            Answer 2 out of 3 correctly to unlock the next sky.
          </p>

          <div className="birds-quiz-question">
            <p className="birds-quiz-label">Name of Allah:</p>
            <div className="birds-quiz-name">{q.displayName}</div>
          </div>

          <div className="birds-quiz-options">
            {q.options.map((opt, idx) => {
              let optionClass = "birds-quiz-option";
              if (quizSelectedIndex !== null) {
                if (opt.isCorrect) {
                  optionClass += " correct";
                } else if (idx === quizSelectedIndex && !opt.isCorrect) {
                  optionClass += " wrong";
                }
              }

              return (
                <button
                  key={idx}
                  className={optionClass}
                  onClick={() => handleQuizOptionClick(idx)}
                  disabled={quizSelectedIndex !== null}
                >
                  {opt.text}
                </button>
              );
            })}
          </div>

          <div className="birds-quiz-progress">
            Question {currentQuestionIndex + 1} of {quizQuestions.length}
          </div>
        </div>
      );
    }

    return (
      <div className="birds-quiz-card birds-quiz-card-enter">
        <div className="birds-quiz-badge birds-quiz-badge-complete">
          Quiz Complete
        </div>
        <h2 className="birds-quiz-title">🕊 Birds of Paradise</h2>
        <p className="birds-quiz-level">Level {level}</p>
        <p className="birds-quiz-results">
          You answered <span>{quizCorrectCount}</span> out of 3 correctly.
        </p>

        {quizPassed ? (
          <>
            <p className="birds-quiz-message success">
              The gates of light open for your next flight.
            </p>
            <button className="birds-primary-btn" onClick={handleQuizContinue}>
              Begin Flight
            </button>
          </>
        ) : (
          <>
            <p className="birds-quiz-message fail">
              You need at least 2 correct answers. Gently try again.
            </p>
            <button className="birds-primary-btn" onClick={handleQuizContinue}>
              Retry Quiz
            </button>
          </>
        )}

        <button
          className="birds-secondary-btn"
          onClick={handleBackToGamerMode}
        >
          ⬅ Back to Gamer Mode
        </button>
      </div>
    );
  };

  const renderGameSection = () => {
    const tiltAngle = Math.max(-22, Math.min(22, birdVelocity * 8));
    const progressPercent = Math.round(progress * 100);
    const passageCount = birdRouteProfile(level, difficulty).passageCount;
    const challengeLabel = level <= 2 ? "Gentle" : level <= 5 ? "Rising" : level <= 9 ? "Challenging" : "Mastery";
    const difficultyConfig = BIRD_DIFFICULTIES[difficulty] || BIRD_DIFFICULTIES.gentle;
    const rewardScore = birdRewardScore({ passages: score, stars: collectedStars, cleared: levelCleared, difficulty });
    const missions = evaluateBirdMissions({ cleared: levelCleared, stars: collectedStars, totalStars: passageCount, collisions });
    const feathers = birdFeatherRating({ cleared: levelCleared, stars: collectedStars, totalStars: passageCount, collisions });
    const chapter = getBirdChapter(level);

    let statusText = "Active";
    if (isPaused) statusText = "Paused";
    if (gameOver) statusText = "Ended";
    if (gateOpening) statusText = "Entering the gate";
    if (levelCleared) statusText = "Cleared";

    return (
      <div className="birds-game-card">
        <div className="birds-game-header-row">
          <div className="birds-chip birds-chip-soft">
            ☁️ {difficultyConfig.label} Flight • Heaven Run
          </div>
          <label className="birds-inline-difficulty">
            <span>Flight difficulty</span>
            <select
              value={difficulty}
              disabled={gameRunning || showCountdown || gateOpening}
              onChange={(event) => {
                const value = event.target.value;
                setDifficulty(value);
                localStorage.setItem("bop_difficulty", value);
                startNewFlight(false, value);
              }}
              aria-label="Flight difficulty"
            >
              {Object.entries(BIRD_DIFFICULTIES).map(([value, config]) => <option key={value} value={value}>{config.label}</option>)}
            </select>
          </label>
        </div>

        <div
          className={
            "birds-game-area birds-game-placeholder" +
            (isShaking ? " birds-game-area-shake" : "") +
            (slowMo ? " birds-game-area-slowmo" : "") +
            (slowMo ? " birds-camera-focus" : "") +
            (levelCleared ? " birds-game-area-cleared" : "") +
            (gameOver && !levelCleared ? " birds-game-area-failed" : "") +
            ` birds-quality-${quality} birds-chapter-${chapter.className}`
          }
          ref={gameAreaRef}
          onPointerDown={handleFlap}
          onKeyDown={(event) => {
            if ([" ", "Enter", "ArrowUp", "w", "W"].includes(event.key)) {
              event.preventDefault();
              handleFlap();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Flight area. Tap, click, Space, or Enter to flap."
          style={{
            "--bop-parallax-y": `${birdY}%`,
          }}
        >
          {/* cinematic overlays */}
          <div className={`birds-celestial birds-celestial-${timeOfDay}`} aria-hidden="true">
            {timeOfDay === "night" ? <div className="birds-moon"><span /></div> : <div className="birds-sun" />}
          </div>
          <div className="birds-game-vignette" />
          {(timeOfDay === "night" || timeOfDay === "evening") && <div className="birds-game-stars" />}

          {showFlightGuide && !gameRunning && !showCountdown && !gameOver && !levelCleared && (
            <div className="birds-flight-guide" onPointerDown={(event) => event.stopPropagation()}>
              <strong>Ready to fly?</strong>
              <span>Tap anywhere in the sky to flap</span>
              <small>Keyboard: Space · ↑ · W</small>
              <button type="button" onClick={(event) => {
                event.stopPropagation();
                localStorage.setItem("bop_controls_seen", "true");
                setShowFlightGuide(false);
                startNewFlight(false);
                setCountdownValue(3);
                setShowCountdown(true);
              }}>Start flight</button>
            </div>
          )}

          <div className="birds-game-hud">
            {/* ⏰ Time-of-day + prayer label — inline, 1 line pill */}
            <span className="birds-hud-pill birds-hud-pill-time">
              <span className="birds-hud-value">
                {timeOfDayIcon} {timeOfDayLabel}
                {prayerLabel && <> • {prayerLabel}</>}
              </span>
            </span>

            {/* Level pill on the same row */}
            <span className="birds-hud-pill birds-hud-pill-level">
              <span className="birds-hud-label">Level</span>
              <span className="birds-hud-value">{level}</span>
            </span>

            <button
              type="button"
              className="birds-fullscreen-button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => { event.stopPropagation(); toggleFullscreen(); }}
              aria-label="Toggle full-screen flight"
            >⛶</button>

            {gameRunning && !showCountdown && !gateOpening && !gameOver && !levelCleared && (
              <button
                type="button"
                className="birds-pause-button"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => { event.stopPropagation(); setIsPaused((value) => !value); }}
                aria-pressed={isPaused}
              >
                {isPaused ? "▶ Resume" : "Ⅱ Pause"}
              </button>
            )}

            {/* Slow-mo pill UI is removed; only effect remains */}
          </div>

          {/* Bird */}
          <div
            className={
              "birds-game-bird" +
              (isFlappingAnim ? " birds-bird-flap-anim" : "") +
              (gameOver && !levelCleared ? " birds-game-bird-tumble" : "") +
              (gateOpening || levelCleared ? " birds-game-bird-entering" : "") +
              (!gateOpening && !levelCleared && pullToGate ? " birds-game-bird-cleared" : "")
            }
            style={{
              top: `${birdY}%`,
              transform: `translateY(-50%) rotate(${tiltAngle}deg)`,
            }}
          >
            <div className="birds-bird-inner">
              <div
                className={
                  "birds-bird-trail" +
                  (levelCleared ? " birds-bird-trail-cleared" : "") +
                  ` birds-trail-${trail}`
                }
              />
              <div
                className={
                  "dove-sprite" +
                  ((gameRunning || gateOpening) && !gameOver && !levelCleared ? " dove-sprite--flying" : " dove-sprite--resting") +
                  (isFlappingAnim ? " dove-sprite--boost" : "")
                }
                role="img"
                aria-label="Bow the bird"
              />
              <div className="birds-bird-shadow" />
            </div>
          </div>

          {/* ✨ Sparkles around Bow + gate when level is cleared */}
          {levelCleared && (
            <div className="birds-level-sparkles">
              <div className="birds-sparkle birds-sparkle-1" />
              <div className="birds-sparkle birds-sparkle-2" />
              <div className="birds-sparkle birds-sparkle-3" />
              <div className="birds-sparkle birds-sparkle-4" />
              <div className="birds-sparkle birds-sparkle-5" />
              <div className="birds-sparkle birds-sparkle-6" />
              <div className="birds-sparkle birds-sparkle-7" />
              <div className="birds-sparkle birds-sparkle-8" />
            </div>
          )}

          {/* NEAR MISS banner */}
          {showNearMiss && (
            <div className="birds-near-miss-banner">NEAR MISS!</div>
          )}

          {/* Moving normal gates only (goal gate not rendered here) */}
          {obstacles.map((g, gateIndex) => {
            if (g.type === "goal") {
              return null;
            }

            const topHeight = g.gapStart;
            const gapHeight = g.gapHeight;
            const bottomHeight = 100 - (g.gapStart + g.gapHeight);

            return (
              <div
                key={g.id}
                className={`birds-gate birds-cloud-variant-${gateIndex % 3}`}
                style={{ left: `${g.x}%` }}
              >
                <div
                  className="birds-gate-top"
                  style={{ height: `${topHeight}%` }}
                />
                <div
                  className="birds-gate-gap"
                  style={{ height: `${gapHeight}%` }}
                >
                  {!g.collected && <span className="birds-collectible" aria-hidden="true">✦</span>}
                </div>
                <div
                  className="birds-gate-bottom"
                  style={{ height: `${bottomHeight}%` }}
                />
              </div>
            );
          })}

          {/* Static goal gate at the very end */}
          {(showGoalGate || gateOpening || levelCleared) && (
            <div className={"birds-goal-static" + (gateOpening ? " birds-goal-static-opening" : "") + (levelCleared ? " birds-goal-static-open" : "")}>
              <div
                className={
                  "birds-gate-light-rays" +
                  (gateOpening || levelCleared ? " birds-gate-light-rays-active" : "")
                }
              />
              <div
                className={
                  "birds-gate-goal-inner" +
                  (gateOpening ? " birds-gate-goal-inner-opening" : "") +
                  (levelCleared ? " birds-gate-goal-inner-cleared" : "")
                }
              />
            </div>
          )}

          {/* Level-cleared celebration overlay (banner only) */}
          {levelCleared && (
            <div className="birds-level-complete-overlay">
              <div className="birds-level-complete-card">
                <div className="birds-level-complete-text">LEVEL CLEARED</div>
                <span>{collectedStars} stars · {rewardScore} XP</span>
              </div>
            </div>
          )}

          {/* Fail overlay – soft blue banner only */}
          {gameOver && !levelCleared && (
            <div className="birds-fail-overlay">
              <div className="birds-fail-text">SO CLOSE, TRY AGAIN</div>
            </div>
          )}

          {gateOpening && !levelCleared && (
            <div className="birds-final-approach" aria-live="polite">
              <strong>FINAL APPROACH</strong>
              <span>Bow is gliding into the light</span>
            </div>
          )}

          {/* Premium 3-2-1 countdown overlay (before each flight) */}
          {showCountdown && !levelCleared && !gameOver && (
            <div className="birds-countdown-overlay">
              <div className="birds-countdown-circle">
                {countdownValue > 0 ? countdownValue : "FLY!"}
              </div>
            </div>
          )}

          {isPaused && !gameOver && !levelCleared && (
            <div className="birds-pause-overlay">
              <strong>Flight paused</strong>
              <span>Your progress is safe.</span>
              <button type="button" onClick={(event) => { event.stopPropagation(); setIsPaused(false); }}>Resume flight</button>
            </div>
          )}
        </div>

        {/* Progress bar toward goal */}
        <div className="birds-progress-row">
          <div className="birds-progress-label">
            <span>Cloud {Math.min(score + 1, passageCount)} of {passageCount}</span>
            <span>{progressPercent}% to Heavenly Gate</span>
          </div>
          <div className="birds-progress-bar">
            <div
              className="birds-progress-fill"
              style={{ width: progressPercent + "%" }}
            ></div>
          </div>
        </div>

        <div className="birds-game-status">
          <span>
            Flight: <strong>{statusText}</strong>
          </span>
          <span>
            Stars: <strong>✦ {collectedStars}</strong>
          </span>
          <span>
            Reward: <strong>{rewardScore} XP</strong>
          </span>
          <span className="birds-status-challenge">{challengeLabel} route</span>
        </div>

        <div className="birds-chapter-strip">
          <span>{dailyMode ? "DAILY FLIGHT" : `CHAPTER · ${chapter.name}`}</span>
          <strong>{chapter.mechanic}</strong>
        </div>

        <details className="birds-flight-settings">
          <summary>Flight settings</summary>
          <div>
            <label><input type="checkbox" checked={soundEnabled} onChange={(event) => updateSetting("bop_sound", event.target.checked, setSoundEnabled)} /> Sound</label>
            <label><input type="checkbox" checked={hapticsEnabled} onChange={(event) => updateSetting("bop_haptics", event.target.checked, setHapticsEnabled)} /> Vibration</label>
            <label><input type="checkbox" checked={reducedMotion} onChange={(event) => updateSetting("bop_reduced_motion", event.target.checked, setReducedMotion)} /> Reduced motion</label>
            <label>Trail <select value={trail} onChange={(event) => { setTrail(event.target.value); localStorage.setItem("bop_trail", event.target.value); }}>{BIRD_COSMETICS.filter((item) => level >= item.unlockLevel).map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label>
          </div>
        </details>

        {(gameOver || levelCleared) && (
          <section className={`birds-results-card ${levelCleared ? "success" : "failed"}`} aria-live="polite">
            <div className="birds-results-heading">
              <div><span>{levelCleared ? "FLIGHT COMPLETE" : "FLIGHT ENDED"}</span><h3>{levelCleared ? "The gate welcomed Bow" : "Bow is ready to try again"}</h3></div>
              <div className="birds-feathers" aria-label={`${feathers} of 3 golden feathers`}>{[0, 1, 2].map((index) => <span className={index < feathers ? "earned" : ""} key={index}>🪶</span>)}</div>
            </div>
            <div className="birds-results-stats"><span><strong>{collectedStars}/{passageCount}</strong> stars</span><span><strong>{flightDuration || "—"}s</strong> time</span><span><strong>{rewardScore}</strong> XP</span></div>
            <ul>{missions.map((mission) => <li className={mission.complete ? "complete" : ""} key={mission.id}>{mission.complete ? "✓" : "○"} {mission.label}</li>)}</ul>
            {achievement && <div className="birds-achievement-toast">🏆 Achievement unlocked · <strong>{achievement}</strong></div>}
            <div className="birds-results-actions">
              {levelCleared && <button type="button" onClick={handleCompleteLevel}>Next Level →</button>}
              <button type="button" className="secondary" onClick={beginFlightWithCountdown}>{levelCleared ? "Replay Level" : "Try Again"}</button>
            </div>
          </section>
        )}

        {gateOpening ? (
          <button className="birds-primary-btn birds-flap-btn" disabled>
            ✨ Entering the Heavenly Gate…
          </button>
        ) : !levelCleared && !gameOver ? (
          <button
            className="birds-primary-btn birds-flap-btn"
            onClick={handleFlap}
          >
            🕊 Tap to Soar the Skies
          </button>
        ) : null}

        <button
          className="birds-secondary-btn"
          onClick={handleBackToGamerMode}
        >
          ⬅ Back to Gamer Mode
        </button>

        {(gameOver || levelCleared) && <NextStepCard context="birds_of_paradise" hasMistakes={gameOver && !levelCleared} />}

        {/* Debug panel (hidden by CSS in production) */}
        <div className="birds-debug-panel">
          <h4>Debug</h4>
          <div>Mode: {mode}</div>
          <div>Level: {level}</div>
          <div>Bird Y: {birdY.toFixed(1)}%</div>
          <div>Velocity: {birdVelocity.toFixed(2)}</div>
          <div>Score: {score}</div>
          <div>Game Running: {gameRunning ? "yes" : "no"}</div>
          <div>Game Over: {gameOver ? "yes" : "no"}</div>
          <div>Level Cleared: {levelCleared ? "yes" : "no"}</div>
          <div>Gates: {obstacles.length}</div>

          {lastDebugEvent && (
            <div style={{ marginTop: 6 }}>
              <div>Last Event: {lastDebugEvent.type}</div>
              <div>Gate: {lastDebugEvent.gateId}</div>
              <div>
                birdY:{" "}
                {lastDebugEvent.birdY != null
                  ? lastDebugEvent.birdY.toFixed(1)
                  : "–"}{" "}
                | gapTop:{" "}
                {(
                  lastDebugEvent.gapTop ??
                  lastDebugEvent.goalTop ??
                  0
                ).toFixed(1)}{" "}
                | gapBottom:{" "}
                {(
                  lastDebugEvent.gapBottom ??
                  lastDebugEvent.goalBottom ??
                  0
                ).toFixed(1)}
              </div>
              {lastDebugEvent.type === "hit" && (
                <div>
                  birdTopSafe:{" "}
                  {lastDebugEvent.birdTopSafe != null
                    ? lastDebugEvent.birdTopSafe.toFixed(1)
                    : "–"}{" "}
                  | birdBottomSafe:{" "}
                  {lastDebugEvent.birdBottomSafe != null
                    ? lastDebugEvent.birdBottomSafe.toFixed(1)
                    : "–"}
                </div>
              )}
              {lastDebugEvent.type === "goal" && (
                <div>
                  birdTopHit:{" "}
                  {lastDebugEvent.birdTopHit != null
                    ? lastDebugEvent.birdTopHit.toFixed(1)
                    : "–"}{" "}
                  | birdBottomHit:{" "}
                  {lastDebugEvent.birdBottomHit != null
                    ? lastDebugEvent.birdBottomHit.toFixed(1)
                    : "–"}
                  <br />
                  birdCenterX:{" "}
                  {lastDebugEvent.birdCenterX != null
                    ? lastDebugEvent.birdCenterX.toFixed(1)
                    : "–"}{" "}
                  | gateCenterX:{" "}
                  {lastDebugEvent.gateCenterX != null
                    ? lastDebugEvent.gateCenterX.toFixed(1)
                    : "–"}
                </div>
              )}
              {lastDebugEvent.type === "missed-goal" && (
                <div>
                  <div>Missed goal</div>
                  <div>
                    gateRight:{" "}
                    {lastDebugEvent.gateRight != null
                      ? lastDebugEvent.gateRight.toFixed(1)
                      : "–"}
                  </div>
                  <div>
                    birdX:{" "}
                    {lastDebugEvent.birdX != null
                      ? lastDebugEvent.birdX.toFixed(1)
                      : "–"}
                  </div>
                </div>
              )}
              {lastDebugEvent.type === "near-miss" && (
                <div>
                  <div>Near miss at gate</div>
                </div>
              )}
              <div>
                gateX:{" "}
                {lastDebugEvent.gateX != null
                  ? lastDebugEvent.gateX.toFixed(1)
                  : "–"}{" "}
                | level: {lastDebugEvent.level}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const pageClassName = `birds-page theme-${timeOfDay}${reducedMotion ? " birds-reduced-motion" : ""}`;

  return (
    <div className={pageClassName}>
      <div className="birds-page-inner">
        <header className="birds-header">
          <h1>🕊 Birds of Paradise</h1>
          <p>
            Help Bow the bird navigate obstacles to reach the gardens of
            Paradise.
          </p>
        </header>

        {renderIntroCard()}

        {mode === "quiz" && !showIntro ? renderQuizSection() : null}
        {mode === "game" ? renderGameSection() : null}
      </div>
    </div>
  );
}
