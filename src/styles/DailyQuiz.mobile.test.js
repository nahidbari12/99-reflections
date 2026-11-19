// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Daily Quiz touch styling", () => {
  it("does not apply sticky hover feedback on coarse touch devices", () => {
    const css = readFileSync(new URL("./DailyQuiz.css", import.meta.url), "utf8");
    expect(css).toContain("@media (hover: hover) and (pointer: fine)");
    expect(css).toContain("@media (hover: none), (pointer: coarse)");
    expect(css.indexOf("@media (hover: hover) and (pointer: fine)")).toBeLessThan(css.indexOf(".daily-quiz-option:hover:not(:disabled)"));
  });
});
