// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GAME_STATS_KEY, loadGameStats, saveGameResult } from "./gameUtils";

vi.mock("./analytics", () => ({ trackEvent: vi.fn() }));

describe("chess result persistence", () => {
  beforeEach(() => localStorage.clear());

  it("records Chess plays, wins, scores, and preserves the best score", () => {
    saveGameResult("chess", { outcome: "win", score: 40 });
    saveGameResult("chess", { outcome: "loss", score: 20 });
    expect(loadGameStats().chess).toMatchObject({
      plays: 2,
      wins: 1,
      bestScore: 40,
      lastScore: 20,
      lastOutcome: "loss",
    });
    expect(JSON.parse(localStorage.getItem(GAME_STATS_KEY)).chess.plays).toBe(2);
  });
});
