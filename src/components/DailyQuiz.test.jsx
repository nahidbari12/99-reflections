// @vitest-environment jsdom
import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import DailyQuiz from "./DailyQuiz";

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("DailyQuiz answer state", () => {
  it("clears answer highlighting and focus when advancing questions", () => {
    render(
      <MemoryRouter>
        <DailyQuiz />
      </MemoryRouter>
    );

    expect(screen.getByText("Question 1 of 5")).toBeTruthy();
    const firstQuestionOptions = screen
      .getAllByRole("button")
      .filter((button) => button.classList.contains("daily-quiz-option"));
    const selectedButton = firstQuestionOptions[0];

    selectedButton.focus();
    fireEvent.click(selectedButton);

    expect(document.activeElement).not.toBe(selectedButton);
    expect(
      firstQuestionOptions.some(
        (button) =>
          button.classList.contains("correct") ||
          button.classList.contains("wrong")
      )
    ).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(screen.getByText("Question 2 of 5")).toBeTruthy();
    const secondQuestionOptions = screen
      .getAllByRole("button")
      .filter((button) => button.classList.contains("daily-quiz-option"));

    expect(document.activeElement).not.toBe(selectedButton);
    expect(secondQuestionOptions).not.toContain(selectedButton);
    expect(secondQuestionOptions.every((button) => !button.disabled)).toBe(true);
    expect(
      secondQuestionOptions.every(
        (button) =>
          !button.classList.contains("correct") &&
          !button.classList.contains("wrong")
      )
    ).toBe(true);
    expect(screen.queryByText(/Correct!|Not this time/)).toBeNull();
  });
});
