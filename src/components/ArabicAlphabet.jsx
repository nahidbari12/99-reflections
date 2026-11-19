// /src/components/ArabicAlphabet.jsx

import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ArabicAlphabet.css";
import arabicAlphabet from "../data/arabicAlphabet";
import top200Words from "../data/topQuranWords200";

/* =============================
   SAFE TEXT-TO-SPEECH UTILITY
============================= */
function speakText(
  text,
  preferredLang = "ar-SA",
  pauseBackground = true,
  rate = 1
) {
  if (!text) return;
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  // Stop any speech already happening
  window.speechSynthesis.cancel();

  let bgAudio = null;
  let resumeMusicAfter = false;

  if (pauseBackground && typeof document !== "undefined") {
    bgAudio =
      document.querySelector("audio[data-global-music='true']") ||
      document.querySelector("#global-music-audio") ||
      null;

    if (bgAudio && !bgAudio.paused) {
      try {
        bgAudio.pause();
        resumeMusicAfter = true;
      } catch (_) {}
    }
  }

  const utter = new SpeechSynthesisUtterance(text);
  let voices = window.speechSynthesis.getVoices();

  // If voices aren't loaded yet, attach a one-time handler so future calls can use them
  if (!voices || voices.length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      voices = window.speechSynthesis.getVoices();
    };
  }

  // Default language/fallback
  let chosenLang = preferredLang;
  let chosenVoice = null;

  if (voices && voices.length > 0) {
    const lowerPreferred = preferredLang.toLowerCase();
    const preferredPrefix = lowerPreferred.split("-")[0]; // e.g. "ar" or "en"

    // 1) If we’re asking for Arabic, try to pick a real Arabic voice
    if (preferredPrefix === "ar") {
      const exactArabic = voices.find(
        (v) => v.lang && v.lang.toLowerCase() === lowerPreferred
      );
      const anyArabic = voices.find(
        (v) => v.lang && v.lang.toLowerCase().startsWith("ar")
      );

      if (exactArabic) {
        chosenVoice = exactArabic;
        chosenLang = exactArabic.lang;
      } else if (anyArabic) {
        chosenVoice = anyArabic;
        chosenLang = anyArabic.lang;
      } else {
        // No Arabic voice installed → fall back to English
        chosenLang = "en-US";
      }
    } else {
      // 2) Non-Arabic case (like "en-US") – try to honor preferredLang
      const exactMatch = voices.find(
        (v) => v.lang && v.lang.toLowerCase() === lowerPreferred
      );
      const prefixMatch = voices.find(
        (v) => v.lang && v.lang.toLowerCase().startsWith(preferredPrefix)
      );

      if (exactMatch) {
        chosenVoice = exactMatch;
        chosenLang = exactMatch.lang;
      } else if (prefixMatch) {
        chosenVoice = prefixMatch;
        chosenLang = prefixMatch.lang;
      }
    }
  } else {
    // No voices array yet; basic fallback if we *requested* Arabic
    if (preferredLang.toLowerCase().startsWith("ar")) {
      chosenLang = "en-US";
    }
  }

  utter.lang = chosenLang;
  if (chosenVoice) {
    utter.voice = chosenVoice;
  }
  utter.rate = rate;

  const resume = () => {
    if (resumeMusicAfter && bgAudio) {
      try {
        bgAudio.play().catch(() => {});
      } catch (_) {}
    }
  };

  utter.onend = resume;
  utter.onerror = resume;

  window.speechSynthesis.speak(utter);
}

/* =============
   LETTER GROUPS
============== */
const LETTER_GROUPS = [
  { name: "Group 1 – Alif to Tha", indices: [0, 1, 2, 3] },
  { name: "Group 2 – Jeem to Khaa", indices: [4, 5, 6] },
  { name: "Group 3 – Dal to Zay", indices: [7, 8, 9, 10] },
  { name: "Group 4 – Seen to Daad", indices: [11, 12, 13, 14] },
  { name: "Group 5 – Ta (Heavy) to Ghayn", indices: [15, 16, 17, 18] },
  { name: "Group 6 – Fa to Kaf", indices: [19, 20, 21] },
  { name: "Group 7 – Lam to Ya", indices: [22, 23, 24, 25, 26, 27] }
];

const DAILY_GOAL = 20;

// Short vowels
const SHORT_VOWELS = [
  { mark: "َ", label: "Fatha — short “a” sound" },
  { mark: "ِ", label: "Kasra — short “i” sound" },
  { mark: "ُ", label: "Damma — short “u/oo” sound" }
];

// Beginner HARAKAT GUIDE (dropdown)
const HARAKAT_GUIDE = [
  { mark: "َ", title: "Fatha", helper: "short “a” sound" },
  { mark: "ِ", title: "Kasra", helper: "short “i” sound" },
  { mark: "ُ", title: "Damma", helper: "short “u/oo” sound" },
  { mark: "ْ", title: "Sukun", helper: "no vowel / stop the sound" },
  { mark: "ّ", title: "Shadda", helper: "double the letter sound" },
  { mark: "ً", title: "Tanween Fatha", helper: "adds “an” sound" },
  { mark: "ٍ", title: "Tanween Kasra", helper: "adds “in” sound" },
  { mark: "ٌ", title: "Tanween Damma", helper: "adds “un” sound" }
];

function findGroupIndexForLetter(letterIndex) {
  return LETTER_GROUPS.findIndex((g) => g.indices.includes(letterIndex));
}

/* =============
   QUIZ BUILDER
============== */

// keys for forms to randomly pick from
const FORM_KEYS = ["isolated", "initial", "medial", "final"];

function buildQuizQuestion(group) {
  if (!group) return null;

  const letters = group.indices.map((i) => arabicAlphabet[i]);
  const target = letters[Math.floor(Math.random() * letters.length)];

  const optionsLetters = [...letters]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  if (!optionsLetters.find((o) => o.id === target.id)) {
    optionsLetters[0] = target;
  }

  const finalOptionsLetters = [...optionsLetters].sort(() => Math.random() - 0.5);

  // Wrap each option with a random form key
  const options = finalOptionsLetters.map((letter) => {
    const formKey = FORM_KEYS[Math.floor(Math.random() * FORM_KEYS.length)];
    return { letter, formKey };
  });

  return { target, options };
}

/* =============
   WORD SHAPER
============== */
function shapeWord(letterObjs) {
  if (!letterObjs || letterObjs.length === 0) return "";

  return letterObjs
    .map((letter, index) => {
      const prev = letterObjs[index - 1];
      const next = letterObjs[index + 1];

      const canPrev = prev && prev.connectAfter && letter.connectBefore;
      const canNext = next && letter.connectAfter && next.connectBefore;

      if (!canPrev && !canNext) return letter.forms.isolated;
      if (!canPrev && canNext) return letter.forms.initial;
      if (canPrev && canNext) return letter.forms.medial;
      return letter.forms.final;
    })
    .join("");
}

/* ======================
   TOP WORDS NORMALIZER
====================== */
function normalizeTopWord(item, idx) {
  const arabic =
    item?.arabic ??
    item?.word ??
    item?.text ??
    item?.ar ??
    item?.w ??
    "";

  const transliteration =
    item?.transliteration ??
    item?.translit ??
    item?.latin ??
    item?.roman ??
    item?.en ??
    "";

  const meaning =
    item?.meaning ??
    item?.definition ??
    item?.gloss ??
    item?.translation ??
    item?.eng ??
    "";

  const count =
    item?.count ??
    item?.frequency ??
    item?.freq ??
    item?.occurrences ??
    item?.times ??
    null;

  return {
    id: item?.id ?? `${idx}-${arabic}-${transliteration}`,
    arabic: String(arabic || "").trim(),
    transliteration: String(transliteration || "").trim(),
    meaning: String(meaning || "").trim(),
    count
  };
}

/* ======================
   MAIN COMPONENT START
====================== */
function ArabicAlphabet() {
  const navigate = useNavigate();

  /* STATES */
  const [activeTab, setActiveTab] = useState("guided");
  const [guidedIndex, setGuidedIndex] = useState(0);
  const guidedLetter = arabicAlphabet[guidedIndex];
  const guidedGroupIndex = useMemo(
    () => findGroupIndexForLetter(guidedIndex),
    [guidedIndex]
  );
  const guidedGroup =
    guidedGroupIndex >= 0 ? LETTER_GROUPS[guidedGroupIndex] : null;

  const [selectedOverview, setSelectedOverview] = useState(arabicAlphabet[0]);
  const [quizQuestion, setQuizQuestion] = useState(null);
  const [quizFeedback, setQuizFeedback] = useState("");
  const [quizStatus, setQuizStatus] = useState(null);
  const [quizStreak, setQuizStreak] = useState(0);
  const [shareFeedback, setShareFeedback] = useState("");
  const [builderLetters, setBuilderLetters] = useState([]);
  const [letterTipVisible, setLetterTipVisible] = useState(false);
  const [showHarakatGuide, setShowHarakatGuide] = useState(false);
  const [showTtsPopup, setShowTtsPopup] = useState(false);

  // Top 200 words UX state
  const [topWordsQuery, setTopWordsQuery] = useState("");
  const [topWordsShowArabicOnly, setTopWordsShowArabicOnly] = useState(false);

  const shapedWord = useMemo(() => shapeWord(builderLetters), [builderLetters]);

  /* Load streak */
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const today = new Date().toISOString().slice(0, 10);
      const raw = window.localStorage.getItem("alphabetQuizStreak");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.date === today && typeof parsed.count === "number") {
          setQuizStreak(parsed.count);
        }
      }
    } catch (_) {}
  }, []);

  /* Load TTS popup preference */
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem("alphabetTtsPopupDismissed");
      if (stored === "true") {
        setShowTtsPopup(false);
      } else {
        setShowTtsPopup(true);
      }
    } catch (_) {}
  }, []);

  const updateStreak = () => {
    if (typeof window === "undefined") return;
    try {
      const today = new Date().toISOString().slice(0, 10);
      const newCount = quizStreak + 1;
      setQuizStreak(newCount);
      window.localStorage.setItem(
        "alphabetQuizStreak",
        JSON.stringify({ date: today, count: newCount })
      );
    } catch (_) {}
  };

  const stopTTS = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const handleTtsPopupOk = () => {
    setShowTtsPopup(false);
  };

  const handleTtsPopupDontShow = () => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("alphabetTtsPopupDismissed", "true");
      } catch (_) {}
    }
    setShowTtsPopup(false);
  };

  /* =============================
     SHORT VOWEL PILLS (UPDATED)
  ============================== */
  const renderShortVowelPills = () => {
    if (!guidedLetter) return null;

    const handleShortVowelClick = (mark) => {
      const combo = `${guidedLetter.letter}${mark}`;
      // 0.5 = half-speed (0.5 slower than normal)
      speakText(combo, "ar-SA", true, 0.5);
      setLetterTipVisible(true);
      setTimeout(() => setLetterTipVisible(false), 8000);
    };

    return (
      <>
        <div className="harakat-small-title">This letter with short vowels</div>
        <div className="harakat-small-row">
          <div className="harakat-pill-group">
            {SHORT_VOWELS.map((v) => (
              <button
                key={v.mark}
                type="button"
                className="harakat-pill"
                onClick={() => handleShortVowelClick(v.mark)}
              >
                <div className="harakat-letter-wrapper harakat-letter-wrapper-combo">
                  <span className="harakat-base-letter">{guidedLetter.letter}</span>
                  <span className="harakat-mark">{v.mark}</span>
                </div>
                <div className="harakat-desc">{v.label}</div>
              </button>
            ))}
          </div>
        </div>
      </>
    );
  };

  /* =============================
     HARAKAT DROPDOWN
  ============================== */
  const renderHarakatDropdown = () => {
    return (
      <>
        <button
          type="button"
          className="harakat-dropdown-toggle"
          onClick={() => setShowHarakatGuide((prev) => !prev)}
        >
          {showHarakatGuide
            ? "Hide vowel marks (harakat) guide"
            : "Show vowel marks (harakat) guide"}
        </button>

        {showHarakatGuide && (
          <div className="harakat-dropdown-content">
            <div className="harakat-small-title">Vowel marks (harakat)</div>
            <div className="harakat-small-row">
              <div className="harakat-pill-group">
                {HARAKAT_GUIDE.map((h) => (
                  <div key={h.title} className="harakat-pill">
                    <div className="harakat-letter-wrapper">
                      <span className="harakat-letter">{h.mark}</span>
                    </div>
                    <div className="harakat-desc">
                      <strong>{h.title}</strong> — {h.helper}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  /* =============================
      QUIZ HANDLERS
  ============================== */
  const handleStartGroupQuiz = () => {
    if (!guidedGroup) return;
    setQuizQuestion(buildQuizQuestion(guidedGroup));
    setQuizFeedback("");
    setQuizStatus(null);
  };

  const handleQuizAnswer = (opt) => {
    if (!quizQuestion) return;

    // compare the underlying letter id
    const correct = opt.letter.id === quizQuestion.target.id;

    if (correct) {
      setQuizFeedback("✅ Correct!");
      setQuizStatus("correct");
      updateStreak();
    } else {
      setQuizFeedback("❌ Try again.");
      setQuizStatus("wrong");
    }

    setTimeout(() => {
      setQuizQuestion(buildQuizQuestion(guidedGroup));
      setQuizFeedback("");
      setQuizStatus(null);
    }, 900);
  };

  const goPrevLetter = () => {
    stopTTS();
    setGuidedIndex((prev) => (prev === 0 ? arabicAlphabet.length - 1 : prev - 1));
  };

  const goNextLetter = () => {
    stopTTS();
    setGuidedIndex((prev) => (prev === arabicAlphabet.length - 1 ? 0 : prev + 1));
  };

  /* ===========================
     SHARE BUTTON
  =========================== */
  const handleShareClick = async () => {
    const url = "https://99namesofallah.org";
    const text = "Learn the 99 Names of Allah and Arabic alphabet on 99NamesOfAllah.org ✨";

    setShareFeedback("");

    try {
      if (navigator.share) {
        await navigator.share({ title: "99NamesOfAllah.org", text, url });
        setShareFeedback("Shared! ✨");
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setShareFeedback("Link copied!");
      } else {
        setShareFeedback("Share this link: 99namesofallah.org");
      }
    } catch {
      setShareFeedback("Share canceled.");
    }

    setTimeout(() => setShareFeedback(""), 2500);
  };

  /* =============================
      HEAR LETTER
  ============================== */
  const handleHearLetter = (letter) => {
    speakText(letter, "ar-SA", true);
    setLetterTipVisible(true);
    setTimeout(() => setLetterTipVisible(false), 8000);
  };

  /* =============================
      TOP 200 WORDS (DERIVED)
  ============================== */
  const normalizedTopWords = useMemo(() => {
    try {
      if (!Array.isArray(top200Words)) return [];
      return top200Words.map((w, idx) => normalizeTopWord(w, idx)).filter((w) => w.arabic);
    } catch (_) {
      return [];
    }
  }, []);

  const filteredTopWords = useMemo(() => {
    const q = String(topWordsQuery || "").trim().toLowerCase();
    if (!q) return normalizedTopWords;

    return normalizedTopWords.filter((w) => {
      const a = (w.arabic || "").toLowerCase();
      const t = (w.transliteration || "").toLowerCase();
      const m = (w.meaning || "").toLowerCase();
      return a.includes(q) || t.includes(q) || m.includes(q);
    });
  }, [normalizedTopWords, topWordsQuery]);

  /* ===========================
        MAIN JSX OUTPUT
  =========================== */
  return (
    <div className="alphabet-page">
      <div className="alphabet-inner">
        {/* TTS POPUP */}
        {showTtsPopup && (
          <div className="alphabet-tts-overlay">
            <div className="alphabet-tts-modal">
              <h2 className="alphabet-tts-title">Arabic audio tip</h2>
              <p className="alphabet-tts-text">
                For a better experience, enable Arabic language / voices on your device. Click Help for more details.
              </p>
              <div className="alphabet-tts-actions">
                <button
                  type="button"
                  className="alphabet-tts-help-button"
                  onClick={() => {
                    stopTTS();
                    navigate("/arabic-tts-help");
                  }}
                >
                  Help
                </button>
                <button
                  type="button"
                  className="alphabet-tts-ok-button"
                  onClick={handleTtsPopupOk}
                >
                  OK
                </button>
                <button
                  type="button"
                  className="alphabet-tts-dismiss-button"
                  onClick={handleTtsPopupDontShow}
                >
                  Don&apos;t show again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* HEADER */}
        <header className="alphabet-header">
          <h1 className="alphabet-title">🔤 Arabic Alphabet</h1>
          <p className="alphabet-subtitle">Learn each letter step by step and see how they connect.</p>
        </header>

        {/* SHARE ROW */}
        <div className="alphabet-share-row">
          <button type="button" className="alphabet-share-button" onClick={handleShareClick}>
            📤 Share this page
          </button>
          {shareFeedback && <span className="alphabet-share-feedback">{shareFeedback}</span>}
        </div>

        {/* TABS */}
        <div className="alphabet-tabs">
          <button
            className={`alphabet-tab ${activeTab === "guided" ? "alphabet-tab-active" : ""}`}
            onClick={() => {
              stopTTS();
              setActiveTab("guided");
            }}
          >
            📘 Guided
          </button>
          <button
            className={`alphabet-tab ${activeTab === "overview" ? "alphabet-tab-active" : ""}`}
            onClick={() => {
              stopTTS();
              setActiveTab("overview");
            }}
          >
            🗂 Overview
          </button>
          <button
            className={`alphabet-tab ${activeTab === "connectivity" ? "alphabet-tab-active" : ""}`}
            onClick={() => {
              stopTTS();
              setActiveTab("connectivity");
            }}
          >
            🔗 Connections
          </button>
          <button
            className={`alphabet-tab ${activeTab === "builder" ? "alphabet-tab-active" : ""}`}
            onClick={() => {
              stopTTS();
              setActiveTab("builder");
            }}
          >
            🧩 Build a Word
          </button>

          {/* ✅ NEW TAB */}
          <button
            className={`alphabet-tab ${activeTab === "topwords" ? "alphabet-tab-active" : ""}`}
            onClick={() => {
              stopTTS();
              setActiveTab("topwords");
            }}
          >
            📚 Top Words
          </button>
        </div>

        {/* ===========================
              GUIDED TAB
        =========================== */}
        {activeTab === "guided" && guidedLetter && (
          <section className="alphabet-section">
            {/* MAIN LETTER CARD */}
            <div className="alphabet-detail-card">
              <div className="alphabet-detail-top">
                <div className="alphabet-detail-main-letter">{guidedLetter.letter}</div>
                <div className="alphabet-detail-main-info">
                  <div className="alphabet-detail-name">{guidedLetter.name}</div>
                  {guidedLetter.soundExample && (
                    <div className="alphabet-detail-sound">{guidedLetter.soundExample}</div>
                  )}
                </div>
              </div>

              <div className="alphabet-forms-row">
                <div className="alphabet-form">
                  <div className="alphabet-form-label">ISOLATED</div>
                  <div className="alphabet-form-value">{guidedLetter.forms.isolated}</div>
                </div>
                <div className="alphabet-form">
                  <div className="alphabet-form-label">INITIAL</div>
                  <div className="alphabet-form-value">{guidedLetter.forms.initial}</div>
                </div>
                <div className="alphabet-form">
                  <div className="alphabet-form-label">MEDIAL</div>
                  <div className="alphabet-form-value">{guidedLetter.forms.medial}</div>
                </div>
                <div className="alphabet-form">
                  <div className="alphabet-form-label">FINAL</div>
                  <div className="alphabet-form-value">{guidedLetter.forms.final}</div>
                </div>
              </div>

              {/* SHORT VOWELS — UPDATED STRUCTURE */}
              {renderShortVowelPills()}

              {/* NOTE */}
              {guidedLetter.note && <p className="alphabet-detail-note">{guidedLetter.note}</p>}

              {/* AUDIO BUTTONS */}
              <div className="alphabet-audio-row">
                {/* PRIMARY FIRST: HEAR IN ENGLISH */}
                <button
                  type="button"
                  className="alphabet-audio-button"
                  onClick={() => speakText(guidedLetter.name, "en-US", true)}
                >
                  🔊 Hear in English
                </button>
                {/* SECONDARY SECOND: HEAR IN ARABIC (SHOWS TIP) */}
                <button
                  type="button"
                  className="alphabet-audio-button secondary"
                  onClick={() => handleHearLetter(guidedLetter.letter)}
                >
                  🔊 Hear in Arabic
                </button>
              </div>

              {letterTipVisible && (
                <p className="alphabet-letter-tip">
                  This button uses Arabic text-to-speech. If your device has no Arabic voice installed, it might be silent.
                  <button
                    type="button"
                    className="alphabet-help-button"
                    onClick={() => navigate("/arabic-tts-help")}
                  >
                    Help
                  </button>
                </p>
              )}
            </div>

            {/* HIDE/SHOW HARAKAT GUIDE */}
            {renderHarakatDropdown()}

            {/* NAV ROW */}
            <div className="guided-nav-row">
              <button className="guided-nav-button" onClick={goPrevLetter}>
                ⬅ Prev
              </button>
              <button className="guided-nav-button" onClick={goNextLetter}>
                Next ➡
              </button>
            </div>

            {/* QUIZ */}
            {guidedGroup && (
              <div className="guided-quiz-panel">
                <button type="button" className="guided-quiz-button" onClick={handleStartGroupQuiz}>
                  📝 Practice this group
                </button>

                {quizQuestion && (
                  <div
                    className={`quiz-card ${quizStatus === "correct" ? "quiz-card-correct" : ""} ${
                      quizStatus === "wrong" ? "quiz-card-wrong" : ""
                    }`}
                  >
                    <div className="quiz-question">
                      Tap the letter for: <span className="quiz-target-name">{quizQuestion.target.name}</span>
                    </div>

                    <div className="quiz-options-row">
                      {quizQuestion.options.map((opt) => (
                        <button
                          key={`${opt.letter.id}-${opt.formKey}`}
                          className="quiz-option"
                          onClick={() => handleQuizAnswer(opt)}
                        >
                          <span className="quiz-option-letter">{opt.letter.forms[opt.formKey]}</span>
                          {/* English name intentionally omitted */}
                        </button>
                      ))}
                    </div>

                    {quizFeedback && <div className="quiz-feedback">{quizFeedback}</div>}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* ===========================
              OVERVIEW TAB
        =========================== */}
        {activeTab === "overview" && (
          <section className="alphabet-section">
            <p className="alphabet-mode-description">Browse all letters. Tap a letter to explore.</p>

            <div className="alphabet-grid">
              {arabicAlphabet.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`alphabet-tile ${
                    selectedOverview.id === item.id ? "alphabet-tile-active" : ""
                  }`}
                  onClick={() => {
                    stopTTS();
                    setSelectedOverview(item);
                  }}
                >
                  <span className="alphabet-tile-letter">{item.letter}</span>
                  <span className="alphabet-tile-name">{item.name}</span>
                </button>
              ))}
            </div>

            {selectedOverview && (
              <div className="alphabet-detail-card">
                <div className="alphabet-detail-top">
                  <div className="alphabet-detail-main-letter">{selectedOverview.letter}</div>
                  <div className="alphabet-detail-main-info">
                    <div className="alphabet-detail-name">{selectedOverview.name}</div>
                    {selectedOverview.soundExample && (
                      <div className="alphabet-detail-sound">{selectedOverview.soundExample}</div>
                    )}
                  </div>
                </div>

                <div className="alphabet-forms-row">
                  <div className="alphabet-form">
                    <div className="alphabet-form-label">ISOLATED</div>
                    <div className="alphabet-form-value">{selectedOverview.forms.isolated}</div>
                  </div>
                  <div className="alphabet-form">
                    <div className="alphabet-form-label">INITIAL</div>
                    <div className="alphabet-form-value">{selectedOverview.forms.initial}</div>
                  </div>
                  <div className="alphabet-form">
                    <div className="alphabet-form-label">MEDIAL</div>
                    <div className="alphabet-form-value">{selectedOverview.forms.medial}</div>
                  </div>
                  <div className="alphabet-form">
                    <div className="alphabet-form-label">FINAL</div>
                    <div className="alphabet-form-value">{selectedOverview.forms.final}</div>
                  </div>
                </div>

                <div className="alphabet-audio-row">
                  {/* PRIMARY FIRST: HEAR IN ENGLISH */}
                  <button
                    type="button"
                    className="alphabet-audio-button"
                    onClick={() => speakText(selectedOverview.name, "en-US", true)}
                  >
                    🔊 Hear in English
                  </button>
                  {/* SECONDARY SECOND: HEAR IN ARABIC (SHOWS TIP IN GUIDED TAB) */}
                  <button
                    type="button"
                    className="alphabet-audio-button secondary"
                    onClick={() => handleHearLetter(selectedOverview.letter)}
                  >
                    🔊 Hear in Arabic
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ===========================
              CONNECTIVITY TAB
        =========================== */}
        {activeTab === "connectivity" && (
          <section className="alphabet-section">
            <p className="alphabet-mode-description">
              Some letters connect both ways, others only one way. These rules help you read joined Arabic text.
            </p>

            <div className="connectivity-row">
              <div className="connectivity-card">
                <h2>❌ Letters that do NOT connect after</h2>
                <p className="connectivity-sub">These break the connection and reset the next letter.</p>
                <div className="connectivity-pill-row">
                  {arabicAlphabet
                    .filter((l) => !l.connectAfter)
                    .map((l) => (
                      <div key={l.id} className="connectivity-pill">
                        <span className="connectivity-letter">{l.letter}</span>
                        <span className="connectivity-name">{l.name}</span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="connectivity-card">
                <h2>✔ Fully connecting letters</h2>
                <p className="connectivity-sub">These connect on both sides in words.</p>
                <div className="connectivity-pill-row">
                  {arabicAlphabet
                    .filter((l) => l.connectAfter)
                    .map((l) => (
                      <div key={l.id} className="connectivity-pill">
                        <span className="connectivity-letter">{l.letter}</span>
                        <span className="connectivity-name">{l.name}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ===========================
              BUILDER TAB
        =========================== */}
        {activeTab === "builder" && (
          <section className="alphabet-section">
            <p className="alphabet-mode-description">Tap letters to build a word and see how shapes change.</p>

            <div className="builder-top-row">
              <div className="builder-output-card">
                <div className="builder-output-label">Your shaped word:</div>
                <div className="builder-output-value">{shapedWord || "—"}</div>

                <div className="builder-raw-row">
                  <span className="builder-raw-label">Isolated letters:</span>
                  <span className="builder-raw-value">
                    {builderLetters.length > 0 ? builderLetters.map((l) => l.letter).join(" ") : "—"}
                  </span>
                </div>
              </div>

              <div className="builder-controls-card">
                <div className="builder-controls-label">Try a preset:</div>

                <div className="builder-preset-row">
                  <button
                    className="builder-preset-button"
                    onClick={() => setBuilderLetters([arabicAlphabet[1], arabicAlphabet[27], arabicAlphabet[2]])}
                  >
                    بيت (bayt)
                  </button>

                  <button
                    className="builder-preset-button"
                    onClick={() => setBuilderLetters([arabicAlphabet[1], arabicAlphabet[0], arabicAlphabet[1], arabicAlphabet[0]])}
                  >
                    بابا (baba)
                  </button>

                  <button
                    className="builder-preset-button"
                    onClick={() => setBuilderLetters([arabicAlphabet[24], arabicAlphabet[26], arabicAlphabet[9]])}
                  >
                    نور (noor)
                  </button>
                </div>

                <button className="builder-clear-button" onClick={() => setBuilderLetters([])}>
                  Clear
                </button>
              </div>
            </div>

            <div className="builder-grid-label">Tap letters to add them:</div>

            <div className="alphabet-grid builder-grid">
              {arabicAlphabet.map((item) => (
                <button
                  key={item.id}
                  className="alphabet-tile"
                  onClick={() => setBuilderLetters((prev) => [...prev, item])}
                >
                  <span className="alphabet-tile-letter">{item.letter}</span>
                  <span className="alphabet-tile-name">{item.name}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ===========================
              TOP WORDS TAB (NEW)
        =========================== */}
        {activeTab === "topwords" && (
          <section className="alphabet-section">
            <div className="topwords-hero">
              <div className="topwords-title-row">
                <div className="topwords-title">📚 Top 200 Quran Words</div>
                <div className="topwords-badge">{filteredTopWords.length} shown</div>
              </div>
              <div className="topwords-subtitle">
                Search by Arabic, transliteration, or meaning. Tap 🔊 to hear a word.
              </div>

              <div className="topwords-controls">
                <div className="topwords-search-wrap">
                  <span className="topwords-search-icon">🔎</span>
                  <input
                    value={topWordsQuery}
                    onChange={(e) => setTopWordsQuery(e.target.value)}
                    className="topwords-search"
                    placeholder="Search: مثال (example), rahma, mercy..."
                    type="text"
                    inputMode="search"
                  />
                  {topWordsQuery && (
                    <button
                      type="button"
                      className="topwords-clear"
                      onClick={() => setTopWordsQuery("")}
                      aria-label="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  className={`topwords-toggle ${topWordsShowArabicOnly ? "topwords-toggle-on" : ""}`}
                  onClick={() => setTopWordsShowArabicOnly((p) => !p)}
                >
                  {topWordsShowArabicOnly ? "Arabic only: ON" : "Arabic only: OFF"}
                </button>
              </div>
            </div>

            <div className="topwords-list">
              {filteredTopWords.length === 0 ? (
                <div className="topwords-empty">
                  <div className="topwords-empty-title">No matches found</div>
                  <div className="topwords-empty-text">Try a shorter search (example: “mercy” or “الله”).</div>
                </div>
              ) : (
                filteredTopWords.map((w, i) => (
                  <div key={w.id} className="topwords-card">
                    <div className="topwords-left">
                      <div className="topwords-rank">{i + 1}</div>
                    </div>

                    <div className="topwords-main">
                      <div className="topwords-arabic">{w.arabic}</div>

                      {!topWordsShowArabicOnly && (
                        <div className="topwords-meta">
                          {w.transliteration && (
                            <div className="topwords-translit">{w.transliteration}</div>
                          )}
                          {w.meaning && (
                            <div className="topwords-meaning">{w.meaning}</div>
                          )}
                        </div>
                      )}

                      {!topWordsShowArabicOnly && w.count !== null && w.count !== undefined && (
                        <div className="topwords-count">Occurrences: {String(w.count)}</div>
                      )}
                    </div>

                    <div className="topwords-actions">
                      <button
                        type="button"
                        className="topwords-audio"
                        onClick={() => speakText(w.arabic, "ar-SA", true, 0.85)}
                        title="Hear Arabic"
                      >
                        🔊
                      </button>
                      {!topWordsShowArabicOnly && w.meaning && (
                        <button
                          type="button"
                          className="topwords-audio secondary"
                          onClick={() => speakText(w.meaning, "en-US", true, 1)}
                          title="Hear meaning (English)"
                        >
                          🔊
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* BACK BUTTON */}
        <button
          type="button"
          className="alphabet-back-button"
          onClick={() => {
            stopTTS();
            navigate("/learning-mode");
          }}
        >
          ⬅ Back to Learning Mode
        </button>
      </div>
    </div>
  );
}

export default ArabicAlphabet;
