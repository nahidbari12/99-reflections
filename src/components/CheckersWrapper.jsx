// /src/components/CheckersWrapper.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/CheckersWrapper.css";
import { saveGameResult } from "../utils/gameUtils";
import NextStepCard from "./NextStepCard";

/**
 * Piece encoding:
 * 'r' = gold man (player), 'R' = gold king
 * 'b' = navy man (cpu),   'B' = navy king
 */

const BOARD_SIZE = 8;
const isDark = (r, c) => ((r + c) % 2) === 1;
const isPlayerPiece = (p) => p === "r" || p === "R";
const isCpuPiece = (p) => p === "b" || p === "B";
const isKing = (p) => p === "R" || p === "B";

function inBounds(r, c) {
  return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
}

function initialBoard() {
  const b = Array.from({ length: BOARD_SIZE }, () =>
    Array(BOARD_SIZE).fill(null)
  );
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (isDark(r, c)) b[r][c] = "b";
    }
  }
  for (let r = 5; r < 8; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (isDark(r, c)) b[r][c] = "r";
    }
  }
  return b;
}

function cloneBoard(board) {
  return board.map((row) => row.slice());
}

function directionsForPiece(piece) {
  if (!piece) return [];
  if (isKing(piece))
    return [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];
  if (piece === "r")
    return [
      [-1, -1],
      [-1, 1],
    ];
  if (piece === "b")
    return [
      [1, -1],
      [1, 1],
    ];
  return [];
}

function findMoves(board, r, c) {
  const piece = board[r][c];
  if (!piece) return { jumps: [], steps: [] };

  const dirs = directionsForPiece(piece);
  const jumps = [];
  const steps = [];

  for (const [dr, dc] of dirs) {
    const nr = r + dr,
      nc = c + dc;

    if (inBounds(nr, nc) && !board[nr][nc]) {
      steps.push({ from: [r, c], to: [nr, nc] });
    }

    const jr = r + 2 * dr,
      jc = c + 2 * dc;
    if (inBounds(jr, jc) && !board[jr][jc] && board[nr]?.[nc]) {
      const jumped = board[nr][nc];
      if (
        (isPlayerPiece(piece) && isCpuPiece(jumped)) ||
        (isCpuPiece(piece) && isPlayerPiece(jumped))
      ) {
        jumps.push({ from: [r, c], over: [nr, nc], to: [jr, jc] });
      }
    }
  }

  return { jumps, steps };
}

function listAllLegalMoves(board, forPlayer) {
  let allJumps = [];
  let allSteps = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const p = board[r][c];
      if (!p) continue;
      if (forPlayer ? isPlayerPiece(p) : isCpuPiece(p)) {
        const { jumps, steps } = findMoves(board, r, c);
        if (jumps.length)
          allJumps.push(...jumps.map((m) => ({ ...m, piece: p })));
        if (steps.length)
          allSteps.push(...steps.map((m) => ({ ...m, piece: p })));
      }
    }
  }
  return allJumps.length
    ? { moves: allJumps, mustJump: true }
    : { moves: allSteps, mustJump: false };
}

function anyJumpsAvailable(board, forPlayer) {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const p = board[r][c];
      if (!p) continue;
      if (forPlayer ? isPlayerPiece(p) : isCpuPiece(p)) {
        const { jumps } = findMoves(board, r, c);
        if (jumps.length) return true;
      }
    }
  }
  return false;
}

function maybeKing(piece, r) {
  if (piece === "r" && r === 0) return "R";
  if (piece === "b" && r === 7) return "B";
  return piece;
}

function applyMove(board, move) {
  const nb = cloneBoard(board);
  const { from, to, over } = move;
  const [fr, fc] = from;
  const [tr, tc] = to;
  const piece = nb[fr][fc];
  nb[fr][fc] = null;
  nb[tr][tc] = maybeKing(piece, tr);
  if (over) {
    const [jr, jc] = over;
    nb[jr][jc] = null;
  }
  return nb;
}

function canContinueJump(board, r, c) {
  return findMoves(board, r, c).jumps;
}

function completedMoveBoards(board, move) {
  const startingPiece = board[move.from[0]][move.from[1]];
  const nb = applyMove(board, move);
  if (!move.over) return [nb];
  const [tr, tc] = move.to;
  const promoted = (startingPiece === "r" && tr === 0) || (startingPiece === "b" && tr === 7);
  if (promoted) return [nb];
  const more = canContinueJump(nb, tr, tc);
  return more.length ? more.flatMap((next) => completedMoveBoards(nb, next)) : [nb];
}

function materialScore(board) {
  let red = 0,
    black = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const p = board[r][c];
      if (!p) continue;
      const val = p === "r" || p === "b" ? 1 : 2;
      if (isPlayerPiece(p)) red += val;
      if (isCpuPiece(p)) black += val;
    }
  }
  return red - black;
}

function evaluateBoard(board) {
  let score = 0;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const p = board[r][c];
      if (!p) continue;

      const cpu = isCpuPiece(p);
      const player = isPlayerPiece(p);
      const king = isKing(p);

      let value = king ? 5 : 3;
      if (cpu) value += r * 0.2;
      if (player) value += (7 - r) * 0.2;

      const distRow = Math.abs(r - 3.5);
      const distCol = Math.abs(c - 3.5);
      value += 1.5 - 0.3 * (distRow + distCol);

      if (cpu) score += value;
      if (player) score -= value;
    }
  }
  return score;
}

function minimaxBoard(board, depth, isCpuTurn, alpha, beta) {
  if (depth === 0) return evaluateBoard(board);

  const { moves } = listAllLegalMoves(board, !isCpuTurn);
  if (!moves.length) return isCpuTurn ? -9999 : 9999;

  if (isCpuTurn) {
    let maxEval = -Infinity;
    for (const mv of moves) {
      for (const nb of completedMoveBoards(board, mv)) {
        maxEval = Math.max(maxEval, minimaxBoard(nb, depth - 1, false, alpha, beta));
      }
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const mv of moves) {
      for (const nb of completedMoveBoards(board, mv)) {
        minEval = Math.min(minEval, minimaxBoard(nb, depth - 1, true, alpha, beta));
      }
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

function pickCpuMove(board, difficulty = "medium") {
  const { moves } = listAllLegalMoves(board, false);
  if (!moves.length) return null;

  const candidates = moves.flatMap((move) =>
    completedMoveBoards(board, move).map((resultBoard) => ({ move, resultBoard }))
  );
  if (difficulty === "easy") return candidates[Math.floor(Math.random() * candidates.length)];

  let bestMove = null;
  let bestScore = -Infinity;
  const depth = difficulty === "hard" ? 4 : 2;

  for (const candidate of candidates) {
    const score = minimaxBoard(candidate.resultBoard, depth, false, -Infinity, Infinity);

    if (score > bestScore) {
      bestScore = score;
      bestMove = candidate;
    }
  }
  return bestMove;
}

export default function CheckersWrapper() {
  const navigate = useNavigate();

  const [board, setBoard] = useState(initialBoard());
  const [turn, setTurn] = useState("player");
  const [selected, setSelected] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [mustJump, setMustJump] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [outcome, setOutcome] = useState(null);
  const [banner, setBanner] = useState("");
  const [moveCount, setMoveCount] = useState(0);
  const [difficulty, setDifficulty] = useState("medium");
  const resultSavedRef = useRef(false);

  const MOVE_TIMER = 30;
  const [timeLeft, setTimeLeft] = useState(MOVE_TIMER);
  const timerRef = useRef(null);

  const pieceAdvantage = useMemo(() => materialScore(board), [board]);

  useEffect(() => {
    const { moves, mustJump } = listAllLegalMoves(board, turn === "player");
    setMustJump(mustJump);

    if (!moves.length) {
      const out = turn === "player" ? "loss" : "win";
      setGameOver(true);
      setOutcome(out);
      setBanner(out === "win" ? "Checkers: You Win!" : "Checkers: You Lose");
      if (!resultSavedRef.current) {
        resultSavedRef.current = true;
        saveGameResult("checkers", { outcome: out, score: out === "win" ? 100 : 0 });
      }
    }
  }, [board, turn]);

  useEffect(() => {
    if (gameOver) return;
    clearInterval(timerRef.current);
    setTimeLeft(MOVE_TIMER);

    timerRef.current = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);

    return () => clearInterval(timerRef.current);
  }, [turn, gameOver]);

  useEffect(() => {
    if (gameOver || timeLeft > 0) return;
    clearInterval(timerRef.current);
    setBanner(turn === "player" ? "Time expired — CPU turn" : "CPU timed out — your turn");
    setSelected(null);
    setLegalMoves([]);
    setTurn(turn === "player" ? "cpu" : "player");
  }, [timeLeft, turn, gameOver]);

  useEffect(() => {
    if (gameOver) return;
    if (turn !== "cpu") return;

    const id = setTimeout(() => {
      const choice = pickCpuMove(board, difficulty);
      if (!choice) {
        setGameOver(true);
        setOutcome("win");
        setBanner("Checkers: You Win!");
        return;
      }

      setBoard(choice.resultBoard);
      setTurn("player");
      setMoveCount((m) => m + 1);
    }, 600);

    return () => clearTimeout(id);
  }, [turn, board, gameOver, difficulty]);

  function onCellClick(r, c) {
    if (gameOver) return;
    if (turn !== "player") return;
    if (!isDark(r, c)) return;

    const piece = board[r][c];

    if (!selected) {
      if (!piece || !isPlayerPiece(piece)) return;

      const { jumps, steps } = findMoves(board, r, c);
      const forceJumps = anyJumpsAvailable(board, true);
      const moves = (forceJumps ? jumps : [...jumps, ...steps]).map((m) => ({
        ...m,
        piece,
      }));

      if (!moves.length) return;
      setSelected([r, c]);
      setLegalMoves(moves);
      return;
    }

    const mv = legalMoves.find((m) => m.to[0] === r && m.to[1] === c);
    if (!mv) {
      if (piece && isPlayerPiece(piece)) {
        const { jumps, steps } = findMoves(board, r, c);
        const forceJumps = anyJumpsAvailable(board, true);
        const moves = (forceJumps ? jumps : [...jumps, ...steps]).map((move) => ({ ...move, piece }));
        if (moves.length) {
          setSelected([r, c]);
          setLegalMoves(moves);
        }
      }
      return;
    }

    const originalPiece = board[mv.from[0]][mv.from[1]];
    const nb = applyMove(board, mv);
    const [tr, tc] = mv.to;
    const justPromoted = (originalPiece === "r" && tr === 0) || (originalPiece === "b" && tr === 7);
    const more = mv.over && !justPromoted ? canContinueJump(nb, tr, tc) : [];

    setBoard(nb);
    if (more.length) {
      setSelected([tr, tc]);
      setLegalMoves(more.map((move) => ({ ...move, piece: nb[tr][tc] })));
      setBanner("Continue your capture");
    } else {
      setSelected(null);
      setLegalMoves([]);
      setBanner("");
      setTurn("cpu");
      setMoveCount((m) => m + 1);
    }
  }

  function newGame() {
    if (!gameOver && moveCount > 0 && !window.confirm("Start a new game and lose this board?")) return;
    setBoard(initialBoard());
    setTurn("player");
    setSelected(null);
    setLegalMoves([]);
    setMustJump(false);
    setGameOver(false);
    setOutcome(null);
    setBanner("");
    setMoveCount(0);
    setTimeLeft(MOVE_TIMER);
    resultSavedRef.current = false;
  }

  return (
    <div className="checkers-wrapper">
      <div className="cw-topbar">
        <div className="cw-titles">
          <div className="arabic-calligraphy">أسماء الحسنى</div>
          <div className="game-title">Checkers</div>
        </div>
        <div className="cw-actions">
          <label className="cw-difficulty">
            <span>Difficulty</span>
            <select
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value)}
              disabled={turn === "cpu"}
              aria-label="Checkers difficulty"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
          <div className={`cw-timer ${timeLeft <= 5 ? "low" : ""}`}>
            ⏱ {timeLeft}s
          </div>
          <button className="btn quit" onClick={() => navigate("/gamer-mode")}>
            Quit & Exit
          </button>
          <button className="btn" onClick={newGame}>
            New Game
          </button>
        </div>
      </div>

      {banner && <div className="cw-banner">{banner}</div>}

      <div className="cw-board">
        {Array.from({ length: BOARD_SIZE }).map((_, r) => (
          <div className="cw-row" key={r}>
            {Array.from({ length: BOARD_SIZE }).map((__, c) => {
              const dark = isDark(r, c);
              const p = board[r][c];
              const isSel =
                selected && selected[0] === r && selected[1] === c;
              const isDest = !!legalMoves.find(
                (m) => m.to[0] === r && m.to[1] === c
              );

              return (
                <button
                  type="button"
                  key={c}
                  className={`cw-cell ${dark ? "dark" : "light"} ${
                    isSel ? "selected" : ""
                  } ${isDest ? "dest" : ""}`}
                  onClick={() => onCellClick(r, c)}
                  aria-label={`${dark ? "Playable" : "Light"} square row ${r + 1}, column ${c + 1}${p ? `, ${isPlayerPiece(p) ? "your" : "CPU"} ${isKing(p) ? "king" : "piece"}` : ""}`}
                  disabled={!dark || gameOver || turn !== "player"}
                >
                  {p && (
                    <div
                      className={`piece ${
                        isPlayerPiece(p) ? "red" : "black"
                      } ${isKing(p) ? "king" : ""}`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Premium turn indicator chip */}
      <div className="cw-turn-chip">
        {turn === "player" ? "Your Move" : "CPU Thinking..."}
      </div>

      <div className="cw-infobar">
        <div>
          Piece Advantage:{" "}
          <strong>
            {pieceAdvantage > 0 ? `+${pieceAdvantage}` : pieceAdvantage}
          </strong>
        </div>
        <div>
          Moves: <strong>{moveCount}</strong>
        </div>
        {mustJump && turn === "player" && (
          <div className="must-jump">Capture available!</div>
        )}
      </div>

      {gameOver && (
        <div className="cw-overlay">
          <div className="cw-modal">
            <h3>{outcome === "win" ? "You Win!" : "You Lose"}</h3>
            <p className="cw-modal-sub">
              {outcome === "win"
                ? "Beautiful game. Ready for another round?"
                : "Tough loss. Study the board and try again."}
            </p>
            <div className="cw-summary">
              <div>
                Piece Advantage:{" "}
                <strong>
                  {pieceAdvantage > 0 ? `+${pieceAdvantage}` : pieceAdvantage}
                </strong>
              </div>
              <div>
                Total Moves: <strong>{moveCount}</strong>
              </div>
            </div>
            <div className="cw-buttons">
              <button className="btn" onClick={newGame}>
                Play Again
              </button>
              <button className="btn" onClick={() => navigate("/gamer-mode")}>
                Back to Gamer Mode
              </button>
            </div>
            <NextStepCard context="checkers" hasMistakes={outcome !== "win"} />
          </div>
        </div>
      )}
    </div>
  );
}
