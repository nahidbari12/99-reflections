// @vitest-environment jsdom
import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import names from "../data/names";
import ChallengeMode, { buildChallengeQuestion, buildDailyChallengeCards, CHALLENGE_LEVELS } from "./ChallengeMode";

describe("Challenge Mode difficulty design", () => {
  afterEach(() => vi.useRealTimers());
  it("uses three meaning choices in easy mode", () => {
    const question = buildChallengeQuestion(names[0], "easy", 0, () => 0.25);
    expect(question.type).toBe("name-to-meaning");
    expect(question.options).toHaveLength(3);
    expect(new Set(question.options).size).toBe(3);
    expect(question.options).toContain(names[0].meaning);
  });

  it("alternates both recall directions in medium mode", () => {
    expect(buildChallengeQuestion(names[0], "medium", 0).type).toBe("name-to-meaning");
    expect(buildChallengeQuestion(names[1], "medium", 1).type).toBe("meaning-to-name");
  });

  it("includes Arabic recognition in hard mode", () => {
    const question = buildChallengeQuestion(names[2], "hard", 2);
    expect(question.type).toBe("arabic-to-name");
    expect(question.prompt).toBe(names[2].arabic);
    expect(question.correct).toBe(names[2].name);
    expect(question.options).toHaveLength(4);
  });

  it("uses distinct timing and penalties across all three levels", () => {
    expect(CHALLENGE_LEVELS.easy.cardSeconds).toBeGreaterThan(CHALLENGE_LEVELS.medium.cardSeconds);
    expect(CHALLENGE_LEVELS.medium.cardSeconds).toBeGreaterThan(CHALLENGE_LEVELS.hard.cardSeconds);
    expect(CHALLENGE_LEVELS.easy.penalty).toBe(0);
    expect(CHALLENGE_LEVELS.medium.penalty).toBe(1);
    expect(CHALLENGE_LEVELS.hard.penalty).toBe(3);
  });

  it("builds the same ten-card Daily Challenge for the same date", () => {
    const first = buildDailyChallengeCards("2026-09-13").map((card) => card.name);
    const second = buildDailyChallengeCards("2026-09-13").map((card) => card.name);
    expect(first).toHaveLength(10);
    expect(second).toEqual(first);
    expect(new Set(first).size).toBe(10);
  });

  it("pauses both clocks while answer feedback is displayed", async () => {
    vi.useFakeTimers();
    render(<MemoryRouter initialEntries={[{ pathname: "/challenge", state: { difficulty: "medium" } }]}><ChallengeMode /></MemoryRouter>);
    for (let step = 0; step < 3; step += 1) {
      await act(async () => { vi.advanceTimersByTime(700); });
    }
    const gameClock = screen.getByLabelText("45 seconds remaining");
    const answer = screen.getAllByRole("button").find((button) => button.className.includes("answer-button"));
    expect(answer.disabled).toBe(false);
    fireEvent.click(answer);
    await act(async () => { vi.advanceTimersByTime(500); });
    expect(gameClock.textContent).toContain("45s");
    expect(screen.getByText(/Correct|Not quite/)).toBeTruthy();
  });
});
