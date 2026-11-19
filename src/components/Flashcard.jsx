// /src/components/Flashcard.jsx

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Flashcard.css";
import namesOfAllah from "../data/names";
import nameReflections from "../data/nameReflections";
import QuranConnection from "./QuranConnection";
import { buildReviewQueue, getNameState, loadProfile, nameId, recordNameAttempt, saveReflection } from "../utils/learningProfile";
import { shuffle } from "../utils/gameUtils";

const FLASHCARD_POSITION_KEY = "flashcardLastName";

// Helper: build a stable ID for each name
function getCardId(card) {
  if (!card) return "";
  const safeName = card.name || "";
  const safeArabic = card.arabic || "";
  return `${safeName}|||${safeArabic}`;
}

// Helper: pause global/background music and any <audio> elements
function pauseBackgroundMusic() {
  if (typeof window === "undefined") return;

  try {
    // If you store the audio element globally
    if (window.globalMusicAudio && !window.globalMusicAudio.paused) {
      window.globalMusicAudio.pause();
    }

    // If GlobalMusicPlayer uses a specific id
    const bgEl = document.getElementById("global-music-audio");
    if (bgEl && !bgEl.paused) {
      bgEl.pause();
    }

    // Fallback: pause ANY playing <audio> on the page
    const allAudioEls = document.querySelectorAll("audio");
    allAudioEls.forEach((el) => {
      if (!el.paused) {
        el.pause();
      }
    });
  } catch (e) {
    console.warn("Could not pause background music:", e);
  }
}

// Helper: stop any ongoing TTS speech
function stopSpeech() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

// Helper: safely speak text using browser TTS
function speakText(text, lang = "en-US", onStatusChange) {
  if (!text) return;
  if (typeof window === "undefined" || !window.speechSynthesis) {
    onStatusChange?.("unavailable");
    return null;
  }

  // Stop any ongoing speech first
  window.speechSynthesis.cancel();

  // Pause background music so TTS is clear
  pauseBackgroundMusic();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.onstart = () => onStatusChange?.("playing");
  utterance.onend = () => onStatusChange?.("idle");
  utterance.onerror = () => onStatusChange?.("unavailable");
  window.speechSynthesis.speak(utterance);
  return utterance;
}

/* Arabic TTS helper with voice fallback (matches alphabet behavior) */
function speakArabicWithFallback(text, preferredLang = "ar-SA", onStatusChange) {
  if (!text) return;
  if (typeof window === "undefined" || !window.speechSynthesis) {
    onStatusChange?.("unavailable");
    return null;
  }

  // Stop any speech already happening
  window.speechSynthesis.cancel();

  // Pause background music so TTS is clear
  pauseBackgroundMusic();

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
      // 2) Non-Arabic case – try to honor preferredLang
      const exactMatch = voices.find(
        (v) => v.lang && v.lang.toLowerCase() === lowerPreferred
      );
      const prefixMatch = voices.find(
        (v) =>
          v.lang &&
          v.lang.toLowerCase().startsWith(preferredPrefix)
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

  utter.onstart = () => onStatusChange?.("playing");
  utter.onend = () => onStatusChange?.("idle");
  utter.onerror = () => onStatusChange?.("unavailable");

  window.speechSynthesis.speak(utter);
  return utter;
}

// Helper: get reflection text for a given card
function getReflectionForCard(card) {
  if (!card) return "";
  const index = namesOfAllah.findIndex(
    (n) => n.name === card.name && n.arabic === card.arabic
  );
  if (index === -1) return "";
  return nameReflections[index] || "";
}

function Flashcard() {
  const [cardList, setCardList] = useState([...namesOfAllah]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [letterTipVisible, setLetterTipVisible] = useState(false);

  // NEW: Favorites state
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState([]); // stores card IDs from getCardId
  const [favoriteLimitMessage, setFavoriteLimitMessage] = useState("");
  const [profile, setProfile] = useState(() => loadProfile());
  const [journalText, setJournalText] = useState("");
  const [journalSaved, setJournalSaved] = useState(false);
  const [studyCards, setStudyCards] = useState(null);
  const [sessionLabel, setSessionLabel] = useState("");
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionRated, setSessionRated] = useState(0);
  const [showDeepDive, setShowDeepDive] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [audioStatus, setAudioStatus] = useState("idle");
  const advanceTimerRef = useRef(null);
  const noticeTimerRef = useRef(null);
  const tipTimerRef = useRef(null);
  const touchStartRef = useRef(null);
  const suppressClickRef = useRef(false);

  const navigate = useNavigate();

  const announce = (message) => {
    setStatusMessage(message);
    window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => setStatusMessage(""), 2200);
  };

  const clearInteractionFocus = () => {
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  // Load favorites from localStorage once
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("flashcardFavorites");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setFavorites(parsed);
      }
    } catch (err) {
      console.warn("Could not parse favorites from localStorage:", err);
    }
  }, []);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("name") || window.localStorage.getItem(FLASHCARD_POSITION_KEY);
    if (!requested) return;
    const found = cardList.findIndex((card) => card.name === requested);
    if (found >= 0) setCurrentIndex(found);
  }, []);

  // Compute active list (All vs Favorites view)
  const activeList = useMemo(() => {
    if (studyCards) return studyCards;
    if (!showFavoritesOnly) return cardList;
    if (!favorites || favorites.length === 0) return [];
    return cardList.filter((card) => favorites.includes(getCardId(card)));
  }, [cardList, showFavoritesOnly, favorites, studyCards]);

  const activeLength = activeList.length;

  // Ensure currentIndex is always within bounds of activeLength
  useEffect(() => {
    if (activeLength === 0) {
      // nothing to clamp
      return;
    }
    if (currentIndex >= activeLength) {
      setCurrentIndex(activeLength - 1);
    }
  }, [activeLength, currentIndex]);

  const nextCard = () => {
    // Stop any active TTS when moving to a new card
    stopSpeech();
    setFlipped(false);
    setShowReflection(false);
    setLetterTipVisible(false);
    setShowDeepDive(false);
    setAudioStatus("idle");
    clearInteractionFocus();

    if (activeLength === 0) return;

    setCurrentIndex((prevIndex) => (prevIndex + 1) % activeLength);
  };

  const prevCard = () => {
    stopSpeech();
    setFlipped(false);
    setShowReflection(false);
    setLetterTipVisible(false);
    setShowDeepDive(false);
    setAudioStatus("idle");
    clearInteractionFocus();

    if (activeLength === 0) return;

    setCurrentIndex((prevIndex) =>
      (prevIndex - 1 + activeLength) % activeLength
    );
  };

  const shuffleCard = () => {
    stopSpeech();
    if (studyCards) setStudyCards((cards) => shuffle(cards));
    else if (showFavoritesOnly) {
      const favoriteCards = cardList.filter((card) => favorites.includes(getCardId(card)));
      const favoriteIds = new Set(favoriteCards.map(getCardId));
      const remaining = cardList.filter((card) => !favoriteIds.has(getCardId(card)));
      setCardList([...shuffle(favoriteCards), ...remaining]);
    } else setCardList((cards) => shuffle(cards));
    setCurrentIndex(0);
    setFlipped(false);
    setShowReflection(false);
    setLetterTipVisible(false);
    setShowDeepDive(false);
    clearInteractionFocus();
    announce(`Shuffled ${sessionLabel || (showFavoritesOnly ? "favorites" : "all Names")}`);
  };

  const handleFlip = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    setShowReflection(false);
    setLetterTipVisible(false);
    setFlipped((prev) => !prev);
  };

  const handleCardKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleFlip();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      nextCard();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      prevCard();
    } else if (e.key.toLowerCase() === "s") {
      e.preventDefault();
      shuffleCard();
    }
  };

  const goBack = () => {
    // Leaving the screen – stop any active speech
    stopSpeech();
    navigate("/learning-mode");
  };

  const progress =
    activeLength > 0 ? ((currentIndex + 1) / activeLength) * 100 : 0;

  const currentCard =
    activeLength > 0 && currentIndex >= 0
      ? activeList[currentIndex]
      : null;
  const reflectionText = getReflectionForCard(currentCard);
  const masteryState = currentCard ? getNameState(profile, currentCard) : "new";

  useEffect(() => {
    if (currentCard && typeof window !== "undefined") {
      window.localStorage.setItem(FLASHCARD_POSITION_KEY, currentCard.name);
    }
  }, [currentCard]);

  useEffect(() => () => {
    window.clearTimeout(advanceTimerRef.current);
    window.clearTimeout(noticeTimerRef.current);
    window.clearTimeout(tipTimerRef.current);
    stopSpeech();
  }, []);

  useEffect(() => {
    const saved = currentCard ? profile.reflections?.[nameId(currentCard)]?.text || "" : "";
    setJournalText(saved);
    setJournalSaved(false);
  }, [currentCard, profile.reflections]);

  const rateCard = (correct, rating) => {
    const next = recordNameAttempt(currentCard, correct, { rating, source: "flashcards", seconds: 25 });
    setProfile(next);
    setSessionRated((count) => count + 1);
    clearInteractionFocus();
    window.clearTimeout(advanceTimerRef.current);
    if (studyCards && currentIndex === activeLength - 1) {
      advanceTimerRef.current = window.setTimeout(() => {
        setSessionComplete(true);
        setFlipped(false);
      }, 180);
    } else {
      advanceTimerRef.current = window.setTimeout(nextCard, 180);
    }
  };

  const handleSaveReflection = () => {
    const next = saveReflection(currentCard, journalText);
    setProfile(next);
    setJournalSaved(true);
    announce("Private reflection saved");
    window.setTimeout(() => setJournalSaved(false), 1800);
  };

  // NEW: Toggle favorite for current card
  const toggleFavorite = (card) => {
    if (!card || typeof window === "undefined") return;
    const cardId = getCardId(card);

    setFavorites((prev) => {
      const already = prev.includes(cardId);
      if (already) {
        const updated = prev.filter((id) => id !== cardId);
        window.localStorage.setItem(
          "flashcardFavorites",
          JSON.stringify(updated)
        );
        announce("Removed from favorites");
        return updated;
      } else {
        const updated = [...prev, cardId];
        window.localStorage.setItem(
          "flashcardFavorites",
          JSON.stringify(updated)
        );
        announce("Saved to favorites");
        return updated;
      }
    });
  };

  const isCurrentFavorite = currentCard
    ? favorites.includes(getCardId(currentCard))
    : false;

  // Audio handlers
  // FRONT – English name
  const handleSpeakArabicName = () => {
    if (!currentCard) return;
    if (audioStatus === "playing") { stopSpeech(); setAudioStatus("idle"); return; }
    const spokenName =
      currentCard.name || currentCard.transliteration || currentCard.arabic;
    speakText(spokenName, "en-US", setAudioStatus);
  };

  // FRONT – Arabic audio (now using fallback helper)
  const handleSpeakNameInArabic = () => {
    if (!currentCard) return;
    if (audioStatus === "playing") { stopSpeech(); setAudioStatus("idle"); return; }
    const arabicText =
      currentCard.arabic || currentCard.name || currentCard.transliteration;
    speakArabicWithFallback(arabicText, "ar-SA", setAudioStatus);
    setLetterTipVisible(true);
    window.clearTimeout(tipTimerRef.current);
    tipTimerRef.current = window.setTimeout(() => setLetterTipVisible(false), 5000);
  };

  // BACK – meaning
  const handleSpeakMeaning = () => {
    if (!currentCard) return;
    if (audioStatus === "playing") { stopSpeech(); setAudioStatus("idle"); return; }
    speakText(currentCard.meaning, "en-US", setAudioStatus);
  };

  // BACK – reflection
  const handleSpeakReflection = () => {
    if (!reflectionText) return;
    if (audioStatus === "playing") { stopSpeech(); setAudioStatus("idle"); return; }
    speakText(reflectionText, "en-US", setAudioStatus);
  };

  // Search handler – finds first match in current active list
  const handleSearch = () => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return;

    const searchBase = cardList;

    const foundIndex = searchBase.findIndex((card) => {
      const name = (card.name || "").toLowerCase();
      const meaning = (card.meaning || "").toLowerCase();
      const arabic = (card.arabic || "").toLowerCase();
      return (
        name.includes(term) ||
        meaning.includes(term) ||
        arabic.includes(term)
      );
    });

    if (foundIndex !== -1) {
      // Jumping to a new card → stop any active speech
      stopSpeech();
      setFlipped(false);
      setShowReflection(false);
      setLetterTipVisible(false);
      setStudyCards(null);
      setSessionLabel("");
      setSessionComplete(false);
      setShowFavoritesOnly(false);
      setCurrentIndex(foundIndex);
      announce(`Showing ${searchBase[foundIndex].name}`);
      clearInteractionFocus();
    } else {
      announce(`No Name found for “${searchTerm.trim()}”`);
    }
  };

  const startSession = (type) => {
    const cards = type === "review"
      ? buildReviewQueue(profile, 10).map((item) => item.card)
      : shuffle(namesOfAllah).slice(0, 10);
    setStudyCards(cards);
    setShowFavoritesOnly(false);
    setSessionLabel(type === "review" ? "Needs Review" : "Study 10");
    setSessionComplete(false);
    setSessionRated(0);
    setCurrentIndex(0);
    setFlipped(false);
    setShowDeepDive(false);
    announce(`${type === "review" ? "Review" : "Study"} session started`);
  };

  const endSession = () => {
    setStudyCards(null);
    setSessionLabel("");
    setSessionComplete(false);
    setSessionRated(0);
    setCurrentIndex(0);
    setFlipped(false);
  };

  const handleTouchStart = (event) => {
    const touch = event.changedTouches?.[0];
    if (touch) touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event) => {
    const start = touchStartRef.current;
    const touch = event.changedTouches?.[0];
    touchStartRef.current = null;
    if (!start || !touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
    suppressClickRef.current = true;
    if (dx < 0) nextCard();
    else prevCard();
  };

  return (
    <div className="flashcard-page">
      <header className="flashcard-header">
        <h1 className="flashcard-title">✨ Learn the 99 Names</h1>
        {currentCard && <div className={`flashcard-mastery-pill ${masteryState}`}>{masteryState === "review" ? "Needs review" : masteryState}</div>}
      </header>

      <div className="flashcard-session-actions" aria-label="Study sessions">
        <button type="button" onClick={() => startSession("study")}>Study 10</button>
        <button type="button" onClick={() => startSession("review")}>Needs Review</button>
        {studyCards && <button type="button" onClick={endSession}>End Session</button>}
      </div>

      <div className="progress-container">
        <div className="progress-text">
          {sessionLabel && <span>{sessionLabel} · </span>}{activeLength > 0 ? currentIndex + 1 : 0} / {activeLength}
        </div>
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Search bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        className="flashcard-search"
      >
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name or meaning..."
          aria-label="Search Names or meanings"
        />
        <button
          type="submit"
        >
          🔍 Search
        </button>
        {searchTerm && <button type="button" className="flashcard-search-clear" aria-label="Clear search" onClick={() => { setSearchTerm(""); clearInteractionFocus(); }}>×</button>}
      </form>

      <div className="flashcard-status" role="status" aria-live="polite">{statusMessage}</div>

      {/* NEW: All vs Favorites pills */}
      <div className="flashcard-tab-row">
        <button
          type="button"
          className={`flashcard-tab ${
            !showFavoritesOnly ? "flashcard-tab-active" : ""
          }`}
          onClick={() => {
            setShowFavoritesOnly(false);
            setStudyCards(null);
            setSessionLabel("");
            setCurrentIndex(0);
          }}
        >
          All Names
        </button>
        <button
          type="button"
          className={`flashcard-tab ${
            showFavoritesOnly ? "flashcard-tab-active" : ""
          }`}
          onClick={() => {
            setShowFavoritesOnly(true);
            setStudyCards(null);
            setSessionLabel("");
            setCurrentIndex(0);
          }}
        >
          ⭐ Favorites ({favorites.length})
        </button>
      </div>

      {/* Optional: small limit message (premium banner via CSS) */}
      {favoriteLimitMessage && (
        <div className="favorite-limit-message">
          {favoriteLimitMessage}
        </div>
      )}

      {sessionComplete ? (
        <section className="flashcard-session-complete" aria-live="polite">
          <span aria-hidden="true">✦</span>
          <h2>Session complete</h2>
          <p>You reviewed {sessionRated} Names. A short session today makes tomorrow’s recall stronger.</p>
          <div><button type="button" onClick={() => startSession(sessionLabel === "Needs Review" ? "review" : "study")}>Study another 10</button><button type="button" onClick={endSession}>Return to all Names</button></div>
        </section>
      ) : currentCard ? (
        <div
          className="flashcard-wrapper"
          onClick={handleFlip}
          onKeyDown={handleCardKeyDown}
          role="button"
          tabIndex={0}
          aria-pressed={flipped}
          aria-label="Flashcard: tap or press Enter/Space to flip"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className={`flashcard ${flipped ? "flip" : ""}`}>
            {/* FRONT */}
            <div className="flashcard-front">
              <button
                type="button"
                className={`favorite-toggle-button ${
                  isCurrentFavorite ? "is-favorite" : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(currentCard);
                }}
                aria-label={
                  isCurrentFavorite
                    ? "Remove from favorites"
                    : "Add to favorites"
                }
              >
                ★
              </button>
              <div className="arabic-name">{currentCard.arabic}</div>
              <div className="english-name">{currentCard.name}</div>
              <div className="tap-hint">(Tap to reveal meaning)</div>
            </div>

            {/* BACK */}
            <div className="flashcard-back">
              <button
                type="button"
                className={`favorite-toggle-button ${
                  isCurrentFavorite ? "is-favorite" : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(currentCard);
                }}
                aria-label={
                  isCurrentFavorite
                    ? "Remove from favorites"
                    : "Add to favorites"
                }
              >
                ★
              </button>

              <p className="english-meaning">{currentCard.meaning}</p>

              <button
                type="button"
                className="reflection-toggle-button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReflection((prev) => !prev);
                }}
              >
                {showReflection ? "Hide Reflection" : "Read Reflection"}
              </button>

              {showReflection && reflectionText && (
                <div className="reflection-panel">
                  <p>{reflectionText}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Empty state when Favorites is selected but no favorites yet
        <div className="flashcard-empty-state">
          {showFavoritesOnly ? (
            <p>
              You don&apos;t have any favorites yet. Tap the ★ icon on a
              name to save it here.
            </p>
          ) : (
            <p>No cards available.</p>
          )}
        </div>
      )}

      {/* Audio controls – depend on FRONT vs BACK */}
      {!sessionComplete && <div className="flashcard-audio-buttons">
        {/* FRONT: name audio (English + Arabic) */}
        {!flipped && (
          <>
            <button
              type="button"
              className="audio-button audio-button-name"
              onClick={handleSpeakArabicName}
            >
              {audioStatus === "playing" ? "■ Stop audio" : "🔊 Hear in English"}
            </button>
            <button
              type="button"
              className="audio-button audio-button-name"
              onClick={handleSpeakNameInArabic}
            >
              {audioStatus === "playing" ? "■ Stop audio" : "🔊 Hear in Arabic"}
            </button>
          </>
        )}

        {/* BACK: meaning + reflection (if available) */}
        {flipped && (
          <>
            <button
              type="button"
              className="audio-button audio-button-meaning"
              onClick={handleSpeakMeaning}
            >
              {audioStatus === "playing" ? "■ Stop audio" : "🔊 Hear Meaning"}
            </button>

            {reflectionText && (
              <button
                type="button"
                className="audio-button audio-button-reflection"
                onClick={handleSpeakReflection}
              >
                🔊 Hear Reflection
              </button>
            )}
          </>
        )}
      </div>}

      {!sessionComplete && flipped && currentCard && (
        <section className="flashcard-learning-tools">
          <div className="flashcard-recall"><strong>How well did you remember it?</strong><div><button onClick={() => rateCard(false, "again")}>Again</button><button onClick={() => rateCard(true, "hard")}>Hard</button><button onClick={() => rateCard(true, "good")}>Got it</button><button onClick={() => rateCard(true, "easy")}>Easy</button></div></div>
          <button type="button" className="flashcard-deep-toggle" aria-expanded={showDeepDive} onClick={() => setShowDeepDive((open) => !open)}>{showDeepDive ? "Hide deeper learning" : "Learn deeper"}<span aria-hidden="true">{showDeepDive ? "−" : "+"}</span></button>
          {showDeepDive && <div className="flashcard-deep-content"><QuranConnection nameIndex={namesOfAllah.indexOf(currentCard)} compact /><div className="flashcard-journal"><label htmlFor="private-reflection">My private reflection</label><textarea id="private-reflection" value={journalText} onChange={(e) => setJournalText(e.target.value)} placeholder={`How could remembering ${currentCard.name} shape your day?`} /><button onClick={handleSaveReflection}>{journalSaved ? "Saved ✓" : "Save reflection"}</button></div></div>}
        </section>
      )}

      {/* Arabic TTS tip + Help (front side only) */}
      {!flipped && letterTipVisible && (
        <p className="flashcard-tts-tip">
          This button uses Arabic text-to-speech. If your device has no Arabic
          voice installed, it might be silent.{" "}
          <button
            type="button"
            className="alphabet-letter-help-button"
            onClick={() => {
              stopSpeech();
              navigate("/arabic-tts-help");
            }}
          >
            Help
          </button>
        </p>
      )}

      {!sessionComplete && <div className="flashcard-buttons" aria-label="Flashcard navigation">
        <button onClick={prevCard} className="ghost-button">
          ← Previous
        </button>
        <button onClick={handleFlip} className="primary-button flashcard-reveal-button">
          {flipped ? "Show Name" : "Reveal"}
        </button>
        <button onClick={nextCard} className="ghost-button">
          Next →
        </button>
      </div>}

      {!sessionComplete && <button type="button" onClick={shuffleCard} className="flashcard-shuffle-button">↻ Shuffle this set</button>}

      <button className="back-home-button" onClick={goBack}>
        ⬅ Back
      </button>
    </div>
  );
}

export default Flashcard;
