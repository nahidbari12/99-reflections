// /src/App.jsx

import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import Home from "./components/Home";
import ModeSelection from "./components/ModeSelection";
import GlobalMusicPlayer from "./components/GlobalMusicPlayer";
import RouteAnalytics from "./components/RouteAnalytics";
import RouteMetadata from "./components/RouteMetadata";
import NotFound from "./components/NotFound";
import MobileNavigation from "./components/MobileNavigation";

const Flashcard = lazy(() => import("./components/Flashcard"));
const ChallengeMode = lazy(() => import("./components/ChallengeMode"));
const Results = lazy(() => import("./components/Results"));
const About = lazy(() => import("./components/About"));
const NamesDirectory = lazy(() => import("./components/NamesDirectory"));
const NameDetail = lazy(() => import("./components/NameDetail"));
const ThemeCollections = lazy(() => import("./components/ThemeCollections"));
const JourneyDashboard = lazy(() => import("./components/JourneyDashboard"));
const SmartReview = lazy(() => import("./components/SmartReview"));
const NameOfTheDay = lazy(() => import("./components/NameOfTheDay"));
const ThemedJourneys = lazy(() => import("./components/ThemedJourneys"));
const QuranReader = lazy(() => import("./components/QuranReader"));

const QuizBattle = lazy(() => import("./components/QuizBattle"));
const GamerMode = lazy(() => import("./components/GamerMode"));
const TicTacToeGame = lazy(() => import("./components/TicTacToeGame"));
const TicTacToeResults = lazy(() => import("./components/TicTacToeResults"));
const ChessBoardWrapper = lazy(() => import("./components/ChessBoardWrapper"));
const ChessResults = lazy(() => import("./components/ChessResults"));
const ChessDifficulty = lazy(() => import("./components/ChessDifficulty"));
const CheckersWrapper = lazy(() => import("./components/CheckersWrapper"));
const GameQuizGate = lazy(() => import("./components/GameQuizGate"));
const CheckersQuizResults = lazy(() => import("./components/CheckersQuizResults"));

const DailyQuiz = lazy(() => import("./components/DailyQuiz"));

// ✅ Scramble Import (NEW)
const ScrambleGame = lazy(() => import("./components/ScrambleGame"));

// ✅ Name Rush (Speed Tap) Import (NEW)
const NameRush = lazy(() => import("./components/NameRush"));

// ✅ Divine Descent (Falling Names) Import (NEW)
const DivineDescentGame = lazy(() => import("./components/DivineDescentGame"));

// ✅ Birds of Paradise (Flappy-style) Import (NEW)
const BirdsOfParadise = lazy(() => import("./components/BirdsOfParadise"));
const LanternMatch = lazy(() => import("./components/LanternMatch"));
const CrosswordGame = lazy(() => import("./components/CrosswordGame"));

// ✅ Learning Mode + Arabic Alphabet (NEW)
const LearningMode = lazy(() => import("./components/LearningMode"));
const SmartLearn = lazy(() => import("./components/SmartLearn"));
const LearningProgress = lazy(() => import("./components/LearningProgress"));
const ArabicAlphabet = lazy(() => import("./components/ArabicAlphabet"));

// ✅ Arabic TTS Help (NEW)
const ArabicTTSHelp = lazy(() => import("./components/ArabicTTSHelp"));

// ✅ Golden Letters Activity Book (NEW)
const GoldenLettersHome = lazy(() => import("./components/GoldenLettersHome"));
const GoldenLetters = lazy(() => import("./components/GoldenLetters"));
const GoldenLettersLetter = lazy(() => import("./components/GoldenLettersLetter"));
const GoldenLettersPractice = lazy(() => import("./components/GoldenLettersPractice"));
const GoldenLettersProgress = lazy(() => import("./components/GoldenLettersProgress"));

import "./styles/GlobalMusicPlayer.css";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    const message = String(error?.message || error || "");
    const isStaleChunk = /dynamically imported|module script|failed to fetch/i.test(message);
    if (isStaleChunk && sessionStorage.getItem("reflections_chunk_reload") !== "1") {
      sessionStorage.setItem("reflections_chunk_reload", "1");
      window.location.reload();
    }
  }

  recover = async () => {
    try {
      if ("caches" in window) {
        const keys = await window.caches.keys();
        await Promise.all(keys.filter((key) => key.startsWith("99-reflections-")).map((key) => window.caches.delete(key)));
      }
    } finally {
      sessionStorage.removeItem("reflections_chunk_reload");
      window.location.reload();
    }
  };

  render() {
    if (!this.state.error) return this.props.children;
    return <main style={{minHeight:"100dvh",display:"grid",placeItems:"center",padding:"24px",boxSizing:"border-box",background:"#020617",color:"#f8fafc",fontFamily:"Poppins, system-ui, sans-serif",textAlign:"center"}}>
      <section style={{maxWidth:"520px",padding:"28px",border:"1px solid rgba(250,204,21,.45)",borderRadius:"20px",background:"#0f172a"}}>
        <div style={{fontSize:"2rem"}}>🌙</div><h1 style={{color:"#fde047"}}>Let’s refresh this page</h1>
        <p style={{color:"#cbd5e1",lineHeight:1.6}}>A saved website file is out of date. Your learning progress is safe.</p>
        <button onClick={this.recover} style={{border:0,borderRadius:"999px",padding:"11px 20px",background:"#facc15",color:"#111827",fontWeight:800,cursor:"pointer"}}>Refresh website</button>
      </section>
    </main>;
  }
}

function HomeWithAboutLink() {
  return (
    <div>
      <Home />
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <Link
          to="/about"
          style={{
            fontSize: "14px",
            color: "#facc15",
            textDecoration: "underline",
            fontWeight: "bold",
          }}
        >
          About / Disclaimer
        </Link>
      </div>
    </div>
  );
}

function App() {

  return (
    <Router>
      <RouteMetadata />
      <GlobalMusicPlayer />
        <RouteAnalytics />
        <AppErrorBoundary><Suspense fallback={<div style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#020617",color:"#facc15"}}>Loading experience…</div>}><Routes>
          {/* Main Routes */}
          <Route path="/" element={<HomeWithAboutLink />} />
          <Route path="/mode-selection" element={<ModeSelection />} />
          <Route path="/flashcards" element={<Flashcard />} />
          <Route path="/challenge" element={<ChallengeMode />} />
          <Route path="/daily-challenge" element={<ChallengeMode />} />
          <Route path="/results" element={<Results />} />
          <Route path="/about" element={<About />} />
          <Route path="/names" element={<NamesDirectory />} />
          <Route path="/names/:slug" element={<NameDetail />} />
          <Route path="/themes" element={<ThemeCollections />} />
          <Route path="/my-dashboard" element={<JourneyDashboard />} />
          <Route path="/smart-review" element={<SmartReview />} />
          <Route path="/name-of-the-day" element={<NameOfTheDay />} />
          <Route path="/themed-journeys" element={<ThemedJourneys />} />
          <Route path="/quran" element={<QuranReader />} />
          <Route path="/quran/:surahNumber" element={<QuranReader />} />

          {/* 🌙 Daily Quiz Route (NEW) */}
          <Route path="/daily-quiz" element={<DailyQuiz />} />

          {/* 📚 Learning Mode (NEW) */}
          <Route path="/learning-mode" element={<LearningMode />} />
          <Route path="/smart-learn" element={<SmartLearn />} />
          <Route path="/learning-progress" element={<LearningProgress />} />
          <Route path="/arabic-alphabet" element={<ArabicAlphabet />} />
          <Route path="/arabic-tts-help" element={<ArabicTTSHelp />} />

          {/* ✨ Golden Letters Activity Book (NEW) */}
          <Route path="/golden-letters" element={<GoldenLettersHome />} />
          <Route path="/golden-letters/letters" element={<GoldenLetters />} />
          <Route path="/golden-letters/practice" element={<GoldenLettersPractice />} />
          <Route path="/golden-letters/progress" element={<GoldenLettersProgress />} />
          <Route
            path="/golden-letters/letter/:id"
            element={<GoldenLettersLetter />}
          />

          {/* Gamer Mode Routes */}
          <Route path="/gamer-mode" element={<GamerMode />} />
          <Route path="/gamer-mode/lantern-duel" element={<QuizBattle lantern />} />
          <Route path="/gamer-mode/quiz-battle" element={<QuizBattle />} />
          <Route path="/gamer-mode/tic-tac-toe" element={<TicTacToeGame />} />
          <Route path="/gamer-mode/results" element={<TicTacToeResults />} />
          <Route
            path="/gamer-mode/chess-difficulty"
            element={<ChessDifficulty />}
          />
          <Route path="/gamer-mode/chess" element={<ChessBoardWrapper />} />
          <Route path="/gamer-mode/chess-results" element={<ChessResults />} />

          {/* ✅ NEW: standalone Chess results route to match navigate("/chess-results") */}
          <Route path="/chess-results" element={<ChessResults />} />

          {/* Checkers Routes */}
          <Route
            path="/gamer-mode/checkers-quiz"
            element={<GameQuizGate nextRoute="/gamer-mode/checkers" />}
          />
          <Route
            path="/gamer-mode/checkers-quiz-results"
            element={<CheckersQuizResults />}
          />
          <Route path="/gamer-mode/checkers" element={<CheckersWrapper />} />

          {/* Scramble Route (NEW) */}
          <Route path="/gamer-mode/scramble" element={<ScrambleGame />} />

          {/* Name Rush (Speed Tap) Route (NEW) */}
          <Route path="/gamer-mode/name-rush" element={<NameRush />} />

          {/* Divine Descent (Falling Names) Route (NEW) */}
          <Route
            path="/gamer-mode/divine-descent"
            element={<DivineDescentGame />}
          />

          {/* Birds of Paradise (Flappy-style) Route (NEW) */}
          <Route
            path="/gamer-mode/birds-of-paradise"
            element={<BirdsOfParadise />}
          />
          <Route path="/gamer-mode/lantern-match" element={<LanternMatch />} />
          <Route path="/gamer-mode/crossword" element={<CrosswordGame />} />
        <Route path="*" element={<NotFound />} /></Routes><MobileNavigation /></Suspense></AppErrorBoundary>
    </Router>
  );
}

export default App;
