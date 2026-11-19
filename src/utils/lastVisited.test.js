// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { describeRoute, loadLastVisitedPage, rememberVisitedPage } from "./lastVisited";

describe("continue where you left off", () => {
  beforeEach(() => localStorage.clear());
  it("remembers the latest non-Home route including Quran ayahs", () => {
    rememberVisitedPage({ pathname: "/quran/36", hash: "#ayah-12" });
    expect(loadLastVisitedPage()).toMatchObject({ path: "/quran/36#ayah-12", label: "Qur’an · Surah 36" });
    rememberVisitedPage({ pathname: "/" });
    expect(loadLastVisitedPage().path).toBe("/quran/36#ayah-12");
  });
  it("uses friendly labels for games and a safe first-visit fallback", () => {
    expect(loadLastVisitedPage()).toMatchObject({ path: "/learning-mode", label: "Learning Journey" });
    expect(describeRoute("/gamer-mode/birds-of-paradise").label).toBe("Birds of Paradise");
    expect(describeRoute("/gamer-mode").label).toBe("Gamer Mode");
  });
});
