import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import arabicAlphabet from "../data/arabicAlphabet";
import LetterWritingCanvas from "./LetterWritingCanvas";
import { getGoldenRecord, patchGoldenRecord, readGoldenProgress, saveGoldenAttempt } from "../utils/goldenLettersProgress";
import "../styles/GoldenLetters.css";
import "../styles/GoldenLettersLetter.css";

const STEPS = ["Learn", "Watch", "Trace", "Faded", "Write", "Check"];
const relatedGroups = [[2, 3, 4, 25, 28], [5, 6, 7], [8, 9], [10, 11], [12, 13], [14, 15], [16, 17], [18, 19], [20, 21]];

function choicesFor(letter) {
  const group = relatedGroups.find((ids) => ids.includes(letter.id)) || [];
  const candidates = [...group.map((id) => arabicAlphabet.find((item) => item.id === id)).filter(Boolean), ...arabicAlphabet.filter((item) => item.id !== letter.id)];
  const unique = [...new Map(candidates.map((item) => [item.id, item])).values()].filter((item) => item.id !== letter.id).slice(0, 3);
  return [letter, ...unique].sort((a, b) => ((a.id * 17 + letter.id * 7) % 11) - ((b.id * 17 + letter.id * 7) % 11));
}

function startingStep(record) {
  if (!record.listened) return 0;
  if (!record.watched) return 1;
  if (!record.traced) return 2;
  if (!record.fadedTraced) return 3;
  if (!record.freeWritten) return 4;
  if (!record.quizPassed) return 5;
  return 0;
}

export default function GoldenLettersLetter() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const letterIndex = arabicAlphabet.findIndex((item) => String(item.id) === String(id));
  const letter = arabicAlphabet[letterIndex];
  const initialRecord = getGoldenRecord(readGoldenProgress(), id);
  const [record, setRecord] = useState(initialRecord);
  const [step, setStep] = useState(() => startingStep(initialRecord));
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState(null);
  const [finished, setFinished] = useState(false);
  const [audioError, setAudioError] = useState("");
  const canvasRef = useRef(null);

  useEffect(() => {
    if (location.state?.openTab === "practice") navigate(`/golden-letters/practice?letter=${id}`, { replace: true });
  }, [id, location.state, navigate]);
  useEffect(() => {
    const next = getGoldenRecord(readGoldenProgress(), id);
    setRecord(next); setStep(startingStep(next)); setResult(null); setSelected(null); setFinished(false);
  }, [id]);

  if (!letter) return <main className="gl-page"><div className="gl-empty-state"><h1>Letter not found</h1><button className="gl-primary-button" onClick={() => navigate("/golden-letters/letters")}>Return to alphabet</button></div></main>;

  const speak = (rate = 0.9) => {
    setAudioError("");
    if (!("speechSynthesis" in window)) { setAudioError("Audio is unavailable on this device."); return; }
    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find((voice) => voice.lang?.toLowerCase().startsWith("ar"));
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(letter.letter);
      utterance.lang = "ar-SA"; utterance.rate = rate; if (arabicVoice) utterance.voice = arabicVoice;
      utterance.onerror = () => setAudioError("Arabic audio is unavailable. You can continue without it.");
      window.speechSynthesis.speak(utterance);
      const next = patchGoldenRecord(letter.id, { listened: true }); setRecord(next);
    } catch { setAudioError("Arabic audio is unavailable. You can continue without it."); }
  };

  const moveNext = () => { setResult(null); setSelected(null); setStep((current) => Math.min(STEPS.length - 1, current + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const submitWriting = (type) => {
    const scored = canvasRef.current?.check();
    const threshold = type === "write" ? 48 : type === "faded" ? 55 : 58;
    if (scored?.score >= threshold) setRecord(saveGoldenAttempt(letter.id, type, scored.score, { precision: scored.precision, coverage: scored.coverage }));
  };
  const checkRecognition = (choice) => {
    setSelected(choice.id);
    if (choice.id === letter.id) {
      const next = saveGoldenAttempt(letter.id, "recognition", 100); setRecord(next); setTimeout(() => setFinished(true), 450);
    }
  };
  const stepComplete = (index) => [record.listened, record.watched, record.traced, record.fadedTraced, record.freeWritten, record.quizPassed][index];
  const options = useMemo(() => choicesFor(letter), [letter]);

  return <main className="gl-page gl-lesson-page">
    <div className="gl-lesson-shell">
      <header className="gl-lesson-header">
        <button className="gl-icon-button" onClick={() => navigate("/golden-letters/letters")} aria-label="Exit lesson">✕</button>
        <div><strong>{letter.name}</strong><span>Lesson {letterIndex + 1} of {arabicAlphabet.length}</span></div>
        <span>{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
      </header>
      <div className="gl-step-track" aria-label="Lesson progress">{STEPS.map((label, index) => <span key={label} className={`${index === step ? "active" : ""} ${stepComplete(index) ? "done" : ""}`} title={label}>{stepComplete(index) ? "✓" : index + 1}</span>)}</div>
      <p className="gl-step-name">{STEPS[step]}</p>

      {finished ? <LessonResult letter={letter} record={record} onNext={() => letterIndex < arabicAlphabet.length - 1 ? navigate(`/golden-letters/letter/${arabicAlphabet[letterIndex + 1].id}`) : navigate("/golden-letters/progress")} onPractice={() => navigate(`/golden-letters/practice?letter=${letter.id}`)} /> : <>
        {step === 0 && <section className="gl-activity-card gl-meet-card">
          <p className="gl-eyebrow">Meet the letter</p><div className="gl-display-letter" lang="ar" dir="rtl">{letter.letter}</div><h1>{letter.name}</h1><p className="gl-sound">{letter.soundExample}</p><p className="gl-muted">{letter.note}</p>
          <div className="gl-audio-row"><button className="gl-secondary-button" onClick={() => speak(0.9)}>🔊 Hear it</button><button className="gl-secondary-button" onClick={() => speak(0.62)}>🐢 Slow</button></div>{audioError && <p className="gl-inline-alert">{audioError}</p>}
          <button className="gl-primary-button gl-full-button" onClick={() => { if (!record.listened) setRecord(patchGoldenRecord(letter.id, { listened: true })); moveNext(); }}>Start writing</button>
        </section>}

        {step === 1 && <section className="gl-activity-card gl-watch-card">
          <p className="gl-eyebrow">Watch first</p><h1>See how {letter.name} is formed</h1><p className="gl-muted">Watch the shape appear, then practice it yourself.</p>
          <div className="gl-demo-stage"><span className="gl-demo-letter" key={`${id}-${step}`} lang="ar" dir="rtl">{letter.letter}</span><i>1</i><b>Follow the highlighted shape</b></div>
          <button className="gl-secondary-button" onClick={(event) => { const node = event.currentTarget.previousElementSibling.querySelector(".gl-demo-letter"); node.classList.remove("gl-demo-letter"); requestAnimationFrame(() => node.classList.add("gl-demo-letter")); }}>↻ Replay</button>
          <button className="gl-primary-button gl-full-button" onClick={() => { setRecord(patchGoldenRecord(letter.id, { watched: true })); moveNext(); }}>I’m ready to trace</button>
        </section>}

        {[2, 3, 4].includes(step) && <section className="gl-activity-card gl-writing-card">
          <p className="gl-eyebrow">{step === 2 ? "Guided tracing" : step === 3 ? "Fewer hints" : "Independent writing"}</p>
          <h1>{step === 2 ? `Trace ${letter.name}` : step === 3 ? `Trace ${letter.name} again` : `Write ${letter.name} from memory`}</h1>
          <p className="gl-muted">{step === 2 ? "Follow the gold shape as closely as you can." : step === 3 ? "The guide is lighter this time." : "Write the letter, then check your work. Use Show Me whenever you need it."}</p>
          <LetterWritingCanvas ref={canvasRef} glyph={letter.forms?.isolated || letter.letter} mode={step === 4 ? "write" : step === 3 ? "faded" : "trace"} guideOpacity={step === 2 ? 0.24 : 0.09} onResult={setResult} />
          {result && <div className={`gl-writing-feedback is-${result.tone}`} role="status"><strong>{result.title}</strong><p>{result.message}</p>{result.hasEnoughInk && <span>Accuracy {result.score}%</span>}</div>}
          {((step === 2 && record.traced) || (step === 3 && record.fadedTraced) || (step === 4 && record.freeWritten)) ? <button className="gl-primary-button gl-full-button" onClick={moveNext}>Continue</button> : <button className="gl-primary-button gl-full-button" onClick={() => submitWriting(step === 2 ? "trace" : step === 3 ? "faded" : "write")}>Check my writing</button>}
        </section>}

        {step === 5 && <section className="gl-activity-card gl-recognition-card">
          <p className="gl-eyebrow">Quick check</p><h1>Which letter is {letter.name}?</h1><p className="gl-muted">Choose the correct Arabic letter.</p>
          <div className="gl-choice-grid">{options.map((option) => <button key={option.id} className={selected === option.id ? (option.id === letter.id ? "correct" : "wrong") : ""} onClick={() => checkRecognition(option)} lang="ar" dir="rtl">{option.letter}<small>{selected === option.id && option.id !== letter.id ? "Try again" : ""}</small></button>)}</div>
          {selected === letter.id && <div className="gl-writing-feedback is-great"><strong>Correct</strong><p>You recognized {letter.name}.</p></div>}
        </section>}
      </>}
    </div>
  </main>;
}

function LessonResult({ letter, record, onNext, onPractice }) {
  return <section className="gl-activity-card gl-result-card"><div className="gl-celebration">✦</div><p className="gl-eyebrow">MashaAllah</p><h1>You completed {letter.name}</h1><div className="gl-display-letter small" lang="ar" dir="rtl">{letter.letter}</div>
    <div className="gl-result-list"><div><span>Guided tracing</span><strong>{record.bestTraceScore || 0}%</strong></div><div><span>Faded tracing</span><strong>{record.bestFadedScore || 0}%</strong></div><div><span>Writing from memory</span><strong>{record.bestWriteScore || 0}%</strong></div><div><span>Overall mastery</span><strong>{record.mastery || 0}%</strong></div></div>
    <button className="gl-primary-button gl-full-button" onClick={onNext}>Next letter</button><button className="gl-secondary-button gl-full-button" onClick={onPractice}>Use it in words</button>
  </section>;
}

