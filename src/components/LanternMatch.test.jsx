// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import namesOfAllah from "../data/names";
import LanternMatch from "./LanternMatch";

beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("Lantern Match game flow", () => {
  it("completes an Easy board and saves game and learning progress", async () => {
    render(<MemoryRouter><LanternMatch /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: /Light the first lantern/i }));
    expect(screen.getAllByRole("gridcell")).toHaveLength(6);

    const cards = screen.getAllByRole("gridcell");
    const faces = cards.map((card) => card.querySelector(".lantern-card-face > span")?.textContent);
    const pairs = namesOfAllah.map((entry) => [faces.indexOf(entry.name), faces.indexOf(entry.meaning)]).filter(([a, b]) => a >= 0 && b >= 0);
    expect(pairs).toHaveLength(3);

    for (const [index, [first, second]] of pairs.entries()) {
      fireEvent.click(cards[first]);
      fireEvent.click(cards[second]);
      if (index < pairs.length - 1) {
        await waitFor(() => expect(cards[first].disabled).toBe(true), { timeout: 1200 });
      }
    }

    await screen.findByRole("heading", { name: /You lit every lantern/i });
    const gameStats = JSON.parse(localStorage.getItem("reflections_game_stats_v1"));
    const profile = JSON.parse(localStorage.getItem("reflections_learning_profile_v1"));
    expect(gameStats["lantern-match"].plays).toBe(1);
    expect(Object.values(profile.names).reduce((sum, entry) => sum + entry.attempts, 0)).toBe(3);
  });

  it("provides a working hint with a score cost", async () => {
    render(<MemoryRouter><LanternMatch /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: /Light the first lantern/i }));
    fireEvent.click(screen.getByRole("button", { name: /Hint/i }));
    expect(document.querySelectorAll(".lantern-card.hinted")).toHaveLength(2);
    expect(screen.getByText(/Hint shown/i)).toBeTruthy();
  });
});
