// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import names from "../data/names";
import { PROFILE_KEY, buildReviewQueue, getAchievements, getWeeklySummary, getXpSummary, localDateKey, nameId } from "./learningProfile";

beforeEach(() => localStorage.clear());

describe("unified journey progress", () => {
  it("calculates XP and unlocks achievements from existing learning data", () => {
    const profile = {
      names: { [nameId(names[0])]: { attempts: 1, correct: 1, level: 1, streak: 1 } },
      reflections: {}, activityDays: { [localDateKey()]: { sessions: 1, seconds: 60 } }, totalSeconds: 60,
    };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    expect(getXpSummary(profile).xp).toBe(32);
    expect(getAchievements(profile).find((item) => item.id === "first-step").unlocked).toBe(true);
  });

  it("prioritizes overdue and frequently missed Names for Smart Review", () => {
    const overdue = names[4];
    const profile = { names: { [nameId(overdue)]: { attempts: 4, correct: 1, wrongCount: 3, level: 1, dueAt: Date.now() - 1000 } }, reflections: {}, activityDays: {} };
    expect(buildReviewQueue(profile, 1)[0].card.name).toBe(overdue.name);
    expect(buildReviewQueue(profile, 1)[0].reason).toBe("Ready to review");
  });

  it("builds a seven-day weekly summary", () => {
    vi.setSystemTime(new Date("2026-09-14T12:00:00"));
    const profile = { activityDays: { "2026-09-14": { sessions: 2, seconds: 300 }, "2026-09-12": { sessions: 1, seconds: 120 } } };
    const summary = getWeeklySummary(profile, new Date());
    expect(summary.days).toHaveLength(7);
    expect(summary.minutes).toBe(7);
    expect(summary.sessions).toBe(3);
    expect(summary.activeDays).toBe(2);
    vi.useRealTimers();
  });
});
