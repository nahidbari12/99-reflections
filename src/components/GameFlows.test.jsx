// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import GamerMode from "./GamerMode";
import TicTacToeGame from "./TicTacToeGame";
import GameQuizGate from "./GameQuizGate";
import CheckersWrapper from "./CheckersWrapper";
import ScrambleGame from "./ScrambleGame";
import NameRush from "./NameRush";
import DivineDescentGame from "./DivineDescentGame";
import BirdsOfParadise, { BIRD_DIFFICULTIES } from "./BirdsOfParadise";
import ChessBoardWrapper from "./ChessBoardWrapper";
import ChallengeMode from "./ChallengeMode";
import LanternMatch from "./LanternMatch";
import CrosswordGame from "./CrosswordGame";

const withRouter = (node) => render(<MemoryRouter>{node}</MemoryRouter>);

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("confirm", vi.fn(() => true));
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("game route smoke tests", () => {
  it("renders the modern hub with all nine available games and no Ludo", () => {
    withRouter(<GamerMode />);
    expect(screen.getByRole("heading", { name: /Gamer Mode/i })).toBeTruthy();
    expect(screen.getAllByRole("link")).toHaveLength(10);
    expect(screen.queryByText(/Ludo/i)).toBeNull();
  });

  it("renders Gamer Mode safely with legacy or malformed saved game values", () => {
    localStorage.setItem("reflections_game_stats_v1", JSON.stringify({ scramble: null, chess: 4, broken: "invalid" }));
    withRouter(<GamerMode />);
    expect(screen.getByRole("heading", { name: /Gamer Mode/i })).toBeTruthy();
    expect(screen.getByText("4", { selector: ".gamer-summary strong" })).toBeTruthy();
  });

  it("opens a locked, unique four-option question after a tic-tac-toe move", () => {
    withRouter(<TicTacToeGame />);
    fireEvent.click(screen.getByRole("gridcell", { name: /Square 1/ }));
    expect(screen.getByText("Challenge Question")).toBeTruthy();
    const choices = screen.getAllByRole("button").filter((button) => button.className.includes("answer-button"));
    expect(choices).toHaveLength(4);
    expect(new Set(choices.map((button) => button.textContent)).size).toBe(4);
    fireEvent.click(choices[0]);
    expect(choices.every((button) => button.disabled)).toBe(true);
  });

  it("pauses and resumes tic-tac-toe without advancing the move timer", () => {
    vi.useFakeTimers();
    withRouter(<TicTacToeGame />);
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(screen.getByText("Game paused")).toBeTruthy();
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByText("10s")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Resume game" }));
    expect(screen.queryByText("Game paused")).toBeNull();
    vi.useRealTimers();
  });

  it("renders a checkers quiz with four distinct choices", () => {
    withRouter(<GameQuizGate />);
    const choices = screen.getAllByRole("button").filter((button) => button.className.includes("answer-button"));
    expect(choices).toHaveLength(4);
    expect(new Set(choices.map((button) => button.textContent)).size).toBe(4);
  });

  it("clears the checkers quiz selection and browser focus for the next question", () => {
    vi.useFakeTimers();
    withRouter(<GameQuizGate />);
    const firstChoice = screen.getAllByRole("button").find((button) => button.className.includes("answer-button"));
    firstChoice.focus();
    fireEvent.click(firstChoice);
    expect(document.activeElement).toBe(firstChoice);

    act(() => vi.advanceTimersByTime(1000));

    const nextChoices = screen.getAllByRole("button").filter((button) => button.className.includes("answer-button"));
    expect(document.activeElement).not.toBe(firstChoice);
    expect(nextChoices.every((button) => !button.className.includes("correct") && !button.className.includes("wrong"))).toBe(true);
    expect(nextChoices.every((button) => !button.disabled)).toBe(true);
    vi.useRealTimers();
  });

  it("allows selecting a different checkers piece without recursion", () => {
    withRouter(<CheckersWrapper />);
    const first = screen.getByRole("button", { name: /row 6, column 1, your piece/i });
    const second = screen.getByRole("button", { name: /row 6, column 3, your piece/i });
    fireEvent.click(first);
    fireEvent.click(second);
    expect(second.className).toContain("selected");
  });

  it("offers distinct Easy, Medium, and Hard checkers modes", () => {
    withRouter(<CheckersWrapper />);
    const difficulty = screen.getByRole("combobox", { name: /Checkers difficulty/i });
    expect(Array.from(difficulty.options).map((option) => option.textContent)).toEqual(["Easy", "Medium", "Hard"]);
    fireEvent.change(difficulty, { target: { value: "hard" } });
    expect(difficulty.value).toBe("hard");
  });

  it.each([
    ["Scramble", <ScrambleGame />, /Scramble Challenge/i],
    ["Name Rush", <NameRush />, /Name Rush/i],
    ["Divine Descent", <DivineDescentGame />, /Divine Descent/i],
    ["Birds of Paradise", <BirdsOfParadise />, /Birds of Paradise/i],
    ["Chess", <ChessBoardWrapper />, /Chess/i],
    ["Challenge Mode", <ChallengeMode />, /Easy Mode/i],
    ["Lantern Match", <LanternMatch />, /Lantern Match/i],
    ["Divine Crossword", <CrosswordGame />, /Divine Crossword/i],
  ])("renders %s without crashing", (_name, component, label) => {
    withRouter(component);
    expect(screen.getAllByText(label).length).toBeGreaterThan(0);
  });

  it("offers genuinely distinct Birds of Paradise difficulty profiles", () => {
    expect(Object.keys(BIRD_DIFFICULTIES)).toEqual(["gentle", "steady", "soaring"]);
    expect(BIRD_DIFFICULTIES.gentle.gapBonus).toBeGreaterThan(BIRD_DIFFICULTIES.steady.gapBonus);
    expect(BIRD_DIFFICULTIES.soaring.speed).toBeGreaterThan(BIRD_DIFFICULTIES.steady.speed);
    expect(BIRD_DIFFICULTIES.soaring.reward).toBeGreaterThan(BIRD_DIFFICULTIES.gentle.reward);
  });

  it("pauses Lantern Match with the board state protected", () => {
    withRouter(<LanternMatch />);
    fireEvent.click(screen.getByRole("button", { name: /Light the first lantern/i }));
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(screen.getByText("Game paused")).toBeTruthy();
    expect(screen.getAllByRole("gridcell").every((card) => card.disabled)).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: /Resume matching/i }));
    expect(screen.queryByText("Game paused")).toBeNull();
  });

  it("pauses Scramble and disables its letter input", () => {
    withRouter(<ScrambleGame />);
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(screen.getByText("Game paused")).toBeTruthy();
    expect(screen.getAllByRole("button").filter((button) => button.className.includes("scramble-letter-tile")).every((button) => button.disabled)).toBe(true);
    fireEvent.click(screen.getAllByRole("button", { name: "Resume" }).at(-1));
    expect(screen.queryByText("Game paused")).toBeNull();
  });

  it("lets Birds of Paradise players select and retain a flight difficulty", () => {
    withRouter(<BirdsOfParadise />);
    fireEvent.click(screen.getByRole("button", { name: /Soaring/i }));
    expect(localStorage.getItem("bop_difficulty")).toBe("soaring");
    expect(screen.getByRole("button", { name: /Soaring/i }).getAttribute("aria-pressed")).toBe("true");
  });
});
