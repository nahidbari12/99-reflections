export const BIRD_DIFFICULTIES = {
  gentle: { label: "Gentle", gapBonus: 10, speed: 0.82, gravity: 0.17, flap: -2.85, reward: 1 },
  steady: { label: "Steady", gapBonus: 2, speed: 1, gravity: 0.2, flap: -3, reward: 1.25 },
  soaring: { label: "Soaring", gapBonus: -5, speed: 1.16, gravity: 0.23, flap: -3.12, reward: 1.6 },
};

export const BIRD_CHAPTERS = [
  { from: 1, name: "Dawn", className: "dawn", mechanic: "Wide, welcoming passages" },
  { from: 4, name: "Daylight", className: "daylight", mechanic: "Longer cloud routes" },
  { from: 7, name: "Golden Sunset", className: "sunset", mechanic: "Rising flight speed" },
  { from: 10, name: "Starry Night", className: "starlight", mechanic: "Precision passages" },
  { from: 14, name: "Aurora", className: "aurora", mechanic: "Shifting atmospheric light" },
  { from: 21, name: "Gardens", className: "gardens", mechanic: "Mastery flights" },
];

export const BIRD_COSMETICS = [
  { id: "starlight", label: "Starlight trail", unlockLevel: 1 },
  { id: "golden", label: "Golden trail", unlockLevel: 4 },
  { id: "aurora", label: "Aurora trail", unlockLevel: 10 },
];

export function getBirdChapter(level = 1) {
  return [...BIRD_CHAPTERS].reverse().find((chapter) => level >= chapter.from) || BIRD_CHAPTERS[0];
}

export function birdDailyKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function seededBirdRandom(seedText) {
  let seed = [...String(seedText)].reduce((value, character) => (value * 31 + character.charCodeAt(0)) >>> 0, 2166136261);
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

export function evaluateBirdMissions({ cleared = false, stars = 0, totalStars = 0, collisions = 0 } = {}) {
  return [
    { id: "finish", label: "Reach the Heavenly Gate", complete: cleared },
    { id: "stars", label: "Collect every star", complete: cleared && totalStars > 0 && stars >= totalStars },
    { id: "clean", label: "Complete a clean flight", complete: cleared && collisions === 0 },
  ];
}

export function birdFeatherRating(result) {
  return evaluateBirdMissions(result).filter((mission) => mission.complete).length;
}

export function birdRewardScore({ passages = 0, stars = 0, cleared = false, difficulty = "gentle" } = {}) {
  const multiplier = (BIRD_DIFFICULTIES[difficulty] || BIRD_DIFFICULTIES.gentle).reward;
  return Math.round((passages * 5 + stars * 10 + (cleared ? 25 : 0)) * multiplier);
}

export function recommendedBirdQuality({ reducedMotion = false, deviceMemory, cores } = {}) {
  if (reducedMotion || (deviceMemory && deviceMemory <= 2) || (cores && cores <= 2)) return "low";
  if ((deviceMemory && deviceMemory <= 4) || (cores && cores <= 4)) return "medium";
  return "high";
}

export function birdRouteProfile(level = 1, difficulty = "gentle") {
  const config = BIRD_DIFFICULTIES[difficulty] || BIRD_DIFFICULTIES.gentle;
  return {
    passageCount: Math.min(5 + Math.floor((Math.max(1, level) - 1) / 2), 11),
    spacing: Math.max(35, 46 - Math.floor((Math.max(1, level) - 1) / 4) * 2),
    gapHeight: Math.min(66, Math.max(34, 64 - (Math.max(1, level) - 1) * 1.6 + config.gapBonus)),
  };
}
