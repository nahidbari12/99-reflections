// /src/components/ModeSelection.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ModeSelection.css";

function ModeSelection() {
  const navigate = useNavigate();
  const [showDifficultyOptions, setShowDifficultyOptions] = useState(false);

  const handleLearnMode = () => {
    navigate("/flashcards");
  };

  const handleChallengeClick = () => {
    setShowDifficultyOptions(true);
  };

  const handleEasyMode = () => {
    navigate("/challenge", { state: { difficulty: "easy" } });
  };

  const handleHardMode = () => {
    navigate("/challenge", { state: { difficulty: "hard" } });
  };

  const handleBack = () => {
    setShowDifficultyOptions(false);
  };

  const handleGamerMode = () => {
    navigate("/gamer-mode");
  };

  return (
    <div className="mode-selection-page">
      <div className="mode-selection-content">
        <h1 className="mode-selection-title">Choose Mode</h1>

        {!showDifficultyOptions ? (
          <>
            <button className="mode-button learn" onClick={handleLearnMode}>
              📖 Learn Mode
            </button>
            <button className="mode-button challenge" onClick={handleChallengeClick}>
              🎯 Challenge Mode
            </button>
            <button className="mode-button gamer" onClick={handleGamerMode}>
              🎮 Gamer Mode
            </button>
          </>
        ) : (
          <>
            <button className="mode-button easy" onClick={handleEasyMode}>
              🌙 Easy Mode
            </button>
            <button className="mode-button hard" onClick={handleHardMode}>
              🔥 Hard Mode
            </button>

            <div className="coming-soon-text">🤝 Multiplayer Match – Coming Soon!</div>

            <button className="back-home-button" onClick={handleBack}>
              ⬅ Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default ModeSelection;
