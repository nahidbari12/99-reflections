import { describe, expect, it } from "vitest";
import { birdDailyKey, birdFeatherRating, birdRewardScore, birdRouteProfile, getBirdChapter, recommendedBirdQuality, seededBirdRandom } from "./birdsGame";

describe("Birds of Paradise progression", () => {
  it("uses deterministic daily routes", () => {
    const first = seededBirdRandom("2026-09-16");
    const second = seededBirdRandom("2026-09-16");
    expect([first(), first(), first()]).toEqual([second(), second(), second()]);
    expect(birdDailyKey(new Date(2026, 8, 16))).toBe("2026-09-16");
  });

  it("awards feathers and difficulty-scaled rewards", () => {
    expect(birdFeatherRating({ cleared: true, stars: 3, totalStars: 3, collisions: 0 })).toBe(3);
    expect(birdRewardScore({ passages: 3, stars: 3, cleared: true, difficulty: "soaring" }))
      .toBeGreaterThan(birdRewardScore({ passages: 3, stars: 3, cleared: true, difficulty: "gentle" }));
  });

  it("selects chapters and adaptive quality", () => {
    expect(getBirdChapter(10).name).toBe("Starry Night");
    expect(recommendedBirdQuality({ deviceMemory: 2, cores: 2 })).toBe("low");
    expect(recommendedBirdQuality({ deviceMemory: 8, cores: 8 })).toBe("high");
  });

  it("starts with a longer route and a playable but meaningful opening", () => {
    const opening = birdRouteProfile(1, "gentle");
    expect(opening.passageCount).toBeGreaterThanOrEqual(5);
    expect(opening.gapHeight).toBeLessThanOrEqual(66);
    expect(birdRouteProfile(5, "steady").passageCount).toBeGreaterThan(opening.passageCount);
  });
});
