// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CrosswordGame from "./CrosswordGame";
import { loadProfile } from "../utils/learningProfile";

beforeEach(() => window.localStorage.clear());
afterEach(cleanup);

describe("Divine Crossword", () => {
  it("renders a fresh connected puzzle with 9 or 10 clues", () => {
    render(<MemoryRouter><CrosswordGame /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "Divine Crossword" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Start new puzzle" }));
    expect(screen.getByText(/0\/(9|10)/)).toBeTruthy();
    expect(screen.getAllByRole("textbox").length).toBeGreaterThan(20);
  });

  it("adds a hinted Name to the Learn Mode profile", () => {
    render(<MemoryRouter><CrosswordGame /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Start new puzzle" }));
    fireEvent.click(screen.getByRole("button", { name: /Arabic hint/ }));
    const profile = loadProfile();
    expect(Object.values(profile.names).some((entry) => entry.source === "game:crossword" && entry.lastResult === "incorrect")).toBe(true);
  });
});
