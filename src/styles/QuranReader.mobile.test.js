import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Quran responsive layout", () => {
  it("provides phone, tablet, safe-area and readable Arabic styles", () => {
    const css = readFileSync(new URL("./QuranReader.css", import.meta.url), "utf8");
    expect(css).toContain("@media(max-width:900px)");
    expect(css).toContain("@media(max-width:700px)");
    expect(css).toContain('font-family:"Amiri Quran"');
    expect(css).toContain("padding-bottom:165px");
    expect(css).toContain("min-height:44px");
    expect(css).toContain(".quran-header-nav");
    expect(css).toContain(".quran-daily-challenge");
    expect(css).toContain(".quran-reader-active .music-player{display:none!important}");
    expect(css).toContain("min-height:104px");
  });
});
