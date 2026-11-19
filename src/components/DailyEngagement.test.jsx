// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import DailyPathCard from "./DailyPathCard";
import NameOfTheDay from "./NameOfTheDay";
import ThemedJourneys from "./ThemedJourneys";

beforeEach(() => { localStorage.clear(); vi.setSystemTime(new Date("2026-09-15T12:00:00")); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("daily engagement experiences", () => {
  it("shows all four daily path steps", () => {
    render(<MemoryRouter><DailyPathCard /></MemoryRouter>);
    expect(screen.getByText("Name of the Day")).toBeTruthy();
    expect(screen.getByText("Guided lesson")).toBeTruthy();
    expect(screen.getByText("Smart Review")).toBeTruthy();
    expect(screen.getByText("Daily Quiz")).toBeTruthy();
  });

  it("completes the daily reflection and prevents repeat XP", () => {
    render(<MemoryRouter><NameOfTheDay /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: /I reflected today/i }));
    expect(screen.getByRole("button", { name: /25 XP earned/i })).toBeTruthy();
  });

  it("offers all eight themed journeys", () => {
    render(<MemoryRouter><ThemedJourneys /></MemoryRouter>);
    expect(screen.getAllByRole("button", { name: /Begin journey/i })).toHaveLength(8);
  });
});
