import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import namesOfAllah from "../data/names";
import "../styles/TicTacToeGame.css";

function TicTacToeGame() {
  const navigate = useNavigate();
  const [board, setBoard] = useState(Array(9).fill(null));
  const [status, setStatus] = useState("Your move");
  const [showQuestion, setShowQuestion] = useState(false);
  const [question, setQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [questionTimer, setQuestionTimer] = useState(10);
  const [moveTimer, setMoveTimer] = useState(10);
  const [moveTimerRunning, setMoveTimerRunning] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState([]);
  const [moveCount, setMoveCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [skipTurn, setSkipTurn] = useState(false); // for timeout skips
  const [skipNextMove, setSkipNextMove] = useState(false); // for 3-wrong skips
  const [extraMove, setExtraMove] = useState(false);
  const [notify, setNotify] = useState("");

  useEffect(() => {
    startPlayerTurn();
  }, []);

  useEffect(() => {
    let timer;
    if (!showQuestion && moveTimerRunning) {
      timer = setInterval(() => {
        setMoveTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setMoveTimerRunning(false);

            if (skipTurn || skipNextMove) {
              setNotify("Lost Turn");
              setTimeout(() => {
                setNotify("");
                if (skipTurn) setSkipTurn(false);
                if (skipNextMove) setSkipNextMove(false);
                triggerCpuMove();
              }, 2500);
            }

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [moveTimerRunning, showQuestion, skipTurn, skipNextMove]);

  useEffect(() => {
    let timer;
    if (showQuestion && questionTimer > 0 && selected === null) {
      timer = setInterval(() => {
        setQuestionTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setShowQuestion(false);
            triggerCpuMove();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showQuestion, questionTimer, selected]);

  const handleCellClick = (index) => {
    if (board[index] !== null || showQuestion || !moveTimerRunning) return;
    const newBoard = [...board];
    newBoard[index] = "X";
    setBoard(newBoard);
    setMoveCount((m) => m + 1);
    setMoveTimerRunning(false);
    setStatus("Please wait...");

    const result = checkWinner(newBoard);
    if (result) return endGame(result === "X" ? "win" : result === "O" ? "lose" : "draw");

    setTimeout(() => {
      generateQuestion();
      setShowQuestion(true);
    }, 600);
  };

  const checkWinner = (b) => {
    for (let [a, bIdx, c] of winningCombos) {
      if (b[a] && b[a] === b[bIdx] && b[a] === b[c]) return b[a];
    }
    return b.includes(null) ? null : "draw";
  };

  const winningCombos = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];

  const handleAnswer = (choice) => {
    setSelected(choice);
    const correct = choice === question.correct;

    if (correct) {
      setCorrectCount((c) => c + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > longestStreak) setLongestStreak(newStreak);
      setWrongStreak(0);

      if (newStreak === 3) {
        setNotify("CPU's Turn Skipped");
        setTimeout(() => {
          setNotify("");
          setShowQuestion(false);
          startPlayerTurn();
        }, 2500);
        return;
      } else if (newStreak === 5) {
        setExtraMove(true);
        setNotify("+1 Extra Move");
        setTimeout(() => setNotify(""), 2500);
      }
    } else {
      setWrongCount((w) => w + 1);
      setWrongAnswers((prev) => [...prev, { name: question.prompt, correct: question.correct }]);
      setStreak(0);
      const newWrong = wrongStreak + 1;
      setWrongStreak(newWrong);

      if (newWrong === 3) {
        setSkipNextMove(true);
        setNotify("Lost Turn");
        setTimeout(() => {
          setNotify("");
          setShowQuestion(false);
          triggerCpuMove();
        }, 2500);
        return;
      }

      if (newWrong >= 5) return endGame("lose");
    }

    setTimeout(() => {
      setShowQuestion(false);
      triggerCpuMove();
    }, 1000);
  };

  const generateQuestion = () => {
    const current = namesOfAllah[Math.floor(Math.random() * namesOfAllah.length)];
    const correct = current.meaning;
    const allOptions = namesOfAllah.map((n) => n.meaning);
    const wrongOptions = new Set();

    while (wrongOptions.size < 3) {
      const random = allOptions[Math.floor(Math.random() * allOptions.length)];
      if (random !== correct) wrongOptions.add(random);
    }

    const mixed = [correct, ...Array.from(wrongOptions)].sort(() => Math.random() - 0.5);
    setQuestion({ prompt: current.name, correct });
    setOptions(mixed);
    setSelected(null);
    setQuestionTimer(10);
  };

  const triggerCpuMove = () => {
    setTimeout(() => {
      makeCpuMove();
    }, 600);
  };

  const makeCpuMove = () => {
    const empty = board.map((v, i) => (v === null ? i : null)).filter((v) => v !== null);
    if (empty.length === 0) return;

    const clone = [...board];
    let move = null;

    for (let [a, b, c] of winningCombos) {
      if ([clone[a], clone[b], clone[c]].filter((v) => v === "X").length === 2 &&
          [a, b, c].some((i) => clone[i] === null)) {
        move = [a, b, c].find((i) => clone[i] === null);
        break;
      }
    }

    if (move === null && clone[4] === null) {
      move = 4;
    }

    if (move === null) {
      move = empty[Math.floor(Math.random() * empty.length)];
    }

    clone[move] = "O";
    setBoard(clone);
    setMoveCount((m) => m + 1);

    const result = checkWinner(clone);
    if (result) return endGame(result === "X" ? "win" : result === "O" ? "lose" : "draw");

    startPlayerTurn();
  };

  const startPlayerTurn = () => {
    setStatus("Your move");
    setMoveTimer(10);
    setMoveTimerRunning(true);
  };

  const endGame = (outcome) => {
    navigate("/gamer-mode/results", {
      state: {
        outcome,
        correct: correctCount,
        wrong: wrongCount,
        longestStreak,
        totalQuestions: correctCount + wrongCount,
        wrongAnswers,
        moveCount,
      },
    });
  };

  const streakHearts = Array(5).fill("🖤").map((h, i) => i < streak ? "💛" : "🖤");

  return (
    <div className="challenge-page">
      {showQuestion ? (
        <div className="challenge-flashcard fade-in">
          <h2>{question?.prompt}</h2>
          <div className="timer-label">{questionTimer}s</div>
          <div className={`answer-options ${options.length === 4 ? "grid-2x2" : ""}`}>
            {options.map((option, i) => {
              let className = "answer-button";
              if (selected && selected === option) {
                className += option === question.correct ? " correct" : " wrong";
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
        </div>
      ) : (
        <div className="tic-tac-toe-board">
          <h2 className="move-text">{status}</h2>
          <div className="timer-label">{moveTimer}s</div>
          {notify && <div className={`notify-banner ${notify.includes("Lost") ? "lost" : "bonus"}`}>{notify}</div>}
          <div className="board">
            {board.map((cell, i) => (
              <div key={i} className="cell" onClick={() => handleCellClick(i)}>
                {cell}
              </div>
            ))}
          </div>
          <div className="streak-meter">
            {streakHearts.join(" ")}
            <div>STREAK</div>
          </div>
          {extraMove && <div className="extra-move-button">+1 EXTRA MOVE</div>}
        </div>
      )}
      <button className="back-home-button" onClick={() => navigate("/gamer-mode")}>❌ Quit & Exit</button>
    </div>
  );
}

export default TicTacToeGame;
