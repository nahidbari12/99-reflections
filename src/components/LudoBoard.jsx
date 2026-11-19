// src/components/LudoBoard.jsx
import React from "react";
import "../styles/LudoBoard.css";

function LudoBoard() {
  return (
    <div className="ludo-container">
      <h1 className="board-title">🎲 Ludo Board</h1>
      <div className="ludo-grid">
        {/* Top Row */}
        <div className="home yellow-home"></div>
        <div className="path vertical-path">
          {/* Blue Path */}
          {[...Array(6)].map((_, i) => (
            <div key={`blue-path-${i}`} className="cell blue-track"></div>
          ))}
        </div>
        <div className="home blue-home"></div>

        {/* Middle Row */}
        <div className="path horizontal-path">
          {[...Array(6)].map((_, i) => (
            <div key={`yellow-path-${i}`} className="cell yellow-track"></div>
          ))}
        </div>

        <div className="center-cell">
          <div className="center-triangle red"></div>
          <div className="center-triangle green"></div>
          <div className="center-triangle yellow"></div>
          <div className="center-triangle blue"></div>
        </div>

        <div className="path horizontal-path">
          {[...Array(6)].map((_, i) => (
            <div key={`green-path-${i}`} className="cell green-track"></div>
          ))}
        </div>

        {/* Bottom Row */}
        <div className="home green-home"></div>
        <div className="path vertical-path">
          {[...Array(6)].map((_, i) => (
            <div key={`red-path-${i}`} className="cell red-track"></div>
          ))}
        </div>
        <div className="home red-home"></div>
      </div>

      <button className="quit-button">Quit & Exit</button>
    </div>
  );
}

export default LudoBoard;
