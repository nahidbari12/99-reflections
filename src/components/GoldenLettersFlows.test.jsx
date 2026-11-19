// @vitest-environment jsdom
import React from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import GoldenLettersHome from "./GoldenLettersHome";
import GoldenLetters from "./GoldenLetters";
import GoldenLettersLetter from "./GoldenLettersLetter";
import GoldenLettersProgress from "./GoldenLettersProgress";

beforeEach(() => window.localStorage.clear());

describe("Golden Letters 2.0 flows", () => {
  it("renders the dashboard and recommends the first lesson", () => {
    render(<MemoryRouter><GoldenLettersHome /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "Golden Letters" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Start lesson" })).toBeTruthy();
    expect(screen.getByText("Today’s practice")).toBeTruthy();
  });

  it("filters the mastery alphabet grid", () => {
    render(<MemoryRouter><GoldenLetters /></MemoryRouter>);
    expect(screen.getAllByText("New").length).toBe(28);
    fireEvent.click(screen.getByRole("button", { name: "Mastered" }));
    expect(screen.getByText("Nothing here right now")).toBeTruthy();
  });

  it("starts a letter with the focused learn step", () => {
    render(<MemoryRouter initialEntries={["/golden-letters/letter/2"]}><Routes><Route path="/golden-letters/letter/:id" element={<GoldenLettersLetter />} /></Routes></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "Ba" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Start writing" })).toBeTruthy();
    expect(screen.getByText(/Lesson 2 of 28/)).toBeTruthy();
  });

  it("renders the mastery progress map", () => {
    render(<MemoryRouter><GoldenLettersProgress /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "Progress" })).toBeTruthy();
    expect(screen.getByText("Mastery map")).toBeTruthy();
  });
});
