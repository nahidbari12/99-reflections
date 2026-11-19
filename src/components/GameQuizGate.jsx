// /src/components/GameQuizGate.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { buildMeaningQuestions, recordGameAttempt } from "../utils/gameUtils";
import "../styles/GameQuizGate.css";

const GameQuizGate = () => {
  const navigate = useNavigate();

  // All 5 questions
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [locked, setLocked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [showQuestion, setShowQuestion] = useState(true);
  const [questionTimer, setQuestionTimer] = useState(10);
  const [notify, setNotify] = useState("");
  const [wrongAnswers, setWrongAnswers] = useState([]); // ✅ track wrong answers
  const transitionRef = useRef(null);
  const answersRef = useRef(null);

  useEffect(() => () => window.clearTimeout(transitionRef.current), []);

  const releaseAnswerFocus = () => {
    const active = document.activeElement;
    if (active && answersRef.current?.contains(active) && typeof active.blur === "function") {
      active.blur();
    }
  };

  // Generate 5 random questions on mount
  useEffect(() => {
    const qArr = buildMeaningQuestions(5, 4);

    setQuestions(qArr);
    setCurrentIndex(0);
    setSelected(null);
    setLocked(false);
    setCorrectCount(0);
    setQuestionTimer(10);
    setNotify("");
    setWrongAnswers([]); // reset wrong answers each quiz
  }, []);

  // Question timer logic
  useEffect(() => {
    if (!showQuestion || locked) return;
    if (questionTimer <= 0) return handleAnswer(null); // time's up

    const timer = setInterval(() => {
      setQuestionTimer((t) => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [showQuestion, locked, questionTimer]);

  const handleAnswer = (choice) => {
    if (!questions.length || locked) return;

    setLocked(true);
    setSelected(choice);
    const current = questions[currentIndex];
    const isCorrect = choice === current.correct;

    const nextCorrectCount = correctCount + (isCorrect ? 1 : 0);
    recordGameAttempt(current.card, isCorrect, "checkers-gate", Math.max(1, 10 - questionTimer));

    // Build next wrongAnswers list
    let nextWrongAnswers = wrongAnswers;
    if (!isCorrect) {
      const entry = {
        question: current.prompt, // what was shown as the question
        correctAnswer: current.correct,
        selectedAnswer: choice,
        timedOut: choice === null,
      };
      nextWrongAnswers = [...wrongAnswers, entry];
      setWrongAnswers(nextWrongAnswers);
      setNotify(choice === null ? "⏱ Time's up!" : "❌ Wrong");
    } else {
      setNotify("✅ Correct!");
    }

    setCorrectCount(nextCorrectCount);

    transitionRef.current = window.setTimeout(() => {
      releaseAnswerFocus();
      setNotify("");
      setSelected(null);

      if (currentIndex + 1 < questions.length) {
        // Next question
        setCurrentIndex((i) => i + 1);
        setQuestionTimer(10);
        setLocked(false);
      } else {
        // Quiz finished → go to results page with full detail
        const finalCorrect = nextCorrectCount;
        const finalWrong = questions.length - finalCorrect;

        navigate("/gamer-mode/checkers-quiz-results", {
          state: {
            correct: finalCorrect,
            wrong: finalWrong,
            total: questions.length,
            wrongAnswers: nextWrongAnswers,
          },
        });
      }
    }, 1000);
  };

  if (!questions.length) return <div className="challenge-page">Loading questions...</div>;

  const currentQuestion = questions[currentIndex];

  return (
    <div className="challenge-page">
      {showQuestion && currentQuestion ? (
        <div className="challenge-flashcard fade-in">
          <div className="quiz-card-header">
            <div className="quiz-tag">Checkers · Quiz Gate</div>
            <div className="quiz-timer-pill">
              ⏱ <span>{questionTimer}s</span>
            </div>
          </div>

          <h2 className="quiz-question">{currentQuestion.prompt}</h2>

          {notify && (
            <div
              className={`notify-banner ${
                notify.includes("Wrong") || notify.includes("Time")
                  ? "lost"
                  : "bonus"
              }`}
            >
              {notify}
            </div>
          )}

          <div className="answer-options grid-2x2" ref={answersRef} key={currentIndex}>
            {currentQuestion.options.map((option, i) => {
              let className = "answer-button";
              if (locked) {
                if (option === currentQuestion.correct) className += " correct";
                else if (selected === option) className += " wrong";
              }
              return (
                <button
                  key={`${currentIndex}-${option}`}
                  className={className}
                  onClick={() => handleAnswer(option)}
                  disabled={locked}
                >
                  {option}
                </button>
              );
            })}
          </div>

          <div className="quiz-progress">
            Question {currentIndex + 1} of {questions.length}
          </div>
        </div>
      ) : (
        <div className="challenge-flashcard fade-in">Loading...</div>
      )}
    </div>
  );
};

export default GameQuizGate;
