// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { completeJourneyDay, getActiveJourney, getDailyPath, getNameOfDay, loadEngagement, markDailyStep, startJourney } from "./dailyEngagement";

beforeEach(() => { localStorage.clear(); vi.setSystemTime(new Date("2026-09-15T12:00:00")); });

describe("daily engagement", () => {
  it("uses one stable Name for the entire local day", () => {
    const first = getNameOfDay(new Date("2026-09-15T01:00:00"));
    const later = getNameOfDay(new Date("2026-09-15T22:00:00"));
    expect(first.card.name).toBe(later.card.name);
    expect(first.index).toBeGreaterThanOrEqual(0);
    expect(first.index).toBeLessThan(99);
  });

  it("awards a daily-step bonus only once", () => {
    markDailyStep("name", 25); markDailyStep("name", 25);
    expect(getDailyPath().count).toBe(1);
    expect(loadEngagement().bonusXp).toBe(25);
  });

  it("persists and advances a seven-day themed journey once per day", () => {
    startJourney("mercy-compassion");
    expect(getActiveJourney().progress.day).toBe(1);
    completeJourneyDay(); completeJourneyDay();
    expect(getActiveJourney().progress.day).toBe(2);
    expect(getActiveJourney().progress.completedDates).toHaveLength(1);
  });
});
