// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  calculateLetterMastery, getGoldenRecord, goldenSummary, masteryStatus,
  nextGoldenLetterId, patchGoldenRecord, readGoldenProgress, saveGoldenAttempt,
} from "./goldenLettersProgress";

describe("Golden Letters progress", () => {
  beforeEach(() => window.localStorage.clear());

  it("migrates older records without removing their completion", () => {
    const record = getGoldenRecord({ id_1: { traced: true, freeWritten: true, completed: true } }, 1);
    expect(record.traced).toBe(true);
    expect(record.completed).toBe(true);
    expect(record.attempts).toEqual([]);
  });

  it("calculates mastery from writing and recognition", () => {
    const mastery = calculateLetterMastery({ bestTraceScore: 90, bestFadedScore: 80, bestWriteScore: 70, quizPassed: true, listened: true });
    expect(mastery).toBe(84);
  });

  it("persists successful attempts and completes a full lesson", () => {
    patchGoldenRecord(2, { listened: true, watched: true });
    saveGoldenAttempt(2, "trace", 88);
    saveGoldenAttempt(2, "faded", 76);
    saveGoldenAttempt(2, "write", 72);
    const record = saveGoldenAttempt(2, "recognition", 100);
    expect(record.completed).toBe(true);
    expect(record.attempts).toHaveLength(4);
    expect(readGoldenProgress().id_2.completed).toBe(true);
  });

  it("recommends the first incomplete letter", () => {
    expect(nextGoldenLetterId({ id_1: { completed: true }, id_2: { completed: false } }, 3)).toBe(2);
  });

  it("summarizes mastered and learning letters", () => {
    const progress = { id_1: { completed: true, listened: true, bestTraceScore: 90, bestFadedScore: 90, bestWriteScore: 90, traced: true, fadedTraced: true, freeWritten: true, quizPassed: true }, id_2: { started: true, mastery: 20 } };
    const summary = goldenSummary(progress, 3);
    expect(summary.mastered).toBe(1);
    expect(summary.learning).toBe(1);
    expect(masteryStatus(getGoldenRecord(progress, 3))).toBe("new");
  });
});
