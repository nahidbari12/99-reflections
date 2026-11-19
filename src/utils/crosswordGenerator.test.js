import { describe, expect, it } from "vitest";
import { generateCrossword, normalizeCrosswordAnswer } from "./crosswordGenerator";

function seeded(seed = 12345) {
  let value = seed;
  return () => { value = (value * 16807) % 2147483647; return (value - 1) / 2147483646; };
}

describe("crossword generator", () => {
  it("normalizes punctuation from transliterated Names", () => {
    expect(normalizeCrosswordAnswer("Ar-Rahman")).toBe("ARRAHMAN");
    expect(normalizeCrosswordAnswer("Al-Mu’min")).toBe("ALMUMIN");
  });

  it.each([11, 22, 33, 44, 55])("builds a connected puzzle with 9 or 10 Names for seed %s", (seed) => {
    const puzzle = generateCrossword({ count: 10, random: seeded(seed) });
    expect(puzzle.entries.length).toBeGreaterThanOrEqual(9);
    expect(puzzle.entries.length).toBeLessThanOrEqual(10);
    expect(puzzle.rows).toBeLessThanOrEqual(17);
    expect(puzzle.cols).toBeLessThanOrEqual(17);
    expect(puzzle.cells.some((cell) => cell.entries.length > 1)).toBe(true);
  });

  it("creates a fresh layout from different random seeds", () => {
    const one = generateCrossword({ random: seeded(1) });
    const two = generateCrossword({ random: seeded(2) });
    expect(one.entries.map((entry) => entry.name).join("|")).not.toBe(two.entries.map((entry) => entry.name).join("|"));
  });
});

