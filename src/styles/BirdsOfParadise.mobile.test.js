import { describe, expect, it } from "vitest";
import fs from "node:fs";

describe("Birds of Paradise mobile sprite layout", () => {
  it("keeps one four-frame heavenly gate visible on narrow screens", () => {
    const css = fs.readFileSync(new URL("./BirdsOfParadise.css", import.meta.url), "utf8");
    const mobileRules = css.slice(css.indexOf("@media (max-width: 480px)"));
    expect(mobileRules).toMatch(/\.birds-gate-goal-inner\s*\{[^}]*background-size:\s*400% 100%/s);
    expect(mobileRules).not.toMatch(/\.birds-gate-goal-inner\s*\{[^}]*background-size:\s*150%/s);
  });

  it("separates and visually matches the flight difficulty label", () => {
    const css = fs.readFileSync(new URL("./BirdsOfParadise.css", import.meta.url), "utf8");
    expect(css).toMatch(/\.birds-inline-difficulty\s*\{[^}]*gap:\s*10px[^}]*font-size:\s*0\.72rem/s);
    expect(css).toMatch(/\.birds-inline-difficulty select\s*\{[^}]*font-size:\s*inherit/s);
  });
});
