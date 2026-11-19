// @vitest-environment jsdom
import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Flashcard from "./Flashcard";

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  window.speechSynthesis = { cancel: vi.fn(), speak: vi.fn(), getVoices: vi.fn(() => []) };
});

afterEach(() => {
  cleanup();
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function renderFlashcards() {
  return render(<MemoryRouter><Flashcard /></MemoryRouter>);
}

describe("Flashcard study experience", () => {
  it("keeps deeper tools collapsed until requested", () => {
    renderFlashcards();
    fireEvent.click(screen.getByRole("button", { name: "Reveal" }));

    expect(screen.getByText("How well did you remember it?")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Learn deeper" })).toBeTruthy();
    expect(screen.queryByLabelText("My private reflection")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Learn deeper" }));
    expect(screen.getByLabelText("My private reflection")).toBeTruthy();
  });

  it("clears focus and resets the card when moving forward", () => {
    renderFlashcards();
    fireEvent.click(screen.getByRole("button", { name: "Reveal" }));
    const next = screen.getByRole("button", { name: "Next →" });
    next.focus();
    fireEvent.click(next);

    expect(document.activeElement).not.toBe(next);
    expect(screen.getByRole("button", { name: "Reveal" })).toBeTruthy();
    expect(screen.queryByText("How well did you remember it?")).toBeNull();
  });

  it("provides visible feedback for an unsuccessful search", () => {
    renderFlashcards();
    fireEvent.change(screen.getByLabelText("Search Names or meanings"), { target: { value: "not-a-real-name" } });
    fireEvent.click(screen.getByRole("button", { name: "🔍 Search" }));
    expect(screen.getByRole("status").textContent).toContain("No Name found");
  });

  it("starts a ten-card study session and records a rated card", () => {
    renderFlashcards();
    fireEvent.click(screen.getByRole("button", { name: "Study 10" }));
    expect(document.querySelector(".progress-text").textContent).toContain("Study 10 · 1 / 10");

    fireEvent.click(screen.getByRole("button", { name: "Reveal" }));
    const rating = screen.getByRole("button", { name: "Got it" });
    rating.focus();
    fireEvent.click(rating);
    act(() => vi.advanceTimersByTime(200));

    expect(document.activeElement).not.toBe(rating);
    expect(document.querySelector(".progress-text").textContent).toContain("Study 10 · 2 / 10");
    expect(screen.queryByText("How well did you remember it?")).toBeNull();
  });
});
