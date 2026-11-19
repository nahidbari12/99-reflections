// @vitest-environment jsdom
import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Chess } from "chess.js";
import namesOfAllah from "../data/names";
import ChessBoardWrapper from "./ChessBoardWrapper";

let boardProps;
vi.mock("react-chessboard", () => ({
  Chessboard: (props) => {
    boardProps = props;
    return <button type="button" aria-label="test chessboard" onClick={() => {
      const game = props.position === "start" ? new Chess() : new Chess(props.position);
      const move = game.moves({ verbose: true })[0];
      if (move) props.onPieceDrop(move.from, move.to);
    }}>Board</button>;
  },
}));

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  localStorage.setItem("cpuDifficulty", "easy");
});
afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
});

async function advance(ms) {
  await act(async () => { vi.advanceTimersByTime(ms); });
}

async function completeCorrectTurn() {
  expect(boardProps.arePiecesDraggable).toBe(true);
  const positionBeforeTurn = boardProps.position;
  fireEvent.click(screen.getByRole("button", { name: "test chessboard" }));
  await advance(350);
  const prompt = screen.getByRole("heading").textContent;
  const visibleAnswers = screen.getAllByRole("button").map((button) => button.textContent);
  const card = namesOfAllah.find((item) => item.name === prompt && visibleAnswers.includes(item.meaning));
  fireEvent.click(screen.getByRole("button", { name: card.meaning }));
  await advance(900);
  expect(screen.getByText("CPU thinking…")).toBeTruthy();
  await advance(450);
  expect(boardProps.arePiecesDraggable).toBe(true);
  return positionBeforeTurn === "start" ? new Chess().fen() : positionBeforeTurn;
}

describe("Chess game flow", () => {
  it("completes guarded turns, unlocks rewards, and safely restores an entire turn", async () => {
    render(<MemoryRouter><ChessBoardWrapper /></MemoryRouter>);
    for (let turn = 0; turn < 3; turn += 1) await completeCorrectTurn();
    expect(screen.getByText("Active for this game")).toBeTruthy();

    let positionBeforeLastTurn;
    for (let turn = 3; turn < 6; turn += 1) positionBeforeLastTurn = await completeCorrectTurn();
    const undo = screen.getByRole("button", { name: /Undo Move/ });
    expect(undo.disabled).toBe(false);
    fireEvent.click(undo);
    expect(boardProps.position).toBe(positionBeforeLastTurn);
    expect(screen.getByRole("button", { name: /Undo Move/ }).disabled).toBe(true);

    for (let turn = 6; turn < 9; turn += 1) await completeCorrectTurn();
    const hint = screen.getByRole("button", { name: /Tactical Hint/ });
    expect(hint.disabled).toBe(false);
    fireEvent.click(hint);
    expect(screen.getByRole("button", { name: /Tactical Hint/ }).disabled).toBe(true);
    expect(screen.getByRole("status").textContent).toMatch(/^Hint:/);
  });

  it("cancels delayed question and CPU work when leaving the page", async () => {
    const view = render(<MemoryRouter><ChessBoardWrapper /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "test chessboard" }));
    view.unmount();
    await advance(2000);
    expect(vi.getTimerCount()).toBe(0);
  });
});
