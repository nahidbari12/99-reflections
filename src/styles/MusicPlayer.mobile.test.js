// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("mobile music-player layout", () => {
  it("docks above navigation and reserves document space", () => {
    const musicCss = readFileSync(new URL("./GlobalMusicPlayer.css", import.meta.url), "utf8");
    const navCss = readFileSync(new URL("./MobileNavigation.css", import.meta.url), "utf8");
    expect(musicCss).toContain("body.has-mobile-app-nav .music-player");
    expect(musicCss).toContain("82px + env(safe-area-inset-bottom)");
    expect(musicCss).toContain("body.immersive-route .music-player");
    expect(navCss).toContain("height:148px");
  });
});
