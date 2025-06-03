import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import namesOfAllah from "../data/names";
import "../styles/ChessBoardWrapper.css";

function ChessBoardWrapper() {
  const navigate = useNavigate();
  const game = useRef(new Chess());
  const streakBonusAppliedRef = useRef(false);
  const lastCheckSource = useRef(null);
  const questionResultHandledRef = useRef(true);

  const [gamePosition, setGamePosition] = useState("start");
  const [showQuestion, setShowQuestion] = useState(false);
  const [question, setQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [questionTimer, setQuestionTimer] = useState(10);
  const [moveTimer, setMoveTimer] = useState(30);
  const [moveTimerRunning, setMoveTimerRunning] = useState(false);
  const [streak, setStreak] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [notify, setNotify] = useState("");
  const [availableBonuses, setAvailableBonuses] = useState([]);
  const [usedBonusThisTurn, setUsedBonusThisTurn] = useState(false);
  const [usedBonuses, setUsedBonuses] = useState({});
  const [doubleMoveActive, setDoubleMoveActive] = useState(false);
  const [doubleMoveCount, setDoubleMoveCount] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState([]);
  const [playerTurnActive, setPlayerTurnActive] = useState(true);
  const [cpuDifficulty, setCpuDifficulty] = useState("medium");

  const handleTimeout = () => {
    if (!questionResultHandledRef.current || selected !== null) return;
    questionResultHandledRef.current = false;
    setStreak(0);
    setWrongAnswers((prev) => [...prev, question]);
    setNotify("Incorrect");

    setTimeout(() => {
      setSelected(null);
      setQuestion(null);
      setShowQuestion(false);
      setTimeout(() => {
        setNotify("");
        questionResultHandledRef.current = true;
        triggerCpuMove();
      }, 100);
    }, 50);
  };

  useEffect(() => {
    const difficulty = localStorage.getItem("cpuDifficulty") || "medium";
    setCpuDifficulty(difficulty);
    startPlayerTurn();
  }, []);
  useEffect(() => {
    if (!showQuestion && moveTimerRunning) {
      const timer = setInterval(() => {
        setMoveTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setMoveTimerRunning(false);
            setPlayerTurnActive(false);
            setNotify("Turn Skipped");
            setTimeout(() => setNotify(""), 2000);
            triggerCpuMove();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [moveTimerRunning, showQuestion]);

  useEffect(() => {
    if (!showQuestion || selected !== null) return;

    const interval = setInterval(() => {
      setQuestionTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showQuestion, selected]);

  useEffect(() => {
    if (streak === 3 && !streakBonusAppliedRef.current) {
      streakBonusAppliedRef.current = true;
      setMoveTimer(45);
    }
    if (streak === 6 && !availableBonuses.includes("undo"))
      setAvailableBonuses((p) => [...p, "undo"]);
    if (streak === 9 && !availableBonuses.includes("doubleMove"))
      setAvailableBonuses((p) => [...p, "doubleMove"]);
  }, [streak]);

  const isCheckmate = () => {
    return game.current.inCheck() && game.current.moves().length === 0;
  };

  const startPlayerTurn = () => {
    questionResultHandledRef.current = true;
    setPlayerTurnActive(true);
    setMoveTimer(streakBonusAppliedRef.current ? 45 : 30);
    setMoveTimerRunning(true);
    setUsedBonusThisTurn(false);
  };

  const handlePieceDrop = (source, target) => {
    if (!playerTurnActive || showQuestion || game.current.turn() !== "w" || !questionResultHandledRef.current) return false;

    const move = game.current.move({ from: source, to: target, promotion: "q" });
    if (move === null) return false;

    setGamePosition(game.current.fen());
    setMoveTimerRunning(false);
    setPlayerTurnActive(false);

    if (game.current.inCheck() && lastCheckSource.current !== game.current.fen()) {
      lastCheckSource.current = game.current.fen();
      setNotify("Check!");
      setTimeout(() => setNotify(""), 3000);
    }

    if (isCheckmate()) {
      setNotify("Checkmate!");
      setTimeout(() => {
        navigate("/chess-results", {
          state: {
            winner: "You",
            streak,
            correctAnswers,
            totalQuestions: correctAnswers + wrongAnswers.length,
            wrongAnswers
          }
        });
      }, 3000);
      return true;
    }

    if (doubleMoveActive && doubleMoveCount === 0) {
      setDoubleMoveCount(1);
      setMoveTimerRunning(true);
      setPlayerTurnActive(true);
      return true;
    } else if (doubleMoveActive && doubleMoveCount === 1) {
      setDoubleMoveActive(false);
      setDoubleMoveCount(0);
    }

    setTimeout(() => {
      questionResultHandledRef.current = false;
      generateQuestion();
      setShowQuestion(true);
    }, 500);

    return true;
  };
  const generateQuestion = () => {
    const current = namesOfAllah[Math.floor(Math.random() * namesOfAllah.length)];
    const correct = current.meaning;
    const allOptions = namesOfAllah.map((n) => n.meaning);
    const wrongOptions = new Set();

    while (wrongOptions.size < 1) {
      const rand = allOptions[Math.floor(Math.random() * allOptions.length)];
      if (rand !== correct) wrongOptions.add(rand);
    }

    const mixed = [correct, ...Array.from(wrongOptions)].sort(() => Math.random() - 0.5);
    setQuestion({ prompt: current.name, correct });
    setOptions(mixed);
    setSelected(null);
    setQuestionTimer(10);
    questionResultHandledRef.current = true;
  };

  const handleAnswer = (choice) => {
    setSelected(choice);
    const correct = choice === question.correct;

    if (correct) {
      setCorrectAnswers((prev) => prev + 1);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
      setWrongAnswers((prev) => [...prev, question]);
      setNotify("Incorrect");
      setTimeout(() => setNotify(""), 1500);
    }

    setTimeout(() => {
      setShowQuestion(false);
      triggerCpuMove();
    }, 1000);
  };

  const triggerCpuMove = () => {
    setMoveTimerRunning(false);
    setTimeout(() => makeCpuMove(), 600);
  };

  const makeCpuMove = () => {
    if (game.current.game_over) return;

    const legalMoves = game.current.moves({ verbose: true });

    if (legalMoves.length === 0) {
      const isCheck = game.current.inCheck();
      const result = isCheck ? "Checkmate!" : "Draw!";
      const winner = isCheck ? "You" : "Draw";

      setNotify(result);
      setTimeout(() => {
        navigate("/chess-results", {
          state: {
            winner,
            streak,
            correctAnswers,
            totalQuestions: correctAnswers + wrongAnswers.length,
            wrongAnswers
          }
        });
      }, 3000);
      return;
    }

    let move;

    if (cpuDifficulty === "easy") {
      move = legalMoves[Math.floor(Math.random() * legalMoves.length)];
    } else if (cpuDifficulty === "medium") {
      const captures = legalMoves.filter(m => m.flags.includes("c"));
      move = captures.length > 0
        ? captures[Math.floor(Math.random() * captures.length)]
        : legalMoves[Math.floor(Math.random() * legalMoves.length)];
    } else if (cpuDifficulty === "hard") {
      let bestEval = -Infinity;
      let bestMove = legalMoves[0];

      for (const m of legalMoves) {
        const tempGame = new Chess(game.current.fen());
        tempGame.move(m.san);

        let evalScore = 0;
        const pieces = tempGame.board().flat();
        pieces.forEach(piece => {
          if (piece) {
            const val = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }[piece.type];
            evalScore += piece.color === 'b' ? val : -val;
          }
        });

        if (evalScore > bestEval) {
          bestEval = evalScore;
          bestMove = m;
        }
      }

      move = bestMove;
    }

    game.current.move(move.san);
    setGamePosition(game.current.fen());

    if (game.current.inCheck() && lastCheckSource.current !== game.current.fen()) {
      lastCheckSource.current = game.current.fen();
      setNotify("Check!");
      setTimeout(() => setNotify(""), 3000);
    }

    if (isCheckmate()) {
      setNotify("Checkmate!");
      setTimeout(() => {
        navigate("/chess-results", {
          state: {
            winner: "CPU",
            streak,
            correctAnswers,
            totalQuestions: correctAnswers + wrongAnswers.length,
            wrongAnswers
          }
        });
      }, 3000);
      return;
    }

    startPlayerTurn();
  };

  const handleBonusClick = (bonus) => {
    if (usedBonusThisTurn || usedBonuses[bonus]) return;

    setUsedBonuses((prev) => ({ ...prev, [bonus]: true }));
    setUsedBonusThisTurn(true);

    if (bonus === "undo") {
      game.current.undo();
      game.current.undo();
      setGamePosition(game.current.fen());
      setNotify("Bonus: Undo");
      setTimeout(() => setNotify(""), 3000);
      startPlayerTurn();
    } else if (bonus === "doubleMove") {
      setDoubleMoveActive(true);
      setDoubleMoveCount(0);
      setMoveTimer(30);
      setMoveTimerRunning(true);
      setPlayerTurnActive(true);
      setNotify("Bonus: Double Move");
      setTimeout(() => setNotify(""), 3000);
    }
  };

  const streakHearts = Array(3).fill("🖤").map((h, i) => i < streak ? "💛" : "🖤");

  return (
    <div className="chess-container">
      <div className="chess-header">
        <div className="arabic-calligraphy">أسماء الحسنى</div>
        <div className="game-title">Asma’ul Husna</div>
      </div>

      {showQuestion && question ? (
        <div className="challenge-flashcard fade-in">
          <h2>{question?.prompt}</h2>
          <div className="timer-label">{questionTimer}s</div>
          <div className="answer-options">
            {options.map((option, i) => (
              <button
                key={i}
                className={`answer-button ${
                  selected &&
                  selected !== "__timeout__" &&
                  (option === question.correct
                    ? "correct"
                    : selected === option
                    ? "wrong"
                    : "")
                }`}
                onClick={() => handleAnswer(option)}
                disabled={selected !== null}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div className="timer-label">{moveTimer}s</div>
          <div className="chess-board-wrapper">
            {notify && <div className="bonus-banner center-banner">{notify}</div>}
            <Chessboard
              position={gamePosition}
              onPieceDrop={handlePieceDrop}
              boardWidth={350}
              customDarkSquareStyle={{ backgroundColor: "#102030" }}
              customLightSquareStyle={{ backgroundColor: "#203040" }}
              boardStyle={{ border: "2px solid #facc15" }}
              customPieces={{
                wP: () => <span style={{ color: "white", fontSize: 28 }}>♙</span>,
                wR: () => <span style={{ color: "white", fontSize: 28 }}>♖</span>,
                wN: () => <span style={{ color: "white", fontSize: 28 }}>♘</span>,
                wB: () => <span style={{ color: "white", fontSize: 28 }}>♗</span>,
                wQ: () => <span style={{ color: "white", fontSize: 28 }}>♕</span>,
                wK: () => <span style={{ color: "white", fontSize: 28 }}>♔</span>,
                bP: () => <span style={{ color: "gold", fontSize: 28 }}>♟</span>,
                bR: () => <span style={{ color: "gold", fontSize: 28 }}>♜</span>,
                bN: () => <span style={{ color: "gold", fontSize: 28 }}>♞</span>,
                bB: () => <span style={{ color: "gold", fontSize: 28 }}>♝</span>,
                bQ: () => <span style={{ color: "gold", fontSize: 28 }}>♛</span>,
                bK: () => <span style={{ color: "gold", fontSize: 28 }}>♚</span>,
              }}
            />
          </div>
          <div className="streak-meter">
            {streakHearts.join(" ")} <div>STREAK</div>
          </div>
          {availableBonuses.length > 0 && (
            <div className="bonus-bar">
              {availableBonuses.map((bonus) => (
                <button
                  key={bonus}
                  className="bonus-button"
                  onClick={() => handleBonusClick(bonus)}
                >
                  {bonus === "undo" && "↩️ Undo"}
                  {bonus === "doubleMove" && "🔁 Double Move"}
                </button>
              ))}
            </div>
          )}
          <button className="quit-button" onClick={() => navigate("/gamer-mode")}>
            ❌ Quit & Exit
          </button>
        </div>
      )}
    </div>
  );
}

export default ChessBoardWrapper;
