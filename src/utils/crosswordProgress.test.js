// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { clearCrosswordSession, crosswordShareText, loadCrosswordSession, saveCrosswordSession } from "./crosswordProgress";
import { generateCrossword, seededRandom } from "./crosswordGenerator";

beforeEach(() => localStorage.clear());

describe("crossword persistence and daily puzzles", () => {
  it("creates the same daily puzzle from the same date seed", () => {
    const one = generateCrossword({ count: 9, random: seededRandom("2026-09-14-medium") });
    const two = generateCrossword({ count: 9, random: seededRandom("2026-09-14-medium") });
    expect(one.entries.map((entry) => entry.name)).toEqual(two.entries.map((entry) => entry.name));
  });
  it("saves and clears an unfinished session", () => {
    saveCrosswordSession({ elapsed: 42, values: { "1-1": "A" } });
    expect(loadCrosswordSession().elapsed).toBe(42);
    clearCrosswordSession(); expect(loadCrosswordSession()).toBeNull();
  });
  it("creates a privacy-safe share result", () => {
    expect(crosswordShareText({ solved: 8, total: 9, elapsed: 75 })).toContain("8/9 independently");
  });
});
