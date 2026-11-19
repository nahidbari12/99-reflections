import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import namesOfAllah from "../data/names";
import { socket } from "../socket";
import { recordGameAttempt, saveGameResult, shuffle } from "../utils/gameUtils";
import { trackEvent } from "../utils/analytics";
import { localDateKey } from "../utils/learningProfile";
import "../styles/ChallengeMode.css";

export const CHALLENGE_LEVELS = {
  easy: { label: "Easy", icon: "🌙", cardSeconds: 12, optionCount: 3, penalty: 0, questionTypes: ["name-to-meaning"] },
  medium: { label: "Medium", icon: "✨", cardSeconds: 10, optionCount: 4, penalty: 1, questionTypes: ["name-to-meaning", "meaning-to-name"] },
  hard: { label: "Hard", icon: "🔥", cardSeconds: 8, optionCount: 4, penalty: 3, questionTypes: ["name-to-meaning", "meaning-to-name", "arabic-to-name"] },
};

const SESSION_SECONDS = 45;
const DAILY_SESSION_SECONDS = 120;

export function hashSeed(value) {
  let seed = 2166136261;
  for (const char of value) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619);
  return seed >>> 0;
}

export function seededRandom(seed) {
  let value = seed;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildDailyChallengeCards(dateKey) {
  return shuffle(namesOfAllah, seededRandom(hashSeed(`${dateKey}:cards`))).slice(0, 10);
}

export function buildChallengeQuestion(card, difficulty, index, random = Math.random) {
  const level = CHALLENGE_LEVELS[difficulty] || CHALLENGE_LEVELS.easy;
  const type = level.questionTypes[index % level.questionTypes.length];
  const answerKey = type === "name-to-meaning" ? "meaning" : "name";
  const prompt = type === "name-to-meaning" ? card.name : type === "meaning-to-name" ? card.meaning : card.arabic;
  const instruction = type === "name-to-meaning" ? "Choose the correct meaning" : type === "meaning-to-name" ? "Choose the correct Name" : "Identify this Arabic Name";
  const correct = card[answerKey];
  const alternatives = shuffle(namesOfAllah.filter((item) => item.name !== card.name && item[answerKey] !== correct), random).slice(0, level.optionCount - 1);
  return { card, type, prompt, instruction, correct, options: shuffle([correct, ...alternatives.map((item) => item[answerKey])], random) };
}

function ChallengeMode() {
  const navigate = useNavigate();
  const location = useLocation();
  const isDailyChallenge = location.pathname === "/daily-challenge";
  const exitDestination = isDailyChallenge ? "/" : "/learning-mode";
  const dailyKey = isDailyChallenge ? localDateKey() : null;
  const isMultiplayer = location.state?.isMultiplayer || false;
  const roomCode = location.state?.roomCode || null;
  const requestedDifficulty = isDailyChallenge ? "medium" : location.state?.difficulty || "easy";
  const difficulty = CHALLENGE_LEVELS[requestedDifficulty] ? requestedDifficulty : "easy";
  const level = CHALLENGE_LEVELS[difficulty];
  const username = location.state?.username || "Player";
  const reviewNames = Array.isArray(location.state?.reviewNames) ? location.state.reviewNames : [];
  const sessionSeconds = isDailyChallenge ? DAILY_SESSION_SECONDS : SESSION_SECONDS;

  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [question, setQuestion] = useState(null);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [gameTime, setGameTime] = useState(sessionSeconds);
  const [cardTime, setCardTime] = useState(level.cardSeconds);
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [bonusText, setBonusText] = useState("");
  const [isFading, setIsFading] = useState(false);
  const [waiting, setWaiting] = useState(isMultiplayer);
  const [shakeCard, setShakeCard] = useState(false);
  const [opponentUsername, setOpponentUsername] = useState(null);
  const [phase, setPhase] = useState("countdown");
  const [countdown, setCountdown] = useState(3);
  const [pausedAway, setPausedAway] = useState(false);

  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const wrongRef = useRef(0);
  const longestRef = useRef(0);
  const wrongAnswersRef = useRef([]);
  const nextTimeoutRef = useRef(null);
  const endedRef = useRef(false);

  const endGame = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    clearTimeout(nextTimeoutRef.current);
    setPhase("ended");
    saveGameResult(isDailyChallenge ? "daily-challenge" : `challenge-${difficulty}`, { outcome: "complete", score: scoreRef.current });
    trackEvent("challenge_complete", { difficulty, score: scoreRef.current, correct: correctRef.current, wrong: wrongRef.current });
    setIsFading(true);
    window.setTimeout(() => navigate("/results", { state: {
      score: scoreRef.current,
      correct: correctRef.current,
      wrong: wrongRef.current,
      longestStreak: longestRef.current,
      totalQuestions: correctRef.current + wrongRef.current,
      wrongAnswers: wrongAnswersRef.current,
      username,
      difficulty,
      dailyKey,
      isMultiplayer,
      roomCode,
    } }), 450);
  }, [dailyKey, difficulty, isDailyChallenge, isMultiplayer, navigate, roomCode, username]);

  const nextCard = useCallback(() => {
    if (endedRef.current) return;
    if (currentIndex + 1 >= cards.length) {
      endGame();
      return;
    }
    setCurrentIndex((value) => value + 1);
    setCardTime(level.cardSeconds);
    setSelectedOption(null);
    setFeedback(null);
    setBonusText("");
    setPhase("playing");
  }, [cards.length, currentIndex, endGame, level.cardSeconds]);

  const scheduleNext = useCallback((delay = 900) => {
    clearTimeout(nextTimeoutRef.current);
    nextTimeoutRef.current = window.setTimeout(nextCard, delay);
  }, [nextCard]);

  useEffect(() => {
    const selected = reviewNames.length ? namesOfAllah.filter((card) => reviewNames.includes(card.name)) : namesOfAllah;
    const ordered = isDailyChallenge ? buildDailyChallengeCards(dailyKey) : shuffle(selected.length ? selected : namesOfAllah);
    setCards(ordered);
    trackEvent("challenge_start", { difficulty, review_session: reviewNames.length > 0, daily_challenge: isDailyChallenge });
  }, []);

  useEffect(() => {
    if (cards.length) {
      const random = isDailyChallenge ? seededRandom(hashSeed(`${dailyKey}:question:${currentIndex}`)) : Math.random;
      setQuestion(buildChallengeQuestion(cards[currentIndex], difficulty, currentIndex, random));
    }
  }, [cards, currentIndex, dailyKey, difficulty, isDailyChallenge]);

  useEffect(() => {
    if (!isMultiplayer || !roomCode) return undefined;
    socket.emit("joinRoom", { roomCode, username });
    const start = ({ opponentUsername: opponent }) => {
      setWaiting(false);
      setCountdown(3);
      setPhase("countdown");
      if (opponent) setOpponentUsername(opponent);
    };
    const opponentLeft = ({ username: leftUser }) => {
      window.alert(`${leftUser} has left the match.`);
      navigate(exitDestination);
    };
    socket.on("startGame", start);
    socket.on("opponent-left", opponentLeft);
    return () => { socket.off("startGame"); socket.off("opponent-left"); };
  }, [exitDestination, isMultiplayer, navigate, roomCode, username]);

  useEffect(() => {
    if (waiting || phase !== "countdown") return undefined;
    const timer = window.setTimeout(() => {
      if (countdown <= 1) {
        setCountdown(0);
        setPhase("playing");
      } else setCountdown((value) => value - 1);
    }, 700);
    return () => clearTimeout(timer);
  }, [countdown, phase, waiting]);

  useEffect(() => {
    if (phase !== "playing") return undefined;
    const timer = window.setInterval(() => setGameTime((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (gameTime === 0 && phase === "playing") endGame();
  }, [endGame, gameTime, phase]);

  useEffect(() => {
    if (phase !== "playing") return undefined;
    const timer = window.setInterval(() => setCardTime((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [phase, currentIndex]);

  const addMiss = useCallback((selected, timedOut = false) => {
    if (!question) return;
    const miss = { name: question.card.name, prompt: question.prompt, selected: timedOut ? "No answer" : selected, correct: question.correct, questionType: question.type, timedOut };
    wrongAnswersRef.current = [...wrongAnswersRef.current, miss];
    wrongRef.current += 1;
    setWrongCount(wrongRef.current);
  }, [question]);

  useEffect(() => {
    if (cardTime !== 0 || gameTime === 0 || phase !== "playing" || !question || endedRef.current) return;
    setPhase("feedback");
    setSelectedOption(null);
    setStreak(0);
    addMiss(null, true);
    recordGameAttempt(question.card, false, "challenge", level.cardSeconds);
    setFeedback({ correct: false, title: "Time’s up", detail: `${question.card.name} — ${question.correct}` });
    scheduleNext(1100);
  }, [addMiss, cardTime, gameTime, level.cardSeconds, phase, question, scheduleNext]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && phase === "playing") {
        setPausedAway(true);
        setPhase("paused");
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [phase]);

  useEffect(() => () => clearTimeout(nextTimeoutRef.current), []);

  const handleAnswer = (selected) => {
    if (phase !== "playing" || !question || endedRef.current) return;
    setPhase("feedback");
    setSelectedOption(selected);
    const isCorrect = selected === question.correct;
    trackEvent("challenge_answer", { difficulty, question_type: question.type, correct: isCorrect });
    recordGameAttempt(question.card, isCorrect, "challenge", Math.max(1, level.cardSeconds - cardTime));
    if (isCorrect) {
      const speed = cardTime / level.cardSeconds;
      let points = speed >= 0.75 ? 10 : speed >= 0.35 ? 5 : 3;
      const nextStreak = streak + 1;
      let bonus = 0;
      if (nextStreak === 3) bonus = 5;
      else if (nextStreak === 5) bonus = 10;
      else if (nextStreak === 10) bonus = 20;
      points += bonus;
      scoreRef.current += points;
      correctRef.current += 1;
      longestRef.current = Math.max(longestRef.current, nextStreak);
      setScore(scoreRef.current);
      setCorrectCount(correctRef.current);
      setStreak(nextStreak);
      setLongestStreak(longestRef.current);
      setFeedback({ correct: true, title: `Correct · +${points}`, detail: `${question.card.name} — ${question.card.meaning}` });
      if (bonus) setBonusText(`+${bonus} streak bonus`);
      scheduleNext(bonus ? 1300 : 900);
    } else {
      scoreRef.current = Math.max(0, scoreRef.current - level.penalty);
      setScore(scoreRef.current);
      setStreak(0);
      setShakeCard(true);
      window.setTimeout(() => setShakeCard(false), 400);
      addMiss(selected);
      setFeedback({ correct: false, title: level.penalty ? `Not quite · −${level.penalty}` : "Not quite", detail: `${question.card.name} — ${question.card.meaning}` });
      scheduleNext(1200);
    }
  };

  const requestExit = () => {
    if (window.confirm("Exit this challenge? Your current run will not be saved.")) navigate(exitDestination);
  };

  if (waiting) return <div className="challenge-page"><div className="waiting-room"><div className="waiting-title">Waiting for your opponent…</div><p className="waiting-subtext">Share this room code and the match will begin when everyone joins.</p>{roomCode && <div className="waiting-room-code">Room code: <span className="room-pill">{roomCode}</span></div>}{opponentUsername && <div className="player-status">{opponentUsername} joined.</div>}<div className="animated-loader" /><button className="exit-lobby-button" onClick={() => navigate(exitDestination)}>Cancel & Back</button></div></div>;
  if (!question) return <div className="challenge-page">Loading challenge…</div>;

  const answered = correctCount + wrongCount;
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - cardTime / level.cardSeconds);

  return <div className={`challenge-page ${isFading ? "fade-out" : ""}`}>
    <div className="top-bar"><div className="top-bar-left"><div className="timer-chip" aria-label={`${gameTime} seconds remaining`}>⏱ <span>{gameTime}s</span></div><div className={`difficulty-chip ${difficulty}`}>{level.icon} {level.label} Mode</div></div><div className="top-bar-right"><div className="score-box">🏆 <span>{score}</span></div><div className="streak-pill">🔥 <span>{streak}</span></div><button className="pause-button" onClick={() => setPhase("paused")} disabled={phase !== "playing"} aria-label="Pause challenge">Ⅱ</button></div></div>
    <p className="challenge-instruction">{isDailyChallenge ? `Daily Challenge · ${answered + 1} of 10` : question.instruction}{isDailyChallenge && <small>{question.instruction}</small>}</p>
    <div className={`challenge-flashcard ${shakeCard ? "shake" : ""}`}><div className="challenge-content"><h2 className={`challenge-text ${question.type === "arabic-to-name" ? "arabic-prompt" : ""}`} lang={question.type === "arabic-to-name" ? "ar" : undefined} dir={question.type === "arabic-to-name" ? "rtl" : undefined}>{question.prompt}</h2></div><div className="card-footer-row"><div className="question-chip">Q{answered + 1}</div><div className="circle-timer" aria-hidden="true"><svg className="timer-svg" viewBox="0 0 40 40"><circle className="circle-bg" cx="20" cy="20" r={radius} /><circle className="circle" cx="20" cy="20" r={radius} strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} /></svg><span className="card-time-label">{cardTime}s</span></div></div>{bonusText && <div className="bonus-banner">{bonusText}</div>}</div>
    <div className={`answer-options ${question.options.length >= 4 ? "grid-2x2" : ""}`}>{question.options.map((option) => { let className = "answer-button"; if (phase === "feedback" && option === question.correct) className += " correct"; if (phase === "feedback" && selectedOption === option && option !== question.correct) className += " wrong"; return <button key={option} className={className} onClick={() => handleAnswer(option)} disabled={phase !== "playing"}>{option}</button>; })}</div>
    <div className="challenge-feedback" role="status" aria-live="polite">{feedback && <><strong className={feedback.correct ? "feedback-correct" : "feedback-wrong"}>{feedback.title}</strong><span>{feedback.detail}</span></>}</div>
    <button className="back-home-button" onClick={requestExit}>Exit challenge</button>
    {phase === "countdown" && <div className="challenge-overlay" role="status" aria-live="assertive"><div><span>Get ready</span><strong>{countdown || "Go!"}</strong><small>{level.label} · {level.cardSeconds}s per question</small></div></div>}
    {phase === "paused" && <div className="challenge-overlay"><div><span>{pausedAway ? "Paused while you were away" : "Challenge paused"}</span><strong>Ⅱ</strong><button onClick={() => { setPausedAway(false); setPhase("playing"); }}>Resume</button><button className="overlay-exit" onClick={requestExit}>Exit challenge</button></div></div>}
  </div>;
}

export default ChallengeMode;
