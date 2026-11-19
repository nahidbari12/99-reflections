import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import names from "../data/names";
import { buildSmartSession, getNameState, loadProfile, nameId, recordNameAttempt } from "../utils/learningProfile";
import LearningNav from "./LearningNav";
import NextStepCard from "./NextStepCard";
import { trackEvent } from "../utils/analytics";
import { markDailyStep } from "../utils/dailyEngagement";
import "../styles/LearningJourney.css";

function choicesFor(card, reverse) {
  const correct = reverse ? card.name : card.meaning;
  const others = names.filter((n) => nameId(n) !== nameId(card)).sort(() => Math.random() - 0.5).slice(0, 3).map((n) => reverse ? n.name : n.meaning);
  return [correct, ...others].sort(() => Math.random() - 0.5);
}

export default function SmartLearn() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const focusedIndex = Number(searchParams.get("focus"));
  const focusedCard = Number.isInteger(focusedIndex) && names[focusedIndex] ? names[focusedIndex] : null;
  const [minutes, setMinutes] = useState(loadProfile().goalMinutes || 7);
  const [session, setSession] = useState(() => focusedCard ? [focusedCard] : null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const current = session?.[index];
  const isFocusedReview = Boolean(focusedCard && session?.length === 1 && current === focusedCard);
  const state = current ? getNameState(loadProfile(), current) : "new";
  const exposure = state === "new" || isFocusedReview;
  const reverse = !exposure && (index % 2 === 1 || state === "familiar");
  const options = useMemo(() => current && !exposure ? choicesFor(current, reverse) : [], [current, exposure, reverse]);
  const correctText = current ? (reverse ? current.name : current.meaning) : "";

  const start = () => { setSession(buildSmartSession(minutes)); setIndex(0); setScore(0); setSelected(null); setFinished(false); trackEvent("learning_session_start", { minutes }); };
  const advance = (correct, rating = "good") => {
    recordNameAttempt(current, correct, { rating, source: "smart-learn", seconds: 35 });
    if (correct) setScore((s) => s + 1);
    if (index + 1 >= session.length) { markDailyStep("learn", 35); setFinished(true); trackEvent("learning_session_complete", { minutes, total_names: session.length, strong_responses: score + (correct ? 1 : 0) }); }
    else { setIndex((i) => i + 1); setSelected(null); }
  };

  if (!session) return (
    <div className="journey-page"><main className="journey-shell compact-shell">
      <button className="journey-back" onClick={() => navigate("/learning-mode")}>← Learning journey</button>
      <div className="journey-eyebrow">PERSONALIZED PRACTICE</div>
      <h1>Smart Learn</h1><p className="journey-lead">A focused session that mixes new Names with the ones your memory needs today.</p>
      <div className="time-options" role="group" aria-label="Session length">
        {[5, 10, 15].map((m) => <button key={m} className={minutes === m ? "active" : ""} onClick={() => setMinutes(m)}><strong>{m}</strong><span>minutes</span></button>)}
      </div>
      <section className="session-preview"><h2>Your session will adapt</h2><div><span>◌</span><p><strong>Review first</strong><small>Due and difficult Names rise to the top.</small></p></div><div><span>◇</span><p><strong>Build recall</strong><small>Questions get harder as your mastery grows.</small></p></div><div><span>✦</span><p><strong>Remember longer</strong><small>Every answer schedules the next useful review.</small></p></div></section>
      <button className="journey-primary wide" onClick={start}>Begin {minutes}-minute session →</button>
    </main><LearningNav /></div>
  );

  if (finished) return (
    <div className="journey-page"><main className="journey-shell compact-shell result-shell"><div className="result-orb">✦</div><div className="journey-eyebrow">SESSION COMPLETE</div><h1>MashaAllah</h1><p>You strengthened {session.length} Names and answered {score} confidently.</p><div className="result-score"><strong>{score}/{session.length}</strong><span>strong responses</span></div><button className="journey-primary wide" onClick={start}>Practice another session</button><button className="journey-secondary wide" onClick={() => navigate("/learning-progress")}>See my progress</button><NextStepCard context="smart_learn" hasMistakes={score < session.length} /></main><LearningNav /></div>
  );

  return (
    <div className="journey-page"><main className="journey-shell compact-shell practice-shell">
      <div className="practice-top"><button className="icon-close" onClick={() => navigate("/learning-mode")} aria-label="End session">×</button><div className="practice-track"><span style={{ width: `${((index + 1) / session.length) * 100}%` }} /></div><small>{index + 1}/{session.length}</small></div>
      <div className="practice-type">{isFocusedReview ? "CROSSWORD REVIEW" : exposure ? "NEW NAME" : reverse ? "REVERSE RECALL" : "MEANING CHECK"}</div>
      {exposure ? <section className="learn-card"><div className="learn-arabic" lang="ar" dir="rtl">{current.arabic}</div><h1>{current.name}</h1><p>{current.meaning}</p><small>Read it, say it, and connect the Name to its meaning.</small></section> : <><h1 className="question-title">{reverse ? `Which Name means “${current.meaning}”?` : `What does ${current.name} mean?`}</h1><div className="answer-list">{options.map((option) => { const answered = selected !== null; const cls = answered && option === correctText ? "correct" : answered && option === selected ? "wrong" : ""; return <button className={cls} key={option} disabled={answered} onClick={() => setSelected(option)}>{option}</button>; })}</div>{selected && <div className={`answer-feedback ${selected === correctText ? "correct" : "wrong"}`}>{selected === correctText ? "Correct — well remembered." : `The answer is ${correctText}.`}<button onClick={() => advance(selected === correctText, selected === correctText ? "good" : "again")}>Continue →</button></div>}</>}
      {exposure && <div className="memory-actions"><span>How did this feel?</span><button onClick={() => advance(false, "again")}>Again</button><button onClick={() => advance(true, "hard")}>Hard</button><button onClick={() => advance(true, "good")}>Got it</button><button onClick={() => advance(true, "easy")}>Easy</button></div>}
    </main></div>
  );
}
