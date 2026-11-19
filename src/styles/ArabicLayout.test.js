// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Arabic name layout", () => {
  it("reserves a responsive Arabic column and enough glyph line height", () => {
    const css = readFileSync(new URL("./LearningJourney.css", import.meta.url), "utf8");
    expect(css).toContain("grid-template-columns:minmax(220px,.7fr) minmax(0,1.5fr) auto");
    expect(css).toContain(".continue-arabic { grid-column:1");
    expect(css).toContain(".continue-copy { grid-column:2");
    expect(css).toContain(".continue-card>button { grid-column:3");
    expect(css).toContain("line-height:1.65");
    expect(css).toContain("unicode-bidi:isolate");
    expect(css).toContain("@media(max-width:900px)");
    expect(css).toContain("minmax(155px,.7fr)");
  });

  it("gives Arabic text safe vertical space in other learning views", () => {
    for (const file of ["Flashcard.css", "LearnNames.css", "NameRush.css"]) {
      const css = readFileSync(new URL(`./${file}`, import.meta.url), "utf8");
      expect(css).toMatch(/line-height:\s*1\.5/);
    }
  });
});
