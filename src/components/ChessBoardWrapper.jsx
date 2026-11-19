import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { buildMeaningQuestion, recordGameAttempt, saveGameResult } from "../utils/gameUtils";
import { chooseChessCpuMove, isSupportedChessDifficulty } from "../utils/chessEngine";
import "../styles/ChessBoardWrapper.css";

const PLAYER_SECONDS = 30;
const BONUS_SECONDS = 45;
const QUESTION_SECONDS = 10;

function ChessBoardWrapper() {
  const navigate = useNavigate();
  const game = useRef(new Chess());
  const mountedRef = useRef(true);
  const phaseRef = useRef("player");
  const timersRef = useRef(new Set());
  const previousTurnFenRef = useRef(null);
  const timerBonusRef = useRef(false);
  const resultSavedRef = useRef(false);
  const statsRef = useRef({ correct: 0, wrongAnswers: [], streak: 0 });
  const [gamePosition, setGamePosition] = useState("start");
  const [phase, setPhaseState] = useState("player");
  const [question, setQuestion] = useState(null);
  const [selected, setSelected] = useState(null);
  const [questionTimer, setQuestionTimer] = useState(QUESTION_SECONDS);
  const [moveTimer, setMoveTimer] = useState(PLAYER_SECONDS);
  const [streak, setStreak] = useState(0);
  const [notify, setNotify] = useState("");
  const [availableBonuses, setAvailableBonuses] = useState([]);
  const [usedBonuses, setUsedBonuses] = useState({});
  const [usedBonusThisTurn, setUsedBonusThisTurn] = useState(false);
  const [hintSquares, setHintSquares] = useState({});
  const [cpuDifficulty, setCpuDifficulty] = useState("medium");
  const [boardSize, setBoardSize] = useState(350);

  const setPhase = useCallback((next) => {
    phaseRef.current = next;
    if (mountedRef.current) setPhaseState(next);
  }, []);
  const schedule = useCallback((callback, delay) => {
    const id = window.setTimeout(() => {
      timersRef.current.delete(id);
      if (mountedRef.current) callback();
    }, delay);
    timersRef.current.add(id);
    return id;
  }, []);
  const clearScheduled = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current.clear();
  }, []);
  const announce = useCallback((message, duration = 1600) => {
    setNotify(message);
    if (duration) schedule(() => setNotify(""), duration);
  }, [schedule]);
  const finishGame = useCallback((winner, outcome) => {
    if (resultSavedRef.current || phaseRef.current === "finished") return;
    resultSavedRef.current = true;
    setPhase("finished");
    clearScheduled();
    const stats = statsRef.current;
    saveGameResult("chess", { outcome, score: stats.correct * 10 });
    navigate("/chess-results", { state: { winner, streak: stats.streak, correctAnswers: stats.correct, totalQuestions: stats.correct + stats.wrongAnswers.length, wrongAnswers: stats.wrongAnswers } });
  }, [clearScheduled, navigate, setPhase]);
  const startPlayerTurn = useCallback(() => {
    if (phaseRef.current === "finished") return;
    setPhase("player");
    setMoveTimer(timerBonusRef.current ? BONUS_SECONDS : PLAYER_SECONDS);
    setUsedBonusThisTurn(false);
  }, [setPhase]);
  const makeCpuMove = useCallback(() => {
    if (phaseRef.current !== "cpu" || game.current.turn() !== "b") return;
    const move = chooseChessCpuMove(game.current.fen(), cpuDifficulty);
    if (!move) {
      const draw = !game.current.isCheckmate();
      finishGame(draw ? "Draw" : "You", draw ? "draw" : "win");
      return;
    }
    game.current.move(move.san);
    setGamePosition(game.current.fen());
    if (game.current.isGameOver()) {
      const draw = !game.current.isCheckmate();
      announce(draw ? "Draw!" : "Checkmate!", 0);
      schedule(() => finishGame(draw ? "Draw" : "CPU", draw ? "draw" : "loss"), 900);
      return;
    }
    if (game.current.inCheck()) announce("Check!", 1200);
    startPlayerTurn();
  }, [announce, cpuDifficulty, finishGame, schedule, startPlayerTurn]);
  const beginCpuTurn = useCallback(() => {
    if (phaseRef.current === "finished") return;
    setPhase("cpu");
    schedule(makeCpuMove, 450);
  }, [makeCpuMove, schedule, setPhase]);
  const openQuestion = useCallback(() => {
    if (phaseRef.current !== "question-pending") return;
    const next = buildMeaningQuestion(null, 4);
    setQuestion(next);
    setSelected(null);
    setQuestionTimer(QUESTION_SECONDS);
    setPhase("question");
  }, [setPhase]);

  useEffect(() => {
    mountedRef.current = true;
    phaseRef.current = "player";
    const saved = localStorage.getItem("cpuDifficulty");
    setCpuDifficulty(isSupportedChessDifficulty(saved) ? saved : "medium");
    const resize = () => setBoardSize(Math.max(260, Math.min(350, (window.innerWidth || 360) - 40)));
    resize();
    window.addEventListener("resize", resize);
    return () => {
      mountedRef.current = false;
      phaseRef.current = "finished";
      clearScheduled();
      window.removeEventListener("resize", resize);
    };
  }, [clearScheduled]);
  useEffect(() => {
    if (phase !== "player") return undefined;
    const interval = window.setInterval(() => setMoveTimer((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(interval);
  }, [phase]);
  useEffect(() => {
    if (phase !== "player" || moveTimer !== 0) return;
    setPhase("cpu");
    const legal = game.current.moves({ verbose: true });
    if (game.current.turn() === "w" && legal.length) {
      previousTurnFenRef.current = game.current.fen();
      const quiet = legal.filter((move) => !move.captured);
      const forced = quiet[Math.floor(Math.random() * quiet.length)] || legal[0];
      game.current.move(forced.san);
      setGamePosition(game.current.fen());
      announce(`Time expired · auto-moved ${forced.from}–${forced.to}`, 1200);
      if (game.current.isGameOver()) {
        const draw = !game.current.isCheckmate();
        schedule(() => finishGame(draw ? "Draw" : "You", draw ? "draw" : "win"), 900);
      } else schedule(makeCpuMove, 450);
    }
  }, [announce, finishGame, makeCpuMove, moveTimer, phase, schedule, setPhase]);
  useEffect(() => {
    if (phase !== "question" || selected !== null) return undefined;
    const interval = window.setInterval(() => setQuestionTimer((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(interval);
  }, [phase, selected]);

  const completeQuestion = useCallback((isCorrect) => {
    if (phaseRef.current !== "question" || !question) return;
    setPhase("question-result");
    recordGameAttempt(question.card, isCorrect, "chess", Math.max(1, QUESTION_SECONDS - questionTimer));
    if (isCorrect) {
      statsRef.current.correct += 1;
      statsRef.current.streak += 1;
      setStreak(statsRef.current.streak);
      announce("+1 Correct", 800);
    } else {
      statsRef.current.streak = 0;
      statsRef.current.wrongAnswers = [...statsRef.current.wrongAnswers, question];
      setStreak(0);
      announce(`Incorrect · ${question.correct}`, 900);
    }
    schedule(() => {
      setQuestion(null);
      setSelected(null);
      beginCpuTurn();
    }, 900);
  }, [announce, beginCpuTurn, question, questionTimer, schedule, setPhase]);
  useEffect(() => {
    if (phase === "question" && questionTimer === 0 && selected === null) {
      setSelected("__timeout__");
      completeQuestion(false);
    }
  }, [completeQuestion, phase, questionTimer, selected]);
  useEffect(() => {
    if (streak >= 3 && !timerBonusRef.current) {
      timerBonusRef.current = true;
      setMoveTimer(BONUS_SECONDS);
      announce("Reward unlocked: 45-second turns", 1800);
    }
    if (streak >= 6) setAvailableBonuses((items) => items.includes("undo") ? items : [...items, "undo"]);
    if (streak >= 9) setAvailableBonuses((items) => items.includes("hint") ? items : [...items, "hint"]);
  }, [announce, streak]);

  const handlePieceDrop = (source, target) => {
    if (phaseRef.current !== "player" || game.current.turn() !== "w") return false;
    const beforeMove = game.current.fen();
    const move = game.current.move({ from: source, to: target, promotion: "q" });
    if (!move) return false;
    previousTurnFenRef.current = beforeMove;
    setGamePosition(game.current.fen());
    setPhase("question-pending");
    if (game.current.isGameOver()) {
      const draw = !game.current.isCheckmate();
      schedule(() => finishGame(draw ? "Draw" : "You", draw ? "draw" : "win"), 700);
    } else schedule(openQuestion, 350);
    return true;
  };
  const handleAnswer = (choice) => {
    if (phaseRef.current !== "question" || selected !== null || !question) return;
    setSelected(choice);
    completeQuestion(choice === question.correct);
  };
  const handleBonusClick = (bonus) => {
    if (phaseRef.current !== "player" || usedBonusThisTurn || usedBonuses[bonus]) return;
    if (bonus === "undo") {
      if (!previousTurnFenRef.current) {
        announce("Undo is available after a full turn");
        return;
      }
      game.current.load(previousTurnFenRef.current);
      previousTurnFenRef.current = null;
      setGamePosition(game.current.fen());
      setUsedBonuses((items) => ({ ...items, undo: true }));
      setUsedBonusThisTurn(true);
      setMoveTimer(timerBonusRef.current ? BONUS_SECONDS : PLAYER_SECONDS);
      announce("Reward used: full turn undone");
      return;
    }
    const legal = game.current.moves({ verbose: true });
    const suggestion = legal.find((move) => move.san.includes("#")) || legal.find((move) => move.captured) || legal.find((move) => move.san.includes("+")) || legal[0];
    if (!suggestion) return;
    setHintSquares({ [suggestion.from]: { boxShadow: "inset 0 0 0 4px #38bdf8" }, [suggestion.to]: { boxShadow: "inset 0 0 0 4px #facc15" } });
    setUsedBonuses((items) => ({ ...items, hint: true }));
    setUsedBonusThisTurn(true);
    announce(`Hint: ${suggestion.from} → ${suggestion.to}`, 3000);
    schedule(() => setHintSquares({}), 3000);
  };

  const timerBonusActive = timerBonusRef.current;
  const undoUnlocked = availableBonuses.includes("undo");
  const hintUnlocked = availableBonuses.includes("hint");
  const streakHearts = Array.from({ length: 9 }, (_, index) => index < streak ? "💛" : "🖤").join(" ");
  const isQuestion = phase === "question" || phase === "question-result";

  return <div className="chess-container">
    <div className="chess-header"><div className="arabic-calligraphy">أسماء الحسنى</div><div className="game-title">Asma’ul Husna · Chess</div></div>
    {isQuestion ? <div className="challenge-flashcard fade-in">
      <div className="flashcard-header"><span className="flashcard-label">Challenge Question</span><span className="flashcard-timer">{questionTimer}s</span></div>
      <h2 className="flashcard-prompt">{question?.prompt}</h2>
      <div className="answer-options">{question?.options.map((option) => <button key={option} className={`answer-button ${selected ? (option === question.correct ? "correct" : selected === option ? "wrong" : "") : ""}`} onClick={() => handleAnswer(option)} disabled={phase !== "question" || selected !== null}>{option}</button>)}</div>
    </div> : <div className="chess-main-panel">
      <div className="timer-row"><div className="timer-pill">{phase === "cpu" ? "CPU thinking…" : `${moveTimer}s`}</div><div className="streak-meter"><span>{streakHearts}</span><div className="streak-label">STREAK</div></div></div>
      <div className="chess-board-row">
        <div className="chess-board-wrapper">{notify && <div className="bonus-banner center-banner" role="status">{notify}</div>}<Chessboard position={gamePosition} onPieceDrop={handlePieceDrop} arePiecesDraggable={phase === "player"} boardWidth={boardSize} customDarkSquareStyle={{ backgroundColor: "#102030" }} customLightSquareStyle={{ backgroundColor: "#203040" }} customSquareStyles={hintSquares} boardStyle={{ border: "2px solid #facc15" }} /></div>
        <div className="chess-bonus-panel"><div className="chess-bonus-title">Rewards</div>
          <div className={`bonus-tile ${timerBonusActive ? "unlocked" : ""}`}><div className="bonus-tile-label"><span>⏱️</span><span>45s Turns</span></div><div className="bonus-tile-caption">{timerBonusActive ? "Active for this game" : "Unlocks at 3-streak"}</div></div>
          <button type="button" className={`bonus-tile ${undoUnlocked ? "unlocked" : ""} ${usedBonuses.undo ? "used" : ""}`} disabled={!undoUnlocked || usedBonuses.undo || phase !== "player"} onClick={() => handleBonusClick("undo")}><span className="bonus-tile-label"><span>↩️</span><span>Undo Move</span></span><span className="bonus-tile-caption">{usedBonuses.undo ? "Used" : "Unlocks at 6-streak"}</span></button>
          <button type="button" className={`bonus-tile ${hintUnlocked ? "unlocked" : ""} ${usedBonuses.hint ? "used" : ""}`} disabled={!hintUnlocked || usedBonuses.hint || phase !== "player"} onClick={() => handleBonusClick("hint")}><span className="bonus-tile-label"><span>💡</span><span>Tactical Hint</span></span><span className="bonus-tile-caption">{usedBonuses.hint ? "Used" : "Unlocks at 9-streak"}</span></button>
        </div>
      </div>
      <button className="quit-button" onClick={() => { setPhase("finished"); clearScheduled(); navigate("/gamer-mode"); }}>❌ Quit &amp; Exit</button>
    </div>}
  </div>;
}

export default ChessBoardWrapper;
