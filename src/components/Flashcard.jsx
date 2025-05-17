// /src/components/Flashcard.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Flashcard.css";
import namesOfAllah from "../data/names";

function Flashcard() {
  const [cardList, setCardList] = useState([...namesOfAllah]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const navigate = useNavigate();

  const nextCard = () => {
    setFlipped(false);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % cardList.length);
  };

  const prevCard = () => {
    setFlipped(false);
    setCurrentIndex((prevIndex) =>
      (prevIndex - 1 + cardList.length) % cardList.length
    );
  };

  const shuffleCard = () => {
    const shuffled = [...namesOfAllah].sort(() => Math.random() - 0.5);
    setCardList(shuffled);
    setCurrentIndex(0);
    setFlipped(false);
  };

  const handleFlip = () => {
    setFlipped(!flipped);
  };

  const goHome = () => {
    navigate("/");
  };

  const progress = ((currentIndex + 1) / cardList.length) * 100;

  return (
    <div className="flashcard-page">
      <div className="progress-container">
        <div className="progress-text">
          {currentIndex + 1} / {cardList.length}
        </div>
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="flashcard-wrapper" onClick={handleFlip}>
        <div className={`flashcard ${flipped ? "flip" : ""}`}>
          <div className="flashcard-front">
            <div className="arabic-name">{cardList[currentIndex].arabic}</div>
            <div className="english-name">{cardList[currentIndex].name}</div>
          </div>
          <div className="flashcard-back">
            <p className="english-meaning">{cardList[currentIndex].meaning}</p>
          </div>
        </div>
      </div>

      <div className="flashcard-buttons">
        <button onClick={prevCard}>Previous</button>
        <button onClick={shuffleCard}>Shuffle</button>
        <button onClick={nextCard}>Next</button>
      </div>

      <button className="back-home-button" onClick={goHome}>
        ⬅ Back to Home
      </button>
    </div>
  );
}

export default Flashcard;
