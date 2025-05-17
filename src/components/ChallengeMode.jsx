// /src/components/ChallengeMode.jsx

import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import namesOfAllah from "../data/names";
import "../styles/ChallengeMode.css";
import { socket } from "../socket";

function ChallengeMode() {
  const navigate = useNavigate();
  const location = useLocation();

  const isMultiplayer = location.state?.isMultiplayer || false;
  const roomCode = location.state?.roomCode || null;
  const difficulty = location.state?.difficulty || "easy";
  const username = location.state?.username || "Player";

  const [shuffledNames, setShuffledNames] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [gameTime, setGameTime] = useState(90);
  const [cardTime, setCardTime] = useState(10);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState([]);
  const [options, setOptions] = useState([]);
  const [disabled, setDisabled] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [bonusText, setBonusText] = useState("");
  const [isFading, setIsFading] = useState(false);
  const [waiting, setWaiting] = useState(isMultiplayer);
  const [shakeCard, setShakeCard] = useState(false);
  const [showMeaning, setShowMeaning] = useState(true);
  const bannerTimeoutRef = useRef(null);

  useEffect(() => {
    if (isMultiplayer && roomCode) {
      socket.emit("joinRoom", { roomCode, username });

      socket.on("startGame", ({ opponentUsername }) => {
        setWaiting(false);
      });

      socket.on("restart-game", () => {
        resetGame();
      });

      socket.on("opponent-left", ({ username: leftUser }) => {
        alert(`${leftUser} has left the match.`);
        navigate("/");
      });

      return () => {
        socket.off("startGame");
        socket.off("restart-game");
        socket.off("opponent-left");
      };
    }
  }, [isMultiplayer, roomCode, username, navigate]);

  useEffect(() => {
    const shuffled = [...namesOfAllah].sort(() => Math.random() - 0.5);
    setShuffledNames(shuffled);
  }, []);

  useEffect(() => {
    if (shuffledNames.length > 0) {
      const current = shuffledNames[currentIndex];
      const isShowMeaning = difficulty === "hard" ? Math.random() < 0.5 : true;
      setShowMeaning(isShowMeaning);

      const correct = isShowMeaning ? current.meaning : current.name;
      const allValues = namesOfAllah.map(n => isShowMeaning ? n.meaning : n.name);
      const wrongOptions = new Set();

      while (wrongOptions.size < (difficulty === "hard" || isMultiplayer ? 3 : 1)) {
        const random = allValues[Math.floor(Math.random() * allValues.length)];
        if (random !== correct) wrongOptions.add(random);
      }

      const mixedOptions = [correct, ...Array.from(wrongOptions)].sort(() => Math.random() - 0.5);
      setOptions(mixedOptions);
    }
  }, [currentIndex, shuffledNames, difficulty, isMultiplayer]);

  useEffect(() => {
    if (!waiting && gameTime <= 0) {
      endGame();
      return;
    }
    if (!waiting) {
      const timer = setInterval(() => setGameTime((t) => t - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [gameTime, waiting]);

  useEffect(() => {
    if (!waiting && cardTime <= 0 && gameTime > 0) {
      setWrongCount((prev) => prev + 1);
      setStreak(0);
      setWrongAnswers((prev) => [
        ...prev,
        {
          name: shuffledNames[currentIndex].name,
          correct: showMeaning ? shuffledNames[currentIndex].meaning : shuffledNames[currentIndex].name,
        },
      ]);
      nextCard();
      return;
    }
    if (!waiting) {
      const cardTimer = setInterval(() => setCardTime((c) => c - 1), 1000);
      return () => clearInterval(cardTimer);
    }
  }, [cardTime, gameTime, waiting]);

  const handleAnswer = (selected) => {
    if (disabled || waiting) return;
    const correct = showMeaning ? shuffledNames[currentIndex].meaning : shuffledNames[currentIndex].name;
    setSelectedOption(selected);
    let points = 0;
    let bonus = "";

    if (selected === correct) {
      points = cardTime >= 8 ? 10 : cardTime >= 4 ? 5 : 3;
      const newStreak = streak + 1;
      setStreak(newStreak);
      setCorrectCount((prev) => prev + 1);
      if (newStreak > longestStreak) setLongestStreak(newStreak);

      if (newStreak === 3) { points += 5; bonus = "+5 Bonus for 3 streak!"; }
      else if (newStreak === 5) { points += 10; bonus = "+10 Bonus for 5 streak!"; }
      else if (newStreak === 10) { points += 20; bonus = "+20 Bonus for 10 streak!"; }

      if (bonus) {
        setBonusText(bonus);
        if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
        bannerTimeoutRef.current = setTimeout(() => {
          setBonusText("");
          nextCard();
        }, 2000);
      } else {
        setTimeout(() => nextCard(), 1000);
      }
    } else {
      setShakeCard(true);
      setTimeout(() => setShakeCard(false), 500);

      points = -3;
      setWrongCount((prev) => prev + 1);
      setStreak(0);
      setWrongAnswers((prev) => [
        ...prev,
        {
          name: shuffledNames[currentIndex].name,
          correct: correct,
        },
      ]);
      setTimeout(() => nextCard(), 1000);
    }

    setScore((prev) => prev + points);
    setDisabled(true);
  };

  const nextCard = () => {
    if (currentIndex + 1 < shuffledNames.length && gameTime > 0) {
      setCurrentIndex((i) => i + 1);
      setCardTime(10);
      setDisabled(false);
      setSelectedOption(null);
      setTotalQuestions((prev) => prev + 1);
    } else {
      endGame();
    }
  };

  const endGame = () => {
    setIsFading(true);
    setTimeout(() => {
      navigate("/results", {
        state: {
          score,
          correct: correctCount,
          wrong: wrongCount,
          longestStreak,
          totalQuestions: correctCount + wrongCount,
          wrongAnswers,
          username,
          isMultiplayer,
          roomCode,
        },
      });
    }, 500);
  };

  const goToModeSelection = () => {
    navigate("/mode-selection");
  };

  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const progress = cardTime / 10;
  const strokeDashoffset = circumference * (1 - progress);

  if (shuffledNames.length === 0) return <div>Loading game...</div>;

  return (
    <div className={`challenge-page ${isFading ? "fade-out" : ""}`}>
      <div className="top-bar">
        <div className="timer">⏱ {gameTime}s</div>
        <div className="score-streak">
          <div className="score-box">🏆 Score: {score}</div>
          <div className="streak-text">🔥 Streak: {streak}</div>
        </div>
      </div>

      <div className={`challenge-flashcard ${shakeCard ? "shake" : ""}`}>
        <h2>{showMeaning ? shuffledNames[currentIndex].name : shuffledNames[currentIndex].meaning}</h2>
        <div className="circle-timer">
          <svg className="timer-svg" viewBox="0 0 40 40">
            <circle className="circle-bg" cx="20" cy="20" r={radius} />
            <circle
              className="circle"
              cx="20"
              cy="20"
              r={radius}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
        </div>
        {bonusText && <div className="bonus-banner">{bonusText}</div>}
      </div>

      <div className={`answer-options ${options.length === 4 ? "grid-2x2" : ""}`}>
        {options.map((option, i) => {
          let className = "answer-button";
          if (disabled && selectedOption === option) {
            className += option === (showMeaning ? shuffledNames[currentIndex].meaning : shuffledNames[currentIndex].name) ? " correct" : " wrong";
          }
          return (
            <button
              key={i}
              className={className}
              onClick={() => handleAnswer(option)}
              disabled={disabled}
            >
              {option}
            </button>
          );
        })}
      </div>

      <button className="back-home-button" onClick={goToModeSelection}>
        ❌ Exit
      </button>
    </div>
  );
}

export default ChallengeMode;
