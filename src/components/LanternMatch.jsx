import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import namesOfAllah from "../data/names";
import { loadGameStats, recordGameAttempt, saveGameResult, shuffle } from "../utils/gameUtils";
import { localDateKey } from "../utils/learningProfile";
import NextStepCard from "./NextStepCard";
import "../styles/LanternMatch.css";

export const LANTERN_LEVELS = {
  easy: { label: "Easy", pairs: 3, mode: "name-meaning", detail: "Name ↔ meaning", icon: "🌱" },
  medium: { label: "Medium", pairs: 6, mode: "arabic-name", detail: "Arabic ↔ transliteration", icon: "🌙" },
  hard: { label: "Hard", pairs: 10, mode: "arabic-meaning", detail: "Arabic ↔ meaning", icon: "✨" },
  master: { label: "Master", pairs: 8, mode: "audio-meaning", detail: "Audio ↔ meaning", icon: "🎧" },
};

const DAILY_KEY = "reflections_lantern_daily_v1";

function pairFaces(card, mode) {
  if (mode === "arabic-name") return [{ type: "arabic", text: card.arabic }, { type: "name", text: card.name }];
  if (mode === "arabic-meaning") return [{ type: "arabic", text: card.arabic }, { type: "meaning", text: card.meaning }];
  if (mode === "audio-meaning") return [{ type: "audio", text: "Hear Arabic" }, { type: "meaning", text: card.meaning }];
  return [{ type: "name", text: card.name }, { type: "meaning", text: card.meaning }];
}

export function seededRandom(seedText) {
  let seed = 2166136261;
  for (let i = 0; i < seedText.length; i += 1) {
    seed ^= seedText.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }
  return () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildLanternDeck(levelKey = "easy", random = Math.random) {
  const level = LANTERN_LEVELS[levelKey] || LANTERN_LEVELS.easy;
  const chosen = shuffle(namesOfAllah.map((card, sourceIndex) => ({ card, sourceIndex })), random).slice(0, level.pairs);
  const cards = chosen.flatMap(({ card, sourceIndex }) => {
    const pairId = `name-${sourceIndex + 1}`;
    return pairFaces(card, level.mode).map((face, side) => ({
      id: `${pairId}-${side}`,
      pairId,
      source: card,
      ...face,
    }));
  });
  return shuffle(cards, random);
}

export function calculateLanternScore(pairCount, moves, hints, seconds) {
  const extraMoves = Math.max(0, moves - pairCount);
  return Math.max(100, Math.round(1200 - extraMoves * 35 - hints * 80 - seconds * 2));
}

function dailyStreak(completedDate) {
  if (typeof window === "undefined") return 0;
  let dates = [];
  try { dates = JSON.parse(localStorage.getItem(DAILY_KEY) || "[]"); } catch { dates = []; }
  dates = [...new Set([...dates, completedDate])].sort().slice(-120);
  localStorage.setItem(DAILY_KEY, JSON.stringify(dates));
  const completed = new Set(dates);
  const cursor = new Date(`${completedDate}T12:00:00`);
  let streak = 0;
  while (completed.has(localDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function formatTime(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function LanternMatch() {
  const navigate = useNavigate();
  const [levelKey, setLevelKey] = useState("easy");
  const [screen, setScreen] = useState("setup");
  const [isDaily, setIsDaily] = useState(true);
  const [deck, setDeck] = useState([]);
  const [selected, setSelected] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [resolving, setResolving] = useState(false);
  const [moves, setMoves] = useState(0);
  const [hints, setHints] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [hintPair, setHintPair] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [result, setResult] = useState(null);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);
  const revealRef = useRef(null);
  const missedRef = useRef(new Set());

  const level = LANTERN_LEVELS[levelKey];
  const bestScore = loadGameStats()["lantern-match"]?.bestScore || 0;
  const matchedSet = useMemo(() => new Set(matchedPairs), [matchedPairs]);

  useEffect(() => {
    if (screen !== "playing" || paused) return undefined;
    timerRef.current = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timerRef.current);
  }, [screen, paused]);

  useEffect(() => {
    const pauseWhenHidden = () => { if (document.hidden && screen === "playing") setPaused(true); };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => document.removeEventListener("visibilitychange", pauseWhenHidden);
  }, [screen]);

  useEffect(() => () => window.clearTimeout(revealRef.current), []);

  const speak = (card) => {
    if (!card || typeof window === "undefined" || !("speechSynthesis" in window)) {
      setFeedback("Arabic audio is unavailable on this browser. You can still match by meaning.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(card.source.arabic);
    utterance.lang = "ar-SA";
    utterance.rate = 0.72;
    window.speechSynthesis.speak(utterance);
  };

  const startGame = (daily = isDaily) => {
    const random = daily ? seededRandom(`${localDateKey()}-${levelKey}`) : Math.random;
    setDeck(buildLanternDeck(levelKey, random));
    setSelected([]);
    setMatchedPairs([]);
    setMoves(0);
    setHints(0);
    setElapsed(0);
    setHintPair(null);
    setFeedback("");
    setResult(null);
    setResolving(false);
    setPaused(false);
    missedRef.current = new Set();
    setIsDaily(daily);
    setScreen("playing");
  };

  const finishGame = (finalMoves, finalMatched) => {
    const seconds = Math.max(1, elapsed);
    const score = calculateLanternScore(level.pairs, finalMoves, hints, seconds);
    const accuracy = Math.round((level.pairs / Math.max(level.pairs, finalMoves)) * 100);
    const streak = isDaily ? dailyStreak(localDateKey()) : 0;
    window.clearInterval(timerRef.current);
    saveGameResult("lantern-match", { outcome: "complete", score });
    setMatchedPairs(finalMatched);
    setResult({ score, accuracy, streak, seconds, moves: finalMoves, missed: [...missedRef.current] });
    setScreen("results");
  };

  const chooseCard = (card) => {
    if (screen !== "playing" || paused || resolving || hintPair || matchedSet.has(card.pairId)) return;
    if (card.type === "audio") speak(card);
    if (selected.includes(card.id)) return;
    if (selected.length === 0) {
      setSelected([card.id]);
      setFeedback("");
      return;
    }

    const first = deck.find((item) => item.id === selected[0]);
    const nextMoves = moves + 1;
    const isMatch = first?.pairId === card.pairId;
    setMoves(nextMoves);
    setSelected([selected[0], card.id]);
    setResolving(true);

    if (!isMatch) {
      missedRef.current.add(first.pairId);
      missedRef.current.add(card.pairId);
      setFeedback("Not a match yet—notice both cards and try again.");
    } else {
      setFeedback("A beautiful match!");
    }

    revealRef.current = window.setTimeout(() => {
      if (isMatch) {
        const finalMatched = [...matchedPairs, card.pairId];
        recordGameAttempt(card.source, !missedRef.current.has(card.pairId), "lantern-match", Math.max(3, Math.round(elapsed / level.pairs)));
        if (finalMatched.length === level.pairs) {
          finishGame(nextMoves, finalMatched);
          return;
        }
        setMatchedPairs(finalMatched);
      }
      setSelected([]);
      setResolving(false);
    }, isMatch ? 520 : 950);
  };

  const showHint = () => {
    if (paused || resolving || hintPair || screen !== "playing") return;
    const available = [...new Set(deck.map((card) => card.pairId))].filter((pairId) => !matchedSet.has(pairId));
    if (!available.length) return;
    const pairId = available[Math.floor(Math.random() * available.length)];
    missedRef.current.add(pairId);
    setHints((value) => value + 1);
    setHintPair(pairId);
    setFeedback("Hint shown—study the glowing pair.");
    revealRef.current = window.setTimeout(() => setHintPair(null), 1300);
  };

  const shareResult = async () => {
    const text = `🏮 Lantern Match\n${level.pairs} pairs · ${result.moves} moves\nAccuracy: ${result.accuracy}%\nTime: ${formatTime(result.seconds)}${result.streak ? `\n🔥 ${result.streak}-day streak` : ""}`;
    try {
      if (navigator.share) await navigator.share({ title: "Lantern Match", text });
      else if (navigator.clipboard) { await navigator.clipboard.writeText(text); setFeedback("Results copied!"); }
      else setFeedback("Sharing is unavailable on this browser.");
    } catch (error) {
      if (error?.name !== "AbortError") setFeedback("Sharing is unavailable right now.");
    }
  };

  if (screen === "setup") {
    return <main className="lantern-page"><section className="lantern-shell lantern-setup">
      <button className="lantern-back" onClick={() => navigate("/gamer-mode")}>← Gamer Mode</button>
      <div className="lantern-mark" aria-hidden="true">🏮</div>
      <span className="lantern-eyebrow">MEMORY GARDEN</span>
      <h1>Lantern Match</h1>
      <p>Pair each Name with what it means. Every match lights the garden and strengthens your learning journey.</p>
      <div className="lantern-levels" aria-label="Choose difficulty">
        {Object.entries(LANTERN_LEVELS).map(([key, option]) => <button key={key} className={levelKey === key ? "active" : ""} onClick={() => setLevelKey(key)} aria-pressed={levelKey === key}>
          <span>{option.icon}</span><strong>{option.label}</strong><small>{option.pairs} pairs</small><small>{option.detail}</small>
        </button>)}
      </div>
      <div className="lantern-board-choice" role="group" aria-label="Choose board type">
        <button className={isDaily ? "active" : ""} onClick={() => setIsDaily(true)}><strong>Today’s Board</strong><span>Same challenge all day · builds a streak</span></button>
        <button className={!isDaily ? "active" : ""} onClick={() => setIsDaily(false)}><strong>Fresh Board</strong><span>New Names every time</span></button>
      </div>
      <button className="lantern-primary" onClick={() => startGame()}>Light the first lantern →</button>
      {bestScore > 0 && <p className="lantern-best">Personal best: {bestScore} points</p>}
    </section></main>;
  }

  if (screen === "results" && result) {
    const hasMistakes = result.missed.length > 0;
    return <main className="lantern-page"><section className="lantern-shell lantern-results">
      <div className="lantern-garden-complete" aria-hidden="true">🏮 ✨ 🏮 ✨ 🏮</div>
      <span className="lantern-eyebrow">GARDEN COMPLETE</span>
      <h1>You lit every lantern</h1>
      <p>{hasMistakes ? "The Names you worked hardest on are now queued for stronger review." : "A perfect memory round—every pair was recognized cleanly."}</p>
      <div className="lantern-result-grid">
        <div><strong>{result.score}</strong><span>score</span></div><div><strong>{result.accuracy}%</strong><span>accuracy</span></div><div><strong>{result.moves}</strong><span>moves</span></div><div><strong>{formatTime(result.seconds)}</strong><span>time</span></div>
      </div>
      {isDaily && <div className="lantern-streak">🔥 {result.streak}-day Daily Board streak</div>}
      <div className="lantern-result-actions">
        <button className="lantern-primary" onClick={() => startGame(isDaily)}>Play again</button>
        <button className="lantern-secondary" onClick={() => setScreen("setup")}>Change level</button>
        <button className="lantern-secondary" onClick={shareResult}>Share result</button>
        <button className="lantern-quiet" onClick={() => navigate("/gamer-mode")}>Back to Gamer Mode</button>
      </div>
      <div aria-live="polite" className="lantern-feedback">{feedback}</div>
      <NextStepCard context="lantern-match" hasMistakes={hasMistakes} />
    </section></main>;
  }

  return <main className="lantern-page"><section className="lantern-shell">
    <header className="lantern-game-header">
      <div><span className="lantern-eyebrow">{isDaily ? "TODAY’S BOARD" : "FRESH BOARD"}</span><h1>🏮 Lantern Match</h1></div>
      <div className="lantern-header-actions"><button className="lantern-quit" onClick={() => setPaused((value) => !value)}>{paused ? "Resume" : "Pause"}</button><button className="lantern-quit" onClick={() => setScreen("setup")}>Exit game</button></div>
    </header>
    <div className="lantern-stats" aria-label="Game status">
      <span><b>{matchedPairs.length}</b> / {level.pairs} pairs</span><span><b>{moves}</b> moves</span><span><b>{formatTime(elapsed)}</b></span><span>{level.label}</span>
    </div>
    <div className={`lantern-grid lantern-grid-${levelKey}`} role="grid" aria-label={`${level.label} memory board`}>
      {deck.map((card) => {
        const faceUp = selected.includes(card.id) || matchedSet.has(card.pairId) || hintPair === card.pairId;
        const matched = matchedSet.has(card.pairId);
        return <button key={card.id} type="button" role="gridcell" className={`lantern-card ${faceUp ? "face-up" : ""} ${matched ? "matched" : ""} ${hintPair === card.pairId ? "hinted" : ""}`} onClick={() => chooseCard(card)} disabled={matched || paused} aria-label={faceUp ? `${card.type === "audio" ? "Audio for " : ""}${card.type === "audio" ? card.source.name : card.text}${matched ? ", matched" : ""}` : "Hidden lantern"}>
          <span className="lantern-card-inner"><span className="lantern-card-back" aria-hidden={faceUp}>🏮<small>99</small></span><span className={`lantern-card-face ${card.type}`} aria-hidden={!faceUp}>{card.type === "audio" && <b>🔊</b>}<span dir={card.type === "arabic" ? "rtl" : "ltr"}>{card.text}</span>{card.type === "audio" && <small>Tap again to replay</small>}</span></span>
        </button>;
      })}
    </div>
    <div className="lantern-controls">
      <button className="lantern-secondary" onClick={showHint} disabled={resolving || Boolean(hintPair)}>✨ Hint <span>−80</span></button>
      <div className={`lantern-feedback ${feedback.includes("match yet") ? "miss" : ""}`} aria-live="polite">{feedback || "Turn over two lanterns to find a pair."}</div>
    </div>
    {paused && <div className="lantern-pause-overlay" role="dialog" aria-modal="true"><strong>Game paused</strong><span>Your board is exactly where you left it.</span><button className="lantern-primary" onClick={() => setPaused(false)}>Resume matching</button></div>}
  </section></main>;
}
