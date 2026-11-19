import { describe, expect, it } from "vitest";
import namesOfAllah from "../data/names";
import { buildMeaningQuestion, buildMeaningQuestions, uniqueBy } from "./gameUtils";
import { cpuChoice, winnerOf } from "../components/TicTacToeGame";
import { normalize, shuffleLetters } from "../components/ScrambleGame";
import { buildLanternDeck, calculateLanternScore, seededRandom } from "../components/LanternMatch";

describe("game question generation", () => {
  it("never creates duplicate visible meanings", () => {
    for (const card of namesOfAllah) {
      const question = buildMeaningQuestion(card, 4);
      expect(new Set(question.options).size).toBe(question.options.length);
      expect(question.options).toContain(card.meaning);
    }
  });

  it("creates a question set without repeating Names", () => {
    const questions = buildMeaningQuestions(12, 4);
    expect(new Set(questions.map((question) => question.prompt)).size).toBe(12);
  });

  it("deduplicates repeated values", () => {
    expect(uniqueBy([{ value: "a" }, { value: "a" }, { value: "b" }], (item) => item.value)).toHaveLength(2);
  });
});

describe("tic-tac-toe rules", () => {
  it("takes an immediate winning move before blocking", () => {
    expect(cpuChoice(["O", "O", null, "X", "X", null, null, null, null])).toBe(2);
  });

  it("blocks an immediate player win", () => {
    expect(cpuChoice(["X", "X", null, null, "O", null, null, null, null])).toBe(2);
  });

  it("detects wins and draws", () => {
    expect(winnerOf(["X", "X", "X", null, "O", null, "O", null, null])).toBe("X");
    expect(winnerOf(["X", "O", "X", "X", "O", "O", "O", "X", "X"])).toBe("draw");
  });
});

describe("scramble rules", () => {
  it("ignores punctuation and case in answers", () => {
    expect(normalize("Ar-Rahman")).toBe("arrahman");
    expect(normalize("AR RAHMAN")).toBe("arrahman");
  });

  it("preserves every letter when scrambling", () => {
    expect(shuffleLetters("Al-Malik").sort()).toEqual("ALMALIK".split("").sort());
  });
});

describe("lantern match rules", () => {
  it("creates complete unique pairs for every level", () => {
    ["easy", "medium", "hard", "master"].forEach((level) => {
      const deck = buildLanternDeck(level, seededRandom(`test-${level}`));
      const pairCounts = deck.reduce((counts, card) => ({ ...counts, [card.pairId]: (counts[card.pairId] || 0) + 1 }), {});
      expect(Object.values(pairCounts).every((count) => count === 2)).toBe(true);
      expect(new Set(deck.map((card) => card.id)).size).toBe(deck.length);
    });
  });

  it("makes the Daily Board deterministic", () => {
    const first = buildLanternDeck("medium", seededRandom("2026-09-13-medium"));
    const second = buildLanternDeck("medium", seededRandom("2026-09-13-medium"));
    expect(second.map((card) => card.id)).toEqual(first.map((card) => card.id));
  });

  it("rewards efficient play and never returns less than 100", () => {
    expect(calculateLanternScore(6, 6, 0, 20)).toBeGreaterThan(calculateLanternScore(6, 10, 1, 60));
    expect(calculateLanternScore(3, 100, 20, 900)).toBe(100);
  });
});
