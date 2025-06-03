import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";

function Home() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate("/mode-selection");
  };

  return (
    <div className="home-container">
      <div className="home-banner">
        <h1 className="home-title">Asma’ul Husna Flashcards</h1>
        <p className="home-subtitle">Learn the 99 Names of Allah with Ease</p>
      </div>
      <button className="start-button" onClick={handleStart}>
        Start Learning
      </button>
    </div>
  );
}

export default Home;
