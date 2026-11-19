import React, { useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import arabicAlphabet from "../data/arabicAlphabet";
import topQuranWords200 from "../data/topQuranWords200";
import namesOfAllah from "../data/names";
import LetterWritingCanvas from "./LetterWritingCanvas";
import GoldenLettersNav from "./GoldenLettersNav";
import { getGoldenRecord, patchGoldenRecord, readGoldenProgress } from "../utils/goldenLettersProgress";
import "../styles/GoldenLetters.css";

const sentences = [
  { arabic: "الْحَمْدُ لِلَّهِ", transliteration: "Alhamdulillah", meaning: "All praise belongs to Allah" },
  { arabic: "سُبْحَانَ اللَّهِ", transliteration: "SubhanAllah", meaning: "Glory be to Allah" },
  { arabic: "اللَّهُ أَكْبَرُ", transliteration: "Allahu Akbar", meaning: "Allah is the Greatest" },
];

function normalizeItems(items, fallback = []) {
  const source = Array.isArray(items) ? items : fallback;
  return source.filter((item) => item?.arabic).map((item) => ({ arabic: item.arabic, transliteration: item.transliteration || item.name || "", meaning: item.meaning || "" }));
}

export default function GoldenLettersPractice() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const selectedLetter = arabicAlphabet.find((letter) => String(letter.id) === params.get("letter"));
  const [category, setCategory] = useState(selectedLetter ? "review" : "daily");
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [complete, setComplete] = useState(false);
  const canvasRef = useRef(null);
  const progress = readGoldenProgress();

  const catalog = useMemo(() => {
    const learning = arabicAlphabet.filter((letter) => getGoldenRecord(progress, letter.id).started);
    const due = arabicAlphabet.filter((letter) => getGoldenRecord(progress, letter.id).needsReview || (getGoldenRecord(progress, letter.id).nextReviewAt && new Date(getGoldenRecord(progress, letter.id).nextReviewAt) <= new Date()));
    const dailyLetters = (due.length ? due : learning.length ? learning : arabicAlphabet).slice(0, 5).map((letter) => ({ arabic: letter.letter, transliteration: letter.name, meaning: letter.soundExample, letterId: letter.id }));
    const words = normalizeItems(topQuranWords200).filter((item) => !selectedLetter || item.arabic.includes(selectedLetter.letter)).slice(0, 20);
    const names = normalizeItems(namesOfAllah).slice(0, 10);
    return {
      daily: dailyLetters,
      review: selectedLetter ? [{ arabic: selectedLetter.letter, transliteration: selectedLetter.name, meaning: selectedLetter.soundExample, letterId: selectedLetter.id }] : dailyLetters,
      words: words.length ? words : normalizeItems(topQuranWords200).slice(0, 20),
      names,
      sentences,
    };
  }, [selectedLetter]);
  const items = catalog[category] || [];
  const item = items[Math.min(index, Math.max(0, items.length - 1))];

  const changeCategory = (next) => { setCategory(next); setIndex(0); setResult(null); setComplete(false); canvasRef.current?.clear(); };
  const check = () => {
    const scored = canvasRef.current?.check();
    if (scored?.score >= 48 && item?.letterId) {
      const record = getGoldenRecord(readGoldenProgress(), item.letterId);
      patchGoldenRecord(item.letterId, { bestWriteScore: Math.max(record.bestWriteScore || 0, scored.score), freeWritten: true, lastPracticedAt: new Date().toISOString(), needsReview: false });
    }
    if (scored?.score >= 48 && index === items.length - 1) setComplete(true);
  };
  const next = () => { if (index < items.length - 1) { setIndex((value) => value + 1); setResult(null); canvasRef.current?.clear(); } else setComplete(true); };

  return <main className="gl-page gl-page-with-nav"><div className="gl-shell">
    <header className="gl-app-header"><button className="gl-icon-button" onClick={() => navigate("/golden-letters")}>←</button><div><p className="gl-eyebrow">Build stronger recall</p><h1>Practice</h1></div><span className="gl-header-spacer" /></header>
    <div className="gl-filter-scroll">{[{ key: "daily", label: "Daily" }, { key: "review", label: "Letters" }, { key: "words", label: "Words" }, { key: "names", label: "Allah’s Names" }, { key: "sentences", label: "Phrases" }].map((tab) => <button className={category === tab.key ? "active" : ""} key={tab.key} onClick={() => changeCategory(tab.key)}>{tab.label}</button>)}</div>
    {complete ? <section className="gl-activity-card gl-result-card"><div className="gl-celebration">✦</div><p className="gl-eyebrow">Practice complete</p><h1>Beautiful consistency</h1><p className="gl-muted">You completed {items.length} writing activities.</p><button className="gl-primary-button gl-full-button" onClick={() => { setIndex(0); setComplete(false); setResult(null); }}>Practice again</button><button className="gl-secondary-button gl-full-button" onClick={() => navigate("/golden-letters")}>Return home</button></section> : item ? <section className="gl-activity-card gl-practice-card">
      <div className="gl-practice-counter"><span>{category === "daily" ? "Today’s practice" : category}</span><strong>{index + 1} of {items.length}</strong></div>
      <div className="gl-practice-prompt" lang="ar" dir="rtl">{item.arabic}</div><h2>{item.transliteration}</h2><p className="gl-muted">{item.meaning}</p>
      <LetterWritingCanvas ref={canvasRef} glyph={item.arabic} mode="write" onResult={setResult} />
      {result && <div className={`gl-writing-feedback is-${result.tone}`}><strong>{result.title}</strong><p>{result.message}</p>{result.hasEnoughInk && <span>Accuracy {result.score}%</span>}</div>}
      {result?.score >= 48 ? <button className="gl-primary-button gl-full-button" onClick={next}>{index === items.length - 1 ? "Finish practice" : "Continue"}</button> : <button className="gl-primary-button gl-full-button" onClick={check}>Check my writing</button>}
    </section> : <div className="gl-empty-state"><h2>No practice items found</h2><button className="gl-primary-button" onClick={() => changeCategory("daily")}>Start daily practice</button></div>}
  </div><GoldenLettersNav active="practice" /></main>;
}

