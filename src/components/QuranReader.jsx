import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "@fontsource/amiri-quran/400.css";
import { fetchWithOfflineCache, loadBookmarks, loadLastRead, loadQuranPreferences, normalizeArabic, saveLastRead, saveQuranPreferences, searchVerses, toggleBookmark } from "../utils/quranReader";
import { speakEnglishVerse, stopVerseSpeech } from "../utils/quranSpeech";
import { getQuranProgress, recordQuranVerseRead, setQuranDailyGoal } from "../utils/quranProgress";
import "../styles/QuranReader.css";

export default function QuranReader() {
  const navigate = useNavigate();
  const { surahNumber } = useParams();
  const lastRead = useMemo(loadLastRead, []);
  const initialNumber = Math.min(114, Math.max(1, Number(surahNumber) || lastRead.surah || 1));
  const [chapters, setChapters] = useState([]);
  const [chapter, setChapter] = useState(null);
  const [selected, setSelected] = useState(initialNumber);
  const [prefs, setPrefs] = useState(loadQuranPreferences);
  const [bookmarks, setBookmarks] = useState(loadBookmarks);
  const [listQuery, setListQuery] = useState("");
  const [verseQuery, setVerseQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [error, setError] = useState("");
  const [speakingAyah, setSpeakingAyah] = useState(null);
  const [readingProgress, setReadingProgress] = useState(getQuranProgress);
  const verseRefs = useRef({});

  useEffect(() => {
    document.body.classList.add("quran-reader-active");
    return () => document.body.classList.remove("quran-reader-active");
  }, []);
  useEffect(() => { fetchWithOfflineCache("/quran/chapters.json").then(setChapters).catch(() => setError("The chapter list could not be loaded.")); }, []);
  useEffect(() => {
    let active = true; setChapter(null); setError("");
    fetchWithOfflineCache(`/quran/chapters/${selected}.json`).then((data) => { if (active) setChapter(data); }).catch(() => active && setError("This chapter is unavailable offline. Reconnect once to save it on this device."));
    if (window.location.pathname !== `/quran/${selected}/`) {
      const sameSurah = window.location.pathname.replace(/\/+$/, "") === `/quran/${selected}`;
      navigate(`/quran/${selected}/${window.location.search}${sameSurah ? window.location.hash : ""}`, { replace: true });
    }
    return () => { active = false; };
  }, [selected, navigate]);
  useEffect(() => { saveQuranPreferences(prefs); }, [prefs]);
  useEffect(() => () => stopVerseSpeech(), []);
  useEffect(() => { stopVerseSpeech(); setSpeakingAyah(null); }, [selected]);
  useEffect(() => {
    if (!chapter || window.location.hash.startsWith("#ayah-") || selected !== lastRead.surah || !lastRead.ayah) return;
    const id = setTimeout(() => verseRefs.current[lastRead.ayah]?.scrollIntoView({ block: "center" }), 250);
    return () => clearTimeout(id);
  }, [chapter, selected, lastRead]);
  useEffect(() => {
    if (!chapter) return;
    const match = window.location.hash.match(/^#ayah-(\d+)$/);
    if (!match) return;
    const ayah = Number(match[1]);
    const id = setTimeout(() => {
      const node = verseRefs.current[ayah];
      if (!node) return;
      node.scrollIntoView({ block: "center", behavior: "smooth" });
      node.classList.add("quran-linked-ayah");
      saveLastRead(selected, ayah);
      setTimeout(() => node.classList.remove("quran-linked-ayah"), 2600);
    }, 220);
    return () => clearTimeout(id);
  }, [chapter, selected]);
  useEffect(() => {
    if (!chapter || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) {
        const ayah = Number(visible.target.dataset.ayah);
        saveLastRead(selected, ayah);
        setReadingProgress(recordQuranVerseRead(selected, ayah));
      }
    }, { threshold: [0.55] });
    Object.values(verseRefs.current).forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, [chapter, selected]);

  const filteredChapters = chapters.filter((item) => `${item.number} ${item.nameEnglish} ${item.meaningEnglish} ${normalizeArabic(item.nameArabic)}`.toLowerCase().includes(normalizeArabic(listQuery.toLowerCase())));
  const chooseChapter = (number, ayah) => { setSelected(number); setMenuOpen(false); setResults([]); setVerseQuery(""); setTimeout(() => ayah && verseRefs.current[ayah]?.scrollIntoView({ block: "center" }), 250); };
  const runSearch = async (event) => {
    event.preventDefault(); if (verseQuery.trim().length < 2) return;
    setSearching(true); setError("");
    try { setResults(searchVerses(await fetchWithOfflineCache("/quran/search-index.json"), verseQuery)); } catch { setError("Search needs a connection the first time. Previously opened chapters still work offline."); }
    finally { setSearching(false); }
  };
  const remember = (ayah) => { saveLastRead(selected, ayah); };
  const bookmark = (ayah) => setBookmarks((current) => toggleBookmark(current, selected, ayah));
  const share = async (verse) => {
    const text = `${verse.arabic}\n\n${verse.english}\n— Qur’an ${selected}:${verse.number}`;
    if (navigator.share) await navigator.share({ title: `Qur’an ${selected}:${verse.number}`, text }).catch(() => {});
    else await navigator.clipboard?.writeText(text);
  };
  const listen = (verse) => {
    if (speakingAyah === verse.number) { stopVerseSpeech(); setSpeakingAyah(null); return; }
    const utterance = speakEnglishVerse(verse.english, {
      onStart: () => setSpeakingAyah(verse.number),
      onEnd: () => setSpeakingAyah(null),
      onError: () => setSpeakingAyah(null),
    });
    if (utterance) setSpeakingAyah(verse.number);
    else setError("English audio is not supported by this browser or device.");
  };

  return <div className={`quran-page quran-${prefs.theme}`}>
    <header className="quran-topbar">
      <button className="quran-icon-button quran-menu-button" onClick={() => setMenuOpen(true)} aria-label="Open chapter list">☰</button>
      <button className="quran-brand" onClick={() => navigate("/")}><span>QUR’AN</span><small>Read · Reflect · Return</small></button>
      <nav className="quran-header-nav" aria-label="Quran page shortcuts"><button onClick={() => navigate("/")}>← Home</button><button onClick={() => navigate("/my-dashboard")}>Dashboard</button></nav>
      <div className="quran-header-actions"><button className="quran-icon-button" onClick={() => setSettingsOpen(!settingsOpen)} aria-label="Reading settings">Aa</button></div>
    </header>
    <div className="quran-layout">
      {menuOpen && <button className="quran-scrim" onClick={() => setMenuOpen(false)} aria-label="Close chapter list" />}
      <aside className={`quran-sidebar ${menuOpen ? "open" : ""}`} aria-label="Quran chapters">
        <div className="quran-sidebar-head"><div><strong>114 Surahs</strong><small>Pick up where you left off</small></div><button onClick={() => setMenuOpen(false)} aria-label="Close">×</button></div>
        <button className="quran-continue" onClick={() => chooseChapter(lastRead.surah || 1, lastRead.ayah || 1)}><span>CONTINUE READING</span><strong>Surah {lastRead.surah || 1}, Ayah {lastRead.ayah || 1}</strong></button>
        <label className="quran-list-search"><span>⌕</span><input value={listQuery} onChange={(event) => setListQuery(event.target.value)} placeholder="Find a Surah" /></label>
        <div className="quran-chapter-list">{filteredChapters.map((item) => <button className={item.number === selected ? "active" : ""} key={item.number} onClick={() => chooseChapter(item.number)}><b>{item.number}</b><span><strong>{item.nameEnglish}</strong><small>{item.meaningEnglish} · {item.verseCount} ayahs</small></span><em lang="ar" dir="rtl">{item.nameArabic}</em></button>)}</div>
        <a className="quran-source-link" href="/quran/SOURCES.txt" target="_blank" rel="noreferrer">Text sources &amp; attribution</a>
      </aside>

      <main className="quran-reader">
        <section className="quran-reader-tools">
          <form onSubmit={runSearch}><input aria-label="Search Quran" value={verseQuery} onChange={(event) => setVerseQuery(event.target.value)} placeholder="Search Arabic or English" /><button>{searching ? "…" : "Search"}</button></form>
          <div className="quran-view-toggle" aria-label="Translation view">{["arabic", "both", "english"].map((view) => <button key={view} className={prefs.view === view ? "active" : ""} onClick={() => setPrefs({ ...prefs, view })}>{view[0].toUpperCase() + view.slice(1)}</button>)}</div>
        </section>

        {settingsOpen && <section className="quran-settings" aria-label="Reading settings"><label>Arabic size <input type="range" min="26" max="52" value={prefs.fontSize} onChange={(event) => setPrefs({ ...prefs, fontSize: Number(event.target.value) })} /></label><label>Daily goal <select value={readingProgress.goal} onChange={(event) => setReadingProgress(setQuranDailyGoal(event.target.value))}><option value="3">3 ayahs</option><option value="5">5 ayahs</option><option value="10">10 ayahs</option><option value="20">20 ayahs</option></select></label><button onClick={() => setPrefs({ ...prefs, theme: prefs.theme === "night" ? "paper" : "night" })}>{prefs.theme === "night" ? "Light reading theme" : "Night reading theme"}</button></section>}
        {error && <div className="quran-error" role="alert">{error}</div>}
        {results.length > 0 && <section className="quran-results"><div><strong>Search results</strong><button onClick={() => setResults([])}>Close</button></div>{results.map((result) => <button key={`${result.s}:${result.a}`} onClick={() => chooseChapter(result.s, result.a)}><b>{result.s}:{result.a}</b><span lang="ar" dir="rtl">{result.ar}</span><small>{result.en}</small></button>)}</section>}

        {!chapter && !error && <div className="quran-loading">Loading chapter…</div>}
        {chapter && <>
          <section className="quran-chapter-hero">
            <span>SURAH {chapter.number} · {chapter.revelationType.toUpperCase()}</span>
            <h1>{chapter.nameEnglish}</h1><div lang="ar" dir="rtl">{chapter.nameArabic}</div>
            <p>{chapter.meaningEnglish} · {chapter.verseCount} ayahs</p>
          </section>
          <section className={`quran-daily-challenge ${readingProgress.completed ? "complete" : ""}`} aria-label="Daily Quran reading challenge"><div className="quran-challenge-ring" style={{ "--challenge-progress": `${readingProgress.percent * 3.6}deg` }}><strong>{readingProgress.todayCount}</strong><small>/{readingProgress.goal}</small></div><div><span>DAILY QUR’AN CHALLENGE</span><h2>{readingProgress.completed ? "Today’s goal complete ✦" : `${Math.max(0, readingProgress.goal - readingProgress.todayCount)} ayahs to complete today`}</h2><p>{readingProgress.streak ? `${readingProgress.streak}-day reading streak · ` : ""}{readingProgress.total} unique ayahs explored</p></div><b>{readingProgress.completed ? "Completed" : `${readingProgress.percent}%`}</b><div className="quran-challenge-track"><i style={{ width: `${readingProgress.percent}%` }} /></div></section>
          <section className="quran-verses" style={{ "--arabic-size": `${prefs.fontSize}px` }}>
            {chapter.verses.map((verse) => { const marked = bookmarks.includes(`${selected}:${verse.number}`); return <article key={verse.number} data-ayah={verse.number} ref={(node) => { verseRefs.current[verse.number] = node; }} id={`ayah-${verse.number}`} onMouseEnter={() => remember(verse.number)} onFocus={() => remember(verse.number)}>
              <div className="quran-ayah-tools"><span>{chapter.number}:{verse.number}</span><div><button className={`quran-listen-button ${speakingAyah === verse.number ? "active" : ""}`} onClick={() => listen(verse)} aria-label={speakingAyah === verse.number ? "Stop English verse audio" : "Listen to English verse"}>{speakingAyah === verse.number ? "■ Stop" : "▶ Listen"}</button><button className={marked ? "active" : ""} onClick={() => bookmark(verse.number)} aria-label={marked ? "Remove bookmark" : "Bookmark ayah"}>♡</button><button onClick={() => share(verse)} aria-label="Share or copy ayah">↗</button></div></div>
              {prefs.view !== "english" && <p className="quran-arabic" lang="ar" dir="rtl">{verse.arabic}<i>{verse.number}</i></p>}
              {prefs.view !== "arabic" && <p className="quran-english">{verse.english}</p>}
            </article>; })}
          </section>
          <nav className="quran-chapter-nav" aria-label="Chapter navigation"><button disabled={selected === 1} onClick={() => setSelected(selected - 1)}>← Previous</button><button onClick={() => saveLastRead(selected, chapter.verseCount)}>Save my place</button><button disabled={selected === 114} onClick={() => setSelected(selected + 1)}>Next →</button></nav>
        </>}
      </main>
    </div>
  </div>;
}
