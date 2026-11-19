// /src/components/LudoQuizGate.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import namesOfAllah from "../data/names";
import "../styles/GameQuizGate.css";

const LudoQuizGate = () => {
  const navigate = useNavigate();

  // All 5 questions
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [showQuestion, setShowQuestion] = useState(true);
  const [questionTimer, setQuestionTimer] = useState(10);
  const [notify, setNotify] = useState("");
  const [wrongAnswers, setWrongAnswers] = useState([]);

  // Generate 5 random questions on mount
  useEffect(() => {
    const qArr = [];
    const usedIndexes = new Set();

    while (qArr.length < 5) {
      const idx = Math.floor(Math.random() * namesOfAllah.length);
      if (usedIndexes.has(idx)) continue;
      usedIndexes.add(idx);

      const current = namesOfAllah[idx];
      const correct = current.meaning;
      const allOptions = namesOfAllah.map((n) => n.meaning);
      const wrongOptions = new Set();

      while (wrongOptions.size < 3) {
        const random =
          allOptions[Math.floor(Math.random() * allOptions.length)];
        if (random !== correct) wrongOptions.add(random);
      }

      const mixed = [correct, ...Array.from(wrongOptions)].sort(
        () => Math.random() - 0.5
      );

      qArr.push({
        prompt: current.name,
        correct,
        options: mixed,
      });
    }

    setQuestions(qArr);
    setCurrentIndex(0);
    setSelected(null);
    setCorrectCount(0);
    setQuestionTimer(10);
    setNotify("");
    setWrongAnswers([]);
  }, []);

  // Question timer logic
  useEffect(() => {
    if (!showQuestion || selected !== null) return;
    if (questionTimer <= 0) return handleAnswer(null); // time's up

    const timer = setInterval(() => {
      setQuestionTimer((t) => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [showQuestion, selected, questionTimer]);

  const handleAnswer = (choice) => {
    if (!questions.length) return;

    setSelected(choice);
    const current = questions[currentIndex];
    const isCorrect = choice === current.correct;

    const nextCorrectCount = correctCount + (isCorrect ? 1 : 0);

    // Build next wrongAnswers list
    let nextWrongAnswers = wrongAnswers;
    if (!isCorrect) {
      const entry = {
        question: current.prompt,
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

    setTimeout(() => {
      setNotify("");
      setSelected(null);

      if (currentIndex + 1 < questions.length) {
        // Next question
        setCurrentIndex((i) => i + 1);
        setQuestionTimer(10);
      } else {
        // Quiz finished → go to Ludo results page
        const finalCorrect = nextCorrectCount;
        const finalWrong = questions.length - finalCorrect;

        navigate("/gamer-mode/ludo-quiz-results", {
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

  if (!questions.length) return <div>Loading questions...</div>;

  const currentQuestion = questions[currentIndex];

  return (
    <div className="challenge-page">
      {showQuestion && currentQuestion ? (
        <div className="challenge-flashcard fade-in">
          <h2>{currentQuestion.prompt}</h2>
          <div className="timer-label">{questionTimer}s</div>

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

          <div className="answer-options grid-2x2">
            {currentQuestion.options.map((option, i) => {
              let className = "answer-button";
              if (selected && selected === option) {
                className +=
                  option === currentQuestion.correct ? " correct" : " wrong";
              }
              return (
                <button
                  key={i}
                  className={className}
                  onClick={() => handleAnswer(option)}
                  disabled={selected !== null}
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
        <div>Loading...</div>
      )}
    </div>
  );
};

export default LudoQuizGate;
