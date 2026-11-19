import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { chooseChessCpuMove, isSupportedChessDifficulty } from "./chessEngine";

describe("chess CPU", () => {
  it("always returns a legal move for each supported difficulty", () => {
    const game = new Chess();
    game.move("e4");
    for (const level of ["easy", "medium", "hard"]) {
      const move = chooseChessCpuMove(game.fen(), level, () => 0);
      expect(move).toBeTruthy();
      expect(game.moves()).toContain(move.san);
    }
  });

  it("medium takes an immediately available queen", () => {
    const fen = "4k3/8/8/8/3qQ3/8/8/4K3 b - - 0 1";
    expect(chooseChessCpuMove(fen, "medium", () => 0).san).toMatch(/Qxe4/);
  });

  it("hard evaluates the player's best reply instead of only the current board", () => {
    const fen = "k7/8/8/8/3qR3/5P2/8/4K3 b - - 0 1";
    const medium = chooseChessCpuMove(fen, "medium", () => 0);
    const hard = chooseChessCpuMove(fen, "hard", () => 0);
    expect(medium.san).toMatch(/Qxe4/);
    expect(hard.san).not.toBe(medium.san);
  });

  it("rejects stale or unknown saved difficulty values", () => {
    expect(isSupportedChessDifficulty("easy")).toBe(true);
    expect(isSupportedChessDifficulty("master")).toBe(false);
    expect(isSupportedChessDifficulty(null)).toBe(false);
  });
});
