import { Chess } from "chess.js";

const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
const CENTER = new Set(["d4", "e4", "d5", "e5"]);
const NEAR_CENTER = new Set(["c3", "d3", "e3", "f3", "c4", "f4", "c5", "f5", "c6", "d6", "e6", "f6"]);

function evaluate(game) {
  if (game.isCheckmate()) return game.turn() === "w" ? 100000 : -100000;
  if (game.isDraw()) return 0;

  let score = 0;
  for (const row of game.board()) {
    for (const piece of row) {
      if (!piece) continue;
      let value = PIECE_VALUES[piece.type] || 0;
      if (piece.type !== "k") {
        if (CENTER.has(piece.square)) value += 24;
        else if (NEAR_CENTER.has(piece.square)) value += 10;
      }
      score += piece.color === "b" ? value : -value;
    }
  }
  return score;
}

function search(game, depth, alpha, beta) {
  if (depth === 0 || game.isGameOver()) return evaluate(game);
  const maximizing = game.turn() === "b";
  let best = maximizing ? -Infinity : Infinity;

  for (const move of game.moves()) {
    game.move(move);
    const value = search(game, depth - 1, alpha, beta);
    game.undo();
    if (maximizing) {
      best = Math.max(best, value);
      alpha = Math.max(alpha, best);
    } else {
      best = Math.min(best, value);
      beta = Math.min(beta, best);
    }
    if (beta <= alpha) break;
  }
  return best;
}

function pick(items, random) {
  return items[Math.min(items.length - 1, Math.floor(random() * items.length))];
}

/** Returns a legal verbose move for Black. Hard searches White's best reply. */
export function chooseChessCpuMove(fen, difficulty = "medium", random = Math.random) {
  const game = new Chess(fen);
  const moves = game.moves({ verbose: true });
  if (!moves.length) return null;

  if (difficulty === "easy") return pick(moves, random);

  const depth = difficulty === "hard" ? 2 : 1;
  let bestScore = -Infinity;
  let candidates = [];
  for (const move of moves) {
    game.move(move.san);
    const score = search(game, depth - 1, -Infinity, Infinity);
    game.undo();
    if (score > bestScore) {
      bestScore = score;
      candidates = [move];
    } else if (score === bestScore) {
      candidates.push(move);
    }
  }
  return pick(candidates, random);
}

export function isSupportedChessDifficulty(value) {
  return value === "easy" || value === "medium" || value === "hard";
}
