// @vitest-environment jsdom
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, beforeEach } from "vitest";
import { loadBookmarks, loadLastRead, normalizeArabic, saveLastRead, searchVerses, toggleBookmark } from "./quranReader";

describe("static Quran data", () => {
  it("contains exactly 114 chapters and 6,236 paired verses", () => {
    const root = join(process.cwd(), "public/quran");
    const chapters = JSON.parse(readFileSync(join(root, "chapters.json"), "utf8"));
    expect(chapters).toHaveLength(114);
    expect(readdirSync(join(root, "chapters")).filter((name) => name.endsWith(".json"))).toHaveLength(114);
    let count = 0;
    chapters.forEach(({ number, verseCount }) => {
      const chapter = JSON.parse(readFileSync(join(root, `chapters/${number}.json`), "utf8"));
      expect(chapter.verses).toHaveLength(verseCount);
      chapter.verses.forEach((verse) => { expect(verse.arabic.length).toBeGreaterThan(0); expect(verse.english.length).toBeGreaterThan(0); });
      count += chapter.verses.length;
    });
    expect(count).toBe(6236);
  });

  it("preserves known opening and closing verses", () => {
    const root = join(process.cwd(), "public/quran/chapters");
    const first = JSON.parse(readFileSync(join(root, "1.json"), "utf8"));
    const last = JSON.parse(readFileSync(join(root, "114.json"), "utf8"));
    expect(first.verses[0].arabic).toContain("بِسْمِ");
    expect(first.verses[0].english).toContain("In the name of Allah");
    expect(last.verses.at(-1).english).toContain("jinn and of mankind");
  });
});

describe("Quran reader state", () => {
  beforeEach(() => localStorage.clear());
  it("saves progress and toggles bookmarks", () => {
    saveLastRead(36, 12);
    expect(loadLastRead()).toMatchObject({ surah: 36, ayah: 12 });
    expect(toggleBookmark([], 36, 12)).toEqual(["36:12"]);
    expect(loadBookmarks()).toEqual(["36:12"]);
    expect(toggleBookmark(["36:12"], 36, 12)).toEqual([]);
  });
  it("searches English and normalized Arabic", () => {
    const data = [{ s: 1, a: 1, ar: "ٱلرَّحْمَـٰنِ", en: "The Beneficent" }];
    expect(searchVerses(data, "beneficent")).toHaveLength(1);
    expect(searchVerses(data, normalizeArabic("الرحمن"))).toHaveLength(1);
  });
});
