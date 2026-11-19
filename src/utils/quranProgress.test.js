// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  getQuranProgress,
  recordQuranVerseRead,
  setQuranDailyGoal,
} from "./quranProgress";

const atNoon = (date) => new Date(`${date}T12:00:00`);

beforeEach(() => localStorage.clear());

describe("Quran reading progress", () => {
  it("counts each ayah only once per day and across all-time progress", () => {
    const today = atNoon("2026-09-19");
    recordQuranVerseRead(1, 1, today);
    recordQuranVerseRead(1, 1, today);
    const progress = recordQuranVerseRead(1, 2, today);

    expect(progress.todayCount).toBe(2);
    expect(progress.total).toBe(2);
    expect(progress.surahsExplored).toBe(1);
    expect(progress.percent).toBe(40);
  });

  it("completes the daily goal and builds a consecutive-day streak", () => {
    const yesterday = atNoon("2026-09-18");
    const today = atNoon("2026-09-19");
    for (let ayah = 1; ayah <= 5; ayah += 1) recordQuranVerseRead(1, ayah, yesterday);
    for (let ayah = 1; ayah <= 5; ayah += 1) recordQuranVerseRead(2, ayah, today);

    const progress = getQuranProgress(today);
    expect(progress.completed).toBe(true);
    expect(progress.percent).toBe(100);
    expect(progress.streak).toBe(2);
    expect(progress.week.at(-1).complete).toBe(true);
  });

  it("allows a reader to choose a smaller or larger daily goal", () => {
    const today = atNoon("2026-09-19");
    recordQuranVerseRead(1, 1, today);
    recordQuranVerseRead(1, 2, today);
    recordQuranVerseRead(1, 3, today);

    const progress = setQuranDailyGoal(3);
    expect(progress.goal).toBe(3);
    expect(getQuranProgress(today).completed).toBe(true);
  });

  it("reports the next reading milestone", () => {
    const today = atNoon("2026-09-19");
    for (let ayah = 1; ayah <= 25; ayah += 1) recordQuranVerseRead(2, ayah, today);
    expect(getQuranProgress(today).nextMilestone).toBe(50);
  });
});
