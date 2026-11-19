import namesOfAllah from "../data/names";
import { localDateKey, recordNameAttempt } from "./learningProfile";
import { trackEvent } from "./analytics";

export const GAME_STATS_KEY = "reflections_game_stats_v1";

export function shuffle(items, random = Math.random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function uniqueBy(items, selector) {
  const seen = new Set();
  return items.filter((item) => {
    const key = selector(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function buildMeaningQuestion(card, optionCount = 4, random = Math.random) {
  const source = card || namesOfAllah[Math.floor(random() * namesOfAllah.length)];
  const alternatives = uniqueBy(
    namesOfAllah.filter((item) => item !== source && item.meaning !== source.meaning),
    (item) => item.meaning
  );
  const wrong = shuffle(alternatives, random).slice(0, Math.max(1, optionCount - 1));
  return {
    card: source,
    prompt: source.name,
    correct: source.meaning,
    options: shuffle([source.meaning, ...wrong.map((item) => item.meaning)], random),
  };
}

export function buildMeaningQuestions(count = 5, optionCount = 4, random = Math.random) {
  return shuffle(namesOfAllah, random)
    .slice(0, Math.min(count, namesOfAllah.length))
    .map((card) => buildMeaningQuestion(card, optionCount, random));
}

export function findCardByName(name) {
  return namesOfAllah.find((item) => item.name === name) || null;
}

export function recordGameAttempt(cardOrName, correct, source, seconds = 8) {
  if (!cardOrName) return;
  recordNameAttempt(cardOrName, correct, { source: `game:${source}`, seconds });
}

export function loadGameStats() {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(GAME_STATS_KEY) || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).flatMap(([gameId, value]) => {
      if (value && typeof value === "object" && !Array.isArray(value)) return [[gameId, value]];
      // Older builds occasionally stored only a play count. Preserve it safely.
      if (Number.isFinite(Number(value)) && Number(value) >= 0) {
        return [[gameId, { plays: Number(value), bestScore: 0, wins: 0 }]];
      }
      return [];
    }));
  } catch {
    return {};
  }
}

export function saveGameResult(gameId, result = {}) {
  if (typeof window === "undefined" || !gameId) return {};
  const all = loadGameStats();
  const previous = all[gameId] || { plays: 0, bestScore: 0, wins: 0 };
  const score = Number(result.score) || 0;
  const next = {
    ...previous,
    plays: previous.plays + 1,
    wins: previous.wins + (result.outcome === "win" ? 1 : 0),
    bestScore: Math.max(previous.bestScore || 0, score),
    lastScore: score,
    lastOutcome: result.outcome || "complete",
    lastPlayedAt: Date.now(),
    dailyKey: localDateKey(),
  };
  const updated = { ...all, [gameId]: next };
  window.localStorage.setItem(GAME_STATS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent("game-stats-updated", { detail: updated }));
  trackEvent("game_complete", { game_id: gameId, outcome: next.lastOutcome, score: next.lastScore });
  return next;
}
