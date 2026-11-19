import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import arabicAlphabet from "../data/arabicAlphabet";
import {
  goldenSummary, getGoldenRecord, nextGoldenLetterId, readGoldenProgress,
  readGoldenStreak, resetGoldenProgress,
} from "../utils/goldenLettersProgress";
import GoldenLettersNav from "./GoldenLettersNav";
import "../styles/GoldenLetters.css";

export default function GoldenLettersHome() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(readGoldenProgress);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    const refresh = () => setProgress(readGoldenProgress());
    window.addEventListener("focus", refresh);
    window.addEventListener("golden-progress-updated", refresh);
    return () => { window.removeEventListener("focus", refresh); window.removeEventListener("golden-progress-updated", refresh); };
  }, []);

  const nextId = useMemo(() => nextGoldenLetterId(progress, arabicAlphabet.length), [progress]);
  const nextLetter = arabicAlphabet.find((entry) => entry.id === nextId) || arabicAlphabet[0];
  const nextRecord = getGoldenRecord(progress, nextId);
  const summary = goldenSummary(progress, arabicAlphabet.length);
  const streak = readGoldenStreak().count || 0;
  const percent = Math.round((summary.completed / summary.total) * 100);
  const due = Object.values(progress).filter((record) => record?.nextReviewAt && new Date(record.nextReviewAt).getTime() <= Date.now()).length;

  return <main className="gl-page gl-page-with-nav">
    <div className="gl-shell">
      <header className="gl-app-header">
        <button className="gl-icon-button" onClick={() => navigate("/learning-mode")} aria-label="Back to Learn Mode">←</button>
        <div><p className="gl-eyebrow">Arabic writing course</p><h1>Golden Letters</h1></div>
        <button className="gl-icon-button" onClick={() => setSettingsOpen(true)} aria-label="Open settings">⚙</button>
      </header>

      <section className="gl-hero-card">
        <div className="gl-hero-copy">
          <span className="gl-status-pill">Continue learning</span><h2>{nextLetter.name}</h2>
          <p>{nextRecord.started ? "Continue your guided writing lesson" : "Your next guided writing lesson"}</p>
          <div className="gl-inline-progress" aria-label={`${nextRecord.mastery || 0}% mastery`}><span style={{ width: `${Math.max(4, nextRecord.mastery || 0)}%` }} /></div>
          <small>{nextRecord.mastery || 0}% mastery</small>
        </div>
        <div className="gl-hero-letter" lang="ar" dir="rtl">{nextLetter.letter}</div>
        <button className="gl-primary-button" onClick={() => navigate(`/golden-letters/letter/${nextId}`)}>{nextRecord.started ? "Continue lesson" : "Start lesson"}</button>
      </section>

      <section className="gl-section">
        <div className="gl-section-heading"><div><p className="gl-eyebrow">About 4 minutes</p><h2>Today’s practice</h2></div><span className="gl-round-count">{due || 3}</span></div>
        <p className="gl-muted">Review difficult letters, write from memory, and finish with a recognition check.</p>
        <button className="gl-secondary-button gl-full-button" onClick={() => navigate("/golden-letters/practice")}>Start daily practice</button>
      </section>

      <section className="gl-section">
        <div className="gl-section-heading"><h2>Your progress</h2><button className="gl-text-button" onClick={() => navigate("/golden-letters/progress")}>View details</button></div>
        <div className="gl-stat-grid">
          <article><strong>{summary.mastered}</strong><span>Mastered</span></article><article><strong>{summary.learning}</strong><span>Learning</span></article>
          <article><strong>{summary.writingAccuracy ? `${summary.writingAccuracy}%` : "—"}</strong><span>Writing</span></article><article><strong>{streak}</strong><span>Day streak</span></article>
        </div>
        <div className="gl-course-progress"><div><span>Course progress</span><strong>{summary.completed} of {summary.total}</strong></div><div className="gl-inline-progress"><span style={{ width: `${percent}%` }} /></div></div>
      </section>

      <section className="gl-quick-grid" aria-label="Golden Letters destinations">
        <button onClick={() => navigate("/golden-letters/letters")}><span>ا ب ت</span><strong>Alphabet</strong><small>Choose any letter</small></button>
        <button onClick={() => navigate("/golden-letters/practice")}><span>✍</span><strong>Practice</strong><small>Words and review</small></button>
      </section>
    </div>
    <GoldenLettersNav active="home" />
    {settingsOpen && <div className="gl-modal-backdrop" role="presentation" onClick={() => setSettingsOpen(false)}>
      <section className="gl-modal" role="dialog" aria-modal="true" aria-labelledby="gl-settings-title" onClick={(event) => event.stopPropagation()}>
        <div className="gl-section-heading"><h2 id="gl-settings-title">Golden Letters settings</h2><button className="gl-icon-button" onClick={() => setSettingsOpen(false)}>✕</button></div>
        <p className="gl-muted">Your progress is stored on this device.</p>
        {!confirmReset ? <button className="gl-danger-button gl-full-button" onClick={() => setConfirmReset(true)}>Reset all progress</button> : <div className="gl-confirm-box"><strong>Reset all Golden Letters progress?</strong><p>This cannot be undone on this device.</p><div><button className="gl-secondary-button" onClick={() => setConfirmReset(false)}>Cancel</button><button className="gl-danger-button" onClick={() => { resetGoldenProgress(); setProgress({}); setSettingsOpen(false); }}>Reset</button></div></div>}
      </section>
    </div>}
  </main>;
}

