import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import names from "../data/names";
import { getGoldenLetterProgress, getLearningStats, getNameState, loadProfile } from "../utils/learningProfile";
import LearningNav from "./LearningNav";
import "../styles/LearningJourney.css";

const labels = { mastered: "Mastered", familiar: "Familiar", learning: "Learning", review: "Needs review", new: "New" };

export default function LearningProgress() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(loadProfile);
  const [filter, setFilter] = useState("all");
  useEffect(() => { const refresh = () => setProfile(loadProfile()); window.addEventListener("learning-profile-updated", refresh); return () => window.removeEventListener("learning-profile-updated", refresh); }, []);
  const stats = getLearningStats(profile);
  const letters = getGoldenLetterProgress();
  const visible = names.filter((n) => filter === "all" || getNameState(profile, n) === filter);
  return <div className="journey-page"><main className="journey-shell">
    <button className="journey-back" onClick={() => navigate("/learning-mode")}>← Learning journey</button><div className="journey-eyebrow">YOUR JOURNEY</div><h1>Progress that means something</h1><p className="journey-lead">See what is strong, what is growing, and what is ready for review.</p>
    <section className="stats-grid"><article><strong>{stats.mastered}</strong><span>Names mastered</span></article><article><strong>{stats.retention}%</strong><span>Retention</span></article><article><strong>{stats.streak}</strong><span>Day streak</span></article><article><strong>{stats.weekMinutes}</strong><span>Minutes this week</span></article></section>
    <section className="course-progress-card"><div><span>99 Names</span><strong>{stats.overall}%</strong></div><div className="thin-track"><span style={{ width: `${stats.overall}%` }} /></div><small>{stats.learning + stats.familiar} learning · {stats.review} ready to review · {stats.new} new</small></section>
    <section className="course-progress-card"><div><span>Golden Letters</span><strong>{letters}/28</strong></div><div className="thin-track letters"><span style={{ width: `${(letters / 28) * 100}%` }} /></div><small>Tracing, recognition, writing, and practice progress</small></section>
    <div className="mastery-heading"><div><h2>99 Names mastery map</h2><p>Tap any Name to revisit it in flashcards.</p></div><select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter mastery map"><option value="all">All Names</option>{Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
    <div className="mastery-legend">{Object.entries(labels).map(([key, label]) => <span key={key}><i className={key} />{label}</span>)}</div>
    <section className="mastery-grid">{visible.map((name, i) => { const state = getNameState(profile, name); return <button key={`${name.name}-${i}`} className={state} onClick={() => navigate(`/flashcards?name=${encodeURIComponent(name.name)}`)} title={`${name.name}: ${labels[state]}`}><b>{names.indexOf(name) + 1}</b><span lang="ar" dir="rtl">{name.arabic}</span><small>{name.name}</small></button>; })}</section>
  </main><LearningNav /></div>;
}
