// /src/components/EnterMatch.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/ModeSelection.css";

function EnterMatch() {
  const navigate = useNavigate();
  const location = useLocation();

  const [roomCode, setRoomCode] = useState("");
  const [username, setUsername] = useState("");

  // Autofill code from URL query
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const codeFromUrl = params.get("code");
    if (codeFromUrl) {
      setRoomCode(codeFromUrl.toUpperCase());
    }
  }, [location.search]);

  const handleEnter = () => {
    if (roomCode.trim() && username.trim()) {
      navigate(`/match/${roomCode.toUpperCase()}`, {
        state: { isMultiplayer: true, username },
      });
    }
  };

  return (
    <div className="mode-selection-page">
      <div className="mode-selection-content">
        <h1 className="mode-selection-title">Enter Match Room</h1>

        <input
          className="input-field"
          type="text"
          placeholder="Your Name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          className="input-field"
          type="text"
          placeholder="Enter Room Code"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
        />

        <button className="mode-button" onClick={handleEnter}>
          🚪 Enter Room
        </button>

        <button
          className="back-home-button"
          onClick={() => navigate("/mode-selection")}
        >
          ⬅ Back
        </button>
      </div>
    </div>
  );
}

export default EnterMatch;
