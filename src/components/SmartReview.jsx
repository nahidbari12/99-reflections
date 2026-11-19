import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import names from "../data/names";
import { buildReviewQueue, getXpSummary, loadProfile, nameId, recordNameAttempt } from "../utils/learningProfile";
import { markDailyStep } from "../utils/dailyEngagement";
import "../styles/JourneyDashboard.css";

function makeChoices(card, index) {
  const distractors = [];
  names.filter((item) => nameId(item) !== nameId(card)).filter((_, i) => (i + index) % 3 === 0).forEach((item) => {
    if (distractors.length < 3 && item.meaning !== card.meaning && !distractors.includes(item.meaning)) distractors.push(item.meaning);
  });
  return [card.meaning, ...distractors].sort((a, b) => `${a}-${index}`.localeCompare(`${b}-${index}`));
}

export default function SmartReview() {
  const navigate = useNavigate();
  const [queue] = useState(() => buildReviewQueue(loadProfile(), 8));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const item = queue[index];
  const choices = useMemo(() => item ? makeChoices(item.card, index) : [], [item, index]);
  const continueReview = () => {
    const wasCorrect = selected === item.card.meaning;
    recordNameAttempt(item.card, wasCorrect, { source: "smart-review", seconds: 25 });
    if (wasCorrect) setCorrect((value) => value + 1);
    if (index + 1 === queue.length) { markDailyStep("review", 35); setFinished(true); }
    else { setIndex((value) => value + 1); setSelected(null); }
  };
  if (finished) { const earned = correct * 12 + (queue.length - correct) * 3; return <div className="dashboard-page smart-review-page"><main className="review-shell review-complete"><span className="completion-star">✦</span><span className="dashboard-eyebrow">REVIEW COMPLETE</span><h1>MashaAllah!</h1><p>You strengthened {queue.length} Names and earned <strong>{earned} XP</strong>.</p><div className="review-result"><strong>{correct}/{queue.length}</strong><span>correct answers</span></div><button className="review-primary" onClick={() => navigate("/my-dashboard")}>Return to My Dashboard</button><button className="review-secondary" onClick={() => window.location.reload()}>Review another set</button></main></div>; }
  return <div className="dashboard-page smart-review-page"><main className="review-shell"><div className="review-top"><button onClick={() => navigate("/my-dashboard")} aria-label="Close review">×</button><div><span style={{ width: `${((index + 1) / queue.length) * 100}%` }} /></div><small>{index + 1}/{queue.length}</small></div><span className="dashboard-eyebrow">{item.reason.toUpperCase()}</span><div className="review-arabic" lang="ar" dir="rtl">{item.card.arabic}</div><h1>What does {item.card.name} mean?</h1><div className="review-answers">{choices.map((choice) => { const answered = selected !== null; const state = answered && choice === item.card.meaning ? "correct" : answered && choice === selected ? "wrong" : ""; return <button className={state} disabled={answered} key={choice} onClick={(event) => { event.currentTarget.blur(); setSelected(choice); }}>{choice}</button>; })}</div>{selected && <div className={`review-feedback ${selected === item.card.meaning ? "correct" : "wrong"}`}><p>{selected === item.card.meaning ? "Correct — well remembered." : `The answer is ${item.card.meaning}.`}</p><button onClick={continueReview}>Continue →</button></div>}<small className="review-xp">Level {getXpSummary().level} · Earn XP with every answer</small></main></div>;
}
