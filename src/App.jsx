// /src/App.jsx

import React from "react";
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
import "./styles/GlobalMusicPlayer.css";

// ✅ Home page with About link
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
        </Routes>
      </Router>
    </>
  );
}

export default App;
