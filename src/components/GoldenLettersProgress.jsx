import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import arabicAlphabet from "../data/arabicAlphabet";
import { getGoldenRecord, goldenSummary, masteryStatus, readGoldenProgress, readGoldenStreak } from "../utils/goldenLettersProgress";
import GoldenLettersNav from "./GoldenLettersNav";
import "../styles/GoldenLetters.css";

export default function GoldenLettersProgress() {
  const navigate = useNavigate();
  const progress = readGoldenProgress();
  const summary = goldenSummary(progress, arabicAlphabet.length);
  const streak = readGoldenStreak().count || 0;
  const attempts = useMemo(() => arabicAlphabet.flatMap((letter) => getGoldenRecord(progress, letter.id).attempts.map((attempt) => ({ ...attempt, letter }))).sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 5), [progress]);
  const strongest = [...arabicAlphabet].sort((a, b) => getGoldenRecord(progress, b.id).mastery - getGoldenRecord(progress, a.id).mastery)[0];
  const needsPractice = arabicAlphabet.filter((letter) => getGoldenRecord(progress, letter.id).started).sort((a, b) => getGoldenRecord(progress, a.id).mastery - getGoldenRecord(progress, b.id).mastery)[0];

  return <main className="gl-page gl-page-with-nav"><div className="gl-shell">
    <header className="gl-app-header"><button className="gl-icon-button" onClick={() => navigate("/golden-letters")}>←</button><div><p className="gl-eyebrow">Your Arabic writing journey</p><h1>Progress</h1></div><span className="gl-header-spacer" /></header>
    <section className="gl-progress-hero"><div className="gl-progress-ring" style={{ "--progress": `${Math.round((summary.mastered / summary.total) * 360)}deg` }}><span><strong>{summary.mastered}</strong>of {summary.total}</span></div><div><p className="gl-eyebrow">Letters mastered</p><h2>{summary.mastered ? "Keep building your confidence" : "Your journey begins here"}</h2><p className="gl-muted">Mastery combines tracing, independent writing, and recognition.</p></div></section>
    <div className="gl-stat-grid"><article><strong>{summary.completed}</strong><span>Completed</span></article><article><strong>{summary.learning}</strong><span>Learning</span></article><article><strong>{summary.writingAccuracy ? `${summary.writingAccuracy}%` : "—"}</strong><span>Writing</span></article><article><strong>{streak}</strong><span>Day streak</span></article></div>
    <section className="gl-section"><h2>Mastery map</h2><div className="gl-mastery-map">{arabicAlphabet.map((letter) => { const record = getGoldenRecord(progress, letter.id); return <button key={letter.id} className={`is-${masteryStatus(record)}`} onClick={() => navigate(`/golden-letters/letter/${letter.id}`)}><strong lang="ar">{letter.letter}</strong><span>{record.mastery || 0}%</span></button>; })}</div><div className="gl-map-legend"><span><i className="new" />New</span><span><i className="learning" />Learning</span><span><i className="mastered" />Mastered</span><span><i className="review" />Review</span></div></section>
    {(strongest || needsPractice) && <section className="gl-insight-grid"><article><span>Strongest letter</span><strong lang="ar">{strongest?.letter}</strong><small>{strongest ? getGoldenRecord(progress, strongest.id).mastery : 0}% mastery</small></article><article><span>Practice next</span><strong lang="ar">{needsPractice?.letter || arabicAlphabet[0].letter}</strong><small>{needsPractice?.name || arabicAlphabet[0].name}</small></article></section>}
    <section className="gl-section"><div className="gl-section-heading"><h2>Recent attempts</h2></div>{attempts.length ? <div className="gl-attempt-list">{attempts.map((attempt, index) => <div key={`${attempt.at}-${index}`}><strong lang="ar">{attempt.letter.letter}</strong><span>{attempt.type} practice</span><b>{attempt.score}%</b></div>)}</div> : <div className="gl-empty-inline">Complete a writing activity to see your improvement here.</div>}</section>
  </div><GoldenLettersNav active="progress" /></main>;
}

