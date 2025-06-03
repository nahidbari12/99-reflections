import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
} from "react-router-dom";

import Home from "./components/Home";
import ModeSelection from "./components/ModeSelection";
import Flashcard from "./components/Flashcard";
import ChallengeMode from "./components/ChallengeMode";
import Results from "./components/Results";
import GlobalMusicPlayer from "./components/GlobalMusicPlayer";
import About from "./components/About";

import GamerMode from "./components/GamerMode";
import TicTacToeGame from "./components/TicTacToeGame";
import TicTacToeResults from "./components/TicTacToeResults";
import ChessBoardWrapper from "./components/ChessBoardWrapper";
import ChessResults from "./components/ChessResults";
import ChessDifficulty from "./components/ChessDifficulty"; // ✅ ADDED

import "./styles/GlobalMusicPlayer.css";

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
  useEffect(() => {
    document.title = "99NamesOfAllah.org – Asma’ul Husna Flashcards";
  }, []);

  return (
    <>
      <GlobalMusicPlayer />
      <Router>
        <Routes>
          <Route path="/" element={<HomeWithAboutLink />} />
          <Route path="/mode-selection" element={<ModeSelection />} />
          <Route path="/flashcards" element={<Flashcard />} />
          <Route path="/challenge" element={<ChallengeMode />} />
          <Route path="/results" element={<Results />} />
          <Route path="/about" element={<About />} />

          {/* ✅ Gamer Mode Routes */}
          <Route path="/gamer-mode" element={<GamerMode />} />
          <Route path="/gamer-mode/tic-tac-toe" element={<TicTacToeGame />} />
          <Route path="/gamer-mode/results" element={<TicTacToeResults />} />
          <Route path="/gamer-mode/chess-difficulty" element={<ChessDifficulty />} /> {/* ✅ NEW */}
          <Route path="/gamer-mode/chess" element={<ChessBoardWrapper />} />
          <Route path="/gamer-mode/chess-results" element={<ChessResults />} />

          {/* ✅ NEW: Chess results route used after checkmate */}
          <Route path="/chess-results" element={<ChessResults />} />

          {/* 🧪 Optional testing route */}
          <Route path="/test-chess" element={<ChessBoardWrapper />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
