import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import names from "./names";
import { getQuranConnection, quranConnections, quranConnectionLabel } from "./quranConnections";

describe("99 Names Quran connections", () => {
  it("provides one valid primary Quran verse for every Name", () => {
    expect(quranConnections).toHaveLength(99);
    expect(quranConnections).toHaveLength(names.length);
    const chapterCache = new Map();
    quranConnections.forEach((connection, index) => {
      if (!chapterCache.has(connection.surah)) {
        const path = join(process.cwd(), `public/quran/chapters/${connection.surah}.json`);
        chapterCache.set(connection.surah, JSON.parse(readFileSync(path, "utf8")));
      }
      const chapter = chapterCache.get(connection.surah);
      expect(chapter.verses.some((verse) => verse.number === connection.ayah), `${names[index].name} points to a real ayah`).toBe(true);
      expect(["direct", "contextual"]).toContain(connection.type);
    });
  });

  it("labels direct and contextual relationships honestly", () => {
    expect(quranConnectionLabel(getQuranConnection(0))).toBe("Direct Qur’an mention");
    expect(quranConnectionLabel(getQuranConnection(19))).toContain("context");
    expect(getQuranConnection(66)).toMatchObject({ surah: 112, ayah: 1 });
  });
});
