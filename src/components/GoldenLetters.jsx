import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import arabicAlphabet from "../data/arabicAlphabet";
import { getGoldenRecord, masteryStatus, readGoldenProgress } from "../utils/goldenLettersProgress";
import GoldenLettersNav from "./GoldenLettersNav";
import "../styles/GoldenLetters.css";

const families = [
  { name: "All letters", ids: arabicAlphabet.map((letter) => letter.id) },
  { name: "Connecting", ids: arabicAlphabet.filter((letter) => letter.connectAfter).map((letter) => letter.id) },
  { name: "Non connecting", ids: arabicAlphabet.filter((letter) => !letter.connectAfter).map((letter) => letter.id) },
];
const labels = { new: "New", learning: "Learning", mastered: "Mastered", review: "Review" };

export default function GoldenLetters() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(readGoldenProgress);
  const [statusFilter, setStatusFilter] = useState("all");
  const [familyName, setFamilyName] = useState(families[0].name);
  useEffect(() => { const refresh = () => setProgress(readGoldenProgress()); window.addEventListener("golden-progress-updated", refresh); return () => window.removeEventListener("golden-progress-updated", refresh); }, []);
  const family = families.find((item) => item.name === familyName) || families[0];
  const letters = useMemo(() => arabicAlphabet.filter((letter) => { const status = masteryStatus(getGoldenRecord(progress, letter.id)); return family.ids.includes(letter.id) && (statusFilter === "all" || status === statusFilter); }), [family, progress, statusFilter]);
  return <main className="gl-page gl-page-with-nav"><div className="gl-shell">
    <header className="gl-app-header"><button className="gl-icon-button" onClick={() => navigate("/golden-letters")}>←</button><div><p className="gl-eyebrow">Guided path or free explore</p><h1>Learn the alphabet</h1></div><span className="gl-header-spacer" /></header>
    <section className="gl-path-card"><div><span className="gl-status-pill">Recommended</span><h2>Follow the guided path</h2><p>Learn one shape at a time, then practice related letters together.</p></div><button className="gl-primary-button" onClick={() => { const next = arabicAlphabet.find((letter) => !getGoldenRecord(progress, letter.id).completed) || arabicAlphabet[0]; navigate(`/golden-letters/letter/${next.id}`); }}>Continue path</button></section>
    <div className="gl-filter-scroll" aria-label="Letter status filters">{["all", "learning", "mastered", "review"].map((status) => <button key={status} className={statusFilter === status ? "active" : ""} onClick={() => setStatusFilter(status)}>{status === "all" ? "All" : labels[status]}</button>)}</div>
    <label className="gl-select-label">Letter group<select value={familyName} onChange={(event) => setFamilyName(event.target.value)}>{families.map((item) => <option key={item.name}>{item.name}</option>)}</select></label>
    <section className="gl-letter-grid">{letters.map((letter) => { const record = getGoldenRecord(progress, letter.id); const status = masteryStatus(record); return <button key={letter.id} className={`gl-letter-tile is-${status}`} onClick={() => navigate(`/golden-letters/letter/${letter.id}`)}><span className="gl-letter-status">{labels[status]}</span><strong lang="ar" dir="rtl">{letter.letter}</strong><span>{letter.name}</span><div className="gl-mastery-line"><i style={{ width: `${record.mastery || 0}%` }} /></div><small>{record.mastery || 0}% mastery</small></button>; })}</section>
    {!letters.length && <div className="gl-empty-state"><span>✓</span><h2>Nothing here right now</h2><p>Choose another filter to see more letters.</p></div>}
  </div><GoldenLettersNav active="learn" /></main>;
}

