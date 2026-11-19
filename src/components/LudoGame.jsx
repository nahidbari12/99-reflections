// /src/components/LudoGame.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LudoGame.css";

const PLAYER_COUNT = 4; // 0 = Human, 1/2/3 = CPU
const TOKENS_PER_PLAYER = 4;
const TRACK_LENGTH = 52;
const HOME_ROW_LENGTH = 6;

// Starting indices around the track (4 sides × 13)
const START_INDEX = [0, 13, 26, 39];

// Home entry indices (last track square before home row)
const HOME_ENTRY = START_INDEX.map(
  (start) => (start + TRACK_LENGTH - 1) % TRACK_LENGTH
);

// Safe squares: all starting squares + some standard safe tiles
const SAFE_SQUARES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

// NOTE: index 0 = human blue at bottom-right on image
const PLAYER_COLORS = ["blue", "red", "green", "yellow"];
const PLAYER_LABELS = ["You (Blue)", "CPU Red", "CPU Green", "CPU Yellow"];

// Home token clusters (percent coords over the board image)
const HOME_POSITIONS = [
  // Blue (bottom-right)
  [
    { x: 78, y: 78 },
    { x: 88, y: 78 },
    { x: 78, y: 88 },
    { x: 88, y: 88 },
  ],
  // Red (bottom-left)
  [
    { x: 12, y: 78 },
    { x: 22, y: 78 },
    { x: 12, y: 88 },
    { x: 22, y: 88 },
  ],
  // Green (top-left)
  [
    { x: 12, y: 12 },
    { x: 22, y: 12 },
    { x: 12, y: 22 },
    { x: 22, y: 22 },
  ],
  // Yellow (top-right)
  [
    { x: 78, y: 12 },
    { x: 88, y: 12 },
    { x: 78, y: 22 },
    { x: 88, y: 22 },
  ],
];

// Finished tokens cluster near center (offset per player)
const FINISH_OFFSETS = [
  { dx: 10, dy: 10 }, // Blue (bottom-right of center)
  { dx: -10, dy: 10 }, // Red (bottom-left)
  { dx: -10, dy: -10 }, // Green (top-left)
  { dx: 10, dy: -10 }, // Yellow (top-right)
];

// Utility: distance along circular track
function distanceOnTrack(from, to) {
  return (to - from + TRACK_LENGTH) % TRACK_LENGTH;
}

// Token structure: { posType: "home" | "track" | "homeRow" | "finished", index: number }
function createInitialTokens() {
  const tokens = [];
  for (let p = 0; p < PLAYER_COUNT; p++) {
    const playerTokens = [];
    for (let t = 0; t < TOKENS_PER_PLAYER; t++) {
      playerTokens.push({ posType: "home", index: -1 });
    }
    tokens.push(playerTokens);
  }
  return tokens;
}

// Compute new position for a single token if moved with the dice
function computeNewPosition(player, token, dice) {
  const start = START_INDEX[player];
  const entry = HOME_ENTRY[player];

  // Token still in home
  if (token.posType === "home") {
    if (dice !== 6) return null;
    // enter the board at start index
    return { posType: "track", index: start };
  }

  // Token on main track
  if (token.posType === "track") {
    const currentIndex = token.index;

    const distToEntry = distanceOnTrack(currentIndex, entry);

    if (dice <= distToEntry) {
      // Still on main track
      return {
        posType: "track",
        index: (currentIndex + dice) % TRACK_LENGTH,
      };
    } else {
      // Move into home row
      const stepsBeyondEntry = dice - distToEntry - 1; // first step after entry is homeRow[0]
      if (stepsBeyondEntry > HOME_ROW_LENGTH - 1) {
        // Would overshoot final home
        return null;
      }
      return {
        posType: "homeRow",
        index: stepsBeyondEntry,
      };
    }
  }

  // Token in home row
  if (token.posType === "homeRow") {
    const newIndex = token.index + dice;
    if (newIndex > HOME_ROW_LENGTH - 1) {
      // can't overshoot
      return null;
    }
    if (newIndex === HOME_ROW_LENGTH - 1) {
      // reached final cell -> finished
      return { posType: "finished", index: -1 };
    }
    return { posType: "homeRow", index: newIndex };
  }

  // Finished tokens cannot move
  if (token.posType === "finished") {
    return null;
  }

  return null;
}

// Returns all tokens that can legally move and what their destination would be
function getLegalMoves(tokens, currentPlayer, dice) {
  const moves = [];
  const playerTokens = tokens[currentPlayer];

  for (let i = 0; i < playerTokens.length; i++) {
    const tok = playerTokens[i];
    const newPos = computeNewPosition(currentPlayer, tok, dice);
    if (!newPos) continue;

    // Check capture / block rules if ending on the main track
    if (newPos.posType === "track") {
      const targetIndex = newPos.index;

      // Find all tokens on this track square
      const occupants = [];
      for (let p = 0; p < PLAYER_COUNT; p++) {
        for (let j = 0; j < TOKENS_PER_PLAYER; j++) {
          const ot = tokens[p][j];
          if (ot.posType === "track" && ot.index === targetIndex) {
            occupants.push({ player: p, tokenIndex: j });
          }
        }
      }

      const isSafe = SAFE_SQUARES.has(targetIndex);

      if (occupants.length === 0) {
        // free square, okay
      } else if (isSafe) {
        // Safe squares: allow stacking, no capturing
      } else {
        // Not safe
        const ownCount = occupants.filter((o) => o.player === currentPlayer).length;
        const enemy = occupants.filter((o) => o.player !== currentPlayer);

        if (ownCount > 0 && enemy.length === 0) {
          // own stack, allowed (just stack)
        } else if (enemy.length === 1 && ownCount === 0) {
          // single enemy token -> capture
        } else {
          // multiple tokens (block) or mixed; disallow this move
          continue;
        }
      }
    }

    moves.push({
      tokenIndex: i,
      newPos,
    });
  }

  return moves;
}

// Apply a chosen move, including capturing logic if applicable
function applyMove(tokens, currentPlayer, move) {
  const newTokens = tokens.map((playerTokens) =>
    playerTokens.map((tok) => ({ ...tok }))
  );
  const { tokenIndex, newPos } = move;
  const token = newTokens[currentPlayer][tokenIndex];

  token.posType = newPos.posType;
  token.index = newPos.index;

  // Handle capture if we ended on a track square
  if (newPos.posType === "track") {
    const targetIndex = newPos.index;
    const isSafe = SAFE_SQUARES.has(targetIndex);

    if (!isSafe) {
      // Find opponents on this square
      const occupants = [];
      for (let p = 0; p < PLAYER_COUNT; p++) {
        for (let j = 0; j < TOKENS_PER_PLAYER; j++) {
          const ot = newTokens[p][j];
          if (ot.posType === "track" && ot.index === targetIndex) {
            occupants.push({ player: p, tokenIndex: j });
          }
        }
      }

      const enemy = occupants.filter((o) => o.player !== currentPlayer);
      const ownCount = occupants.filter((o) => o.player === currentPlayer).length;

      if (enemy.length === 1 && ownCount === 1) {
        const captured = enemy[0];
        newTokens[captured.player][captured.tokenIndex] = {
          posType: "home",
          index: -1,
        };
      }
    }
  }

  return newTokens;
}

// Heuristic scoring for CPU moves
function scoreMove(tokens, player, dice, move) {
  let score = 0;
  const originalToken = tokens[player][move.tokenIndex];
  const newPos = move.newPos;

  // Bonus for leaving home
  if (originalToken.posType === "home" && newPos.posType !== "home") {
    score += 5;
  }

  // Progress bonus
  const start = START_INDEX[player];

  const progress = (() => {
    if (newPos.posType === "home") return 0;
    if (newPos.posType === "track") {
      const distFromStart = distanceOnTrack(start, newPos.index);
      return distFromStart;
    }
    if (newPos.posType === "homeRow") {
      return TRACK_LENGTH + newPos.index * 2;
    }
    if (newPos.posType === "finished") {
      return TRACK_LENGTH + HOME_ROW_LENGTH * 2 + 10;
    }
    return 0;
  })();

  score += progress * 0.3;

  // Check if this move captures
  if (newPos.posType === "track") {
    const targetIndex = newPos.index;
    const isSafe = SAFE_SQUARES.has(targetIndex);
    if (!isSafe) {
      let enemyCount = 0;
      let totalCount = 0;
      for (let p = 0; p < PLAYER_COUNT; p++) {
        for (let j = 0; j < TOKENS_PER_PLAYER; j++) {
          const ot = tokens[p][j];
          if (ot.posType === "track" && ot.index === targetIndex) {
            totalCount++;
            if (p !== player) enemyCount++;
          }
        }
      }
      if (enemyCount === 1 && totalCount === 1) {
        score += 15;
      }
    }
  }

  // Extra incentive for finishing a token
  if (newPos.posType === "finished") {
    score += 20;
  }

  // Slight boost if dice === 6 (extra turn)
  if (dice === 6) {
    score += 3;
  }

  return score;
}

/**
 * Map a track index (0–51) to coordinates on the board image.
 * These numbers are tuned for the classic board you added.
 */
function trackIndexToCoords(index) {
  // Break into the 4 sides / 13 squares each
  const side = Math.floor(index / 13); // 0..3
  const step = index % 13; // 0..12

  // Rough outer ring bounds (in % inside the board image)
  const left = 7;
  const right = 93;
  const top = 7;
  const bottom = 93;

  const stepSize = (right - left) / 12;

  let x, y;

  switch (side) {
    case 0: // starting at Blue entry (bottom-right going up-left, etc.)
      // top row: left → right
      x = left + step * stepSize;
      y = top;
      break;
    case 1: // right column: top → bottom
      x = right;
      y = top + step * stepSize;
      break;
    case 2: // bottom row: right → left
      x = right - step * stepSize;
      y = bottom;
      break;
    case 3: // left column: bottom → top
      x = left;
      y = bottom - step * stepSize;
      break;
    default:
      x = 50;
      y = 50;
  }

  return { x, y };
}

// Compute board coordinates (percentages) for a token
function getBoardCoords(playerIndex, token, tokenIdx) {
  const cx = 50;
  const cy = 50;

  // Home tokens in corner clusters
  if (token.posType === "home") {
    const homeArray = HOME_POSITIONS[playerIndex];
    const slot = homeArray[tokenIdx] || homeArray[0];
    return { x: slot.x, y: slot.y };
  }

  // Finished tokens in center cluster
  if (token.posType === "finished") {
    const base = { x: cx, y: cy };
    const offset = FINISH_OFFSETS[playerIndex] || { dx: 0, dy: 0 };
    return {
      x: base.x + offset.dx,
      y: base.y + offset.dy,
    };
  }

  // Tokens on the main track
  if (token.posType === "track") {
    return trackIndexToCoords(token.index);
  }

  // Home row: move from entry square toward center, tuned for image arms
  if (token.posType === "homeRow") {
    const t = (token.index + 1) / (HOME_ROW_LENGTH + 1); // 1/7..6/7

    let start, end;
    switch (playerIndex) {
      case 0: // Blue: bottom-right arm toward center
        start = { x: 78, y: 93 };
        end = { x: cx, y: cy };
        break;
      case 1: // Red: bottom-left arm
        start = { x: 7, y: 78 };
        end = { x: cx, y: cy };
        break;
      case 2: // Green: top-left arm
        start = { x: 22, y: 7 };
        end = { x: cx, y: cy };
        break;
      case 3: // Yellow: top-right arm
        start = { x: 93, y: 22 };
        end = { x: cx, y: cy };
        break;
      default:
        start = { x: cx, y: cy };
        end = { x: cx, y: cy };
    }

    const x = start.x + (end.x - start.x) * t;
    const y = start.y + (end.y - start.y) * t;
    return { x, y };
  }

  return null;
}

const LudoGame = () => {
  const navigate = useNavigate();

  const [tokens, setTokens] = useState(createInitialTokens);
  const [currentPlayer, setCurrentPlayer] = useState(0); // 0 = human
  const [dice, setDice] = useState(null);
  const [canRoll, setCanRoll] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [message, setMessage] = useState("Roll the dice to begin!");

  // Derived: count finished tokens for each player
  const finishedCounts = useMemo(() => {
    return tokens.map((playerTokens) =>
      playerTokens.filter((t) => t.posType === "finished").length
    );
  }, [tokens]);

  // Check for winner
  useEffect(() => {
    for (let p = 0; p < PLAYER_COUNT; p++) {
      if (finishedCounts[p] === TOKENS_PER_PLAYER && !gameOver) {
        setGameOver(true);
        setWinner(p);
        setMessage(
          p === 0
            ? "🎉 You won Ludo!"
            : `🏆 ${PLAYER_LABELS[p]} won the game.`
        );
        setCanRoll(false);
        break;
      }
    }
  }, [finishedCounts, gameOver]);

  const nextPlayer = (current) => (current + 1) % PLAYER_COUNT;

  const handleRollDice = () => {
    if (!canRoll || gameOver || currentPlayer !== 0) return;

    const roll = Math.floor(Math.random() * 6) + 1;
    setDice(roll);

    const moves = getLegalMoves(tokens, currentPlayer, roll);

    if (moves.length === 0) {
      setMessage(`You rolled a ${roll}, but have no valid moves.`);
      setTimeout(() => {
        setDice(null);
        setCurrentPlayer((p) => nextPlayer(p));
        setCanRoll(true);
        setMessage(`${PLAYER_LABELS[1]} is thinking...`);
      }, 1000);
    } else {
      setMessage(`You rolled a ${roll}. Tap a blue token to move.`);
      setCanRoll(false);
    }
  };

  const handleHumanTokenClick = (tokenIndex) => {
    if (gameOver || currentPlayer !== 0 || dice == null || canRoll) return;

    const moves = getLegalMoves(tokens, 0, dice);
    const selectedMove = moves.find((m) => m.tokenIndex === tokenIndex);
    if (!selectedMove) return;

    const newTokens = applyMove(tokens, 0, selectedMove);
    setTokens(newTokens);

    if (dice === 6 && !gameOver) {
      setMessage("You rolled a 6 and moved a token – roll again!");
      setDice(null);
      setCanRoll(true);
    } else {
      setMessage(`${PLAYER_LABELS[1]} is thinking...`);
      setDice(null);
      setCanRoll(true);
      setCurrentPlayer((p) => nextPlayer(p));
    }
  };

  // CPU logic
  useEffect(() => {
    if (gameOver) return;
    if (currentPlayer === 0) return;

    const timeoutId = setTimeout(() => {
      const roll = Math.floor(Math.random() * 6) + 1;
      setDice(roll);

      const moves = getLegalMoves(tokens, currentPlayer, roll);

      if (moves.length === 0) {
        setMessage(
          `${PLAYER_LABELS[currentPlayer]} rolled ${roll} but had no moves.`
        );
        setTimeout(() => {
          setDice(null);
          const np = nextPlayer(currentPlayer);
          setCurrentPlayer(np);
          if (np === 0) {
            setMessage("Your turn. Roll the dice!");
          } else {
            setMessage(`${PLAYER_LABELS[np]} is thinking...`);
          }
        }, 800);
      } else {
        let best = moves[0];
        let bestScore = scoreMove(tokens, currentPlayer, roll, best);

        for (let m of moves.slice(1)) {
          const s = scoreMove(tokens, currentPlayer, roll, m);
          if (s > bestScore) {
            best = m;
            bestScore = s;
          }
        }

        const newTokens = applyMove(tokens, currentPlayer, best);
        setTokens(newTokens);

        if (roll === 6 && !gameOver) {
          setMessage(
            `${PLAYER_LABELS[currentPlayer]} rolled a 6 and goes again.`
          );
          setDice(null);
        } else {
          setTimeout(() => {
            const np = nextPlayer(currentPlayer);
            setDice(null);
            setCurrentPlayer(np);
            if (np === 0) {
              setMessage("Your turn. Roll the dice!");
            } else {
              setMessage(`${PLAYER_LABELS[np]} is thinking...`);
            }
          }, 500);
        }
      }
    }, 900);

    return () => clearTimeout(timeoutId);
  }, [currentPlayer, gameOver, tokens]);

  const handleQuit = () => {
    navigate("/gamer-mode");
  };

  const handleNewGame = () => {
    setTokens(createInitialTokens());
    setCurrentPlayer(0);
    setDice(null);
    setCanRoll(true);
    setGameOver(false);
    setWinner(null);
    setMessage("New game started. Roll the dice to begin!");
  };

  // Project each token into board coordinates
  const boardTokens = [];
  for (let p = 0; p < PLAYER_COUNT; p++) {
    for (let t = 0; t < TOKENS_PER_PLAYER; t++) {
      const tok = tokens[p][t];
      const coords = getBoardCoords(p, tok, t);
      if (!coords) continue;
      boardTokens.push({
        player: p,
        tokenIndex: t,
        x: coords.x,
        y: coords.y,
      });
    }
  }

  return (
    <div className="ludo-game-page">
      <div className="ludo-header">
        <h1>🎲 Ludo</h1>
        <p>
          Classic Ludo: roll a <strong>6</strong> to bring tokens out of home,
          race around the board, and get all 4 tokens into the center before the
          CPUs. Landing on an opponent sends them back home — unless they’re on
          a safe spot.
        </p>
      </div>

      {/* Status + Dice Area */}
      <div className="ludo-top-panel">
        <div className="ludo-status">
          <div>
            Turn:{" "}
            <span
              className={`player-label player-${PLAYER_COLORS[currentPlayer]}`}
            >
              {PLAYER_LABELS[currentPlayer]}
            </span>
          </div>
          <div className="ludo-message">{message}</div>
          {gameOver && winner !== null && (
            <div className="ludo-gameover">
              {winner === 0 ? "🎉 You Win!" : `🏆 ${PLAYER_LABELS[winner]} Wins!`}
            </div>
          )}
        </div>

        <div className="ludo-dice-panel">
          <div className="dice-display">{dice !== null ? dice : "-"}</div>
          <button
            className="ludo-btn primary"
            onClick={handleRollDice}
            disabled={gameOver || currentPlayer !== 0 || !canRoll}
          >
            {currentPlayer === 0 ? "Roll Dice" : "Waiting..."}
          </button>
          <div className="dice-hint">
            {currentPlayer === 0
              ? "Tap Roll, then tap a blue token to move."
              : "CPU rolls automatically."}
          </div>
        </div>
      </div>

      {/* Board + side panels */}
      <div className="ludo-board-container">
        <div className="ludo-board-wrapper">
          <div className="ludo-board">
            {boardTokens.map((bt) => (
              <div
                key={`token-${bt.player}-${bt.tokenIndex}`}
                className={`ludo-token player-${PLAYER_COLORS[bt.player]}`}
                style={{
                  left: `${bt.x}%`,
                  top: `${bt.y}%`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Side summary panels (unchanged) */}
        <div className="ludo-side-panels">
          <div className="ludo-player-panels">
            {tokens.map((playerTokens, pIndex) => {
              const color = PLAYER_COLORS[pIndex];
              const finished = finishedCounts[pIndex];
              const homeCount = playerTokens.filter(
                (t) => t.posType === "home"
              ).length;
              const inPlay = playerTokens.filter(
                (t) => t.posType === "track" || t.posType === "homeRow"
              ).length;

              return (
                <div
                  key={pIndex}
                  className={`ludo-player-panel panel-${color} ${
                    currentPlayer === pIndex ? "active" : ""
                  }`}
                >
                  <div className="panel-header">
                    <span className={`player-dot dot-${color}`} />
                    <span>{PLAYER_LABELS[pIndex]}</span>
                  </div>
                  <div className="panel-row">
                    <span>Home:</span> <strong>{homeCount}</strong>
                  </div>
                  <div className="panel-row">
                    <span>In Play:</span> <strong>{inPlay}</strong>
                  </div>
                  <div className="panel-row">
                    <span>Finished:</span> <strong>{finished}</strong>
                  </div>

                  {/* Human tokens: clickable pills */}
                  <div className="panel-tokens">
                    {playerTokens.map((tok, tIndex) => {
                      const key = `${pIndex}-${tIndex}`;
                      const canClick =
                        pIndex === 0 &&
                        !gameOver &&
                        currentPlayer === 0 &&
                        dice !== null &&
                        !canRoll &&
                        getLegalMoves(tokens, 0, dice).some(
                          (m) => m.tokenIndex === tIndex
                        );

                      let posLabel = "";
                      if (tok.posType === "home") posLabel = "Home";
                      else if (tok.posType === "track")
                        posLabel = `Track ${tok.index}`;
                      else if (tok.posType === "homeRow")
                        posLabel = `Home Row ${tok.index}`;
                      else if (tok.posType === "finished") posLabel = "Finished";

                      return (
                        <button
                          key={key}
                          className={`token-pill pill-${color} ${
                            canClick ? "clickable" : ""
                          }`}
                          onClick={
                            canClick
                              ? () => handleHumanTokenClick(tIndex)
                              : undefined
                          }
                        >
                          T{tIndex + 1}: {posLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="ludo-actions">
        <button className="ludo-btn" onClick={handleNewGame}>
          🔄 New Game
        </button>
        <button className="ludo-btn" onClick={handleQuit}>
          ⬅️ Quit & Exit
        </button>
      </div>
    </div>
  );
};

export default LudoGame;
