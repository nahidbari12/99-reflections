// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import JourneyDashboard from "./JourneyDashboard";
import SmartReview from "./SmartReview";

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("Journey dashboard", () => {
  it("shows unified progress, Smart Review, mastery, weekly summary, and achievements", () => {
    render(<MemoryRouter><JourneyDashboard /></MemoryRouter>);
    expect(screen.getByText("MY DASHBOARD")).toBeTruthy();
    expect(screen.getByText("SMART REVIEW")).toBeTruthy();
    expect(screen.getByText("DAILY QUR’AN CHALLENGE")).toBeTruthy();
    expect(screen.getByText("99 NAMES MASTERY MAP")).toBeTruthy();
    expect(screen.getByText("ACHIEVEMENTS")).toBeTruthy();
    expect(screen.getByLabelText(/learning minutes this week/i)).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /: new$/i })).toHaveLength(99);
  });

  it("starts a personalized eight-question review", () => {
    render(<MemoryRouter><SmartReview /></MemoryRouter>);
    expect(screen.getByText("1/8")).toBeTruthy();
    expect(screen.getAllByRole("button").filter((button) => button.closest(".review-answers"))).toHaveLength(4);
  });
});
