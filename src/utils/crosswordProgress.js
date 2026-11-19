import { localDateKey } from "./learningProfile";

export const CROSSWORD_SESSION_KEY = "reflections_crossword_session_v2";
export const CROSSWORD_STATS_KEY = "reflections_crossword_stats_v2";

const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || "null") || fallback; } catch { return fallback; } };
export const loadCrosswordSession = () => typeof localStorage === "undefined" ? null : read(CROSSWORD_SESSION_KEY, null);
export const saveCrosswordSession = (session) => { if (typeof localStorage !== "undefined") localStorage.setItem(CROSSWORD_SESSION_KEY, JSON.stringify({ ...session, savedAt: Date.now() })); };
export const clearCrosswordSession = () => { if (typeof localStorage !== "undefined") localStorage.removeItem(CROSSWORD_SESSION_KEY); };
export const loadCrosswordStats = () => typeof localStorage === "undefined" ? {} : read(CROSSWORD_STATS_KEY, {});

export function completeCrosswordStats({ daily = false, elapsed = 0, independent = 0, total = 0 } = {}) {
  const stats = loadCrosswordStats(); const today = localDateKey();
  let dailyStreak = stats.dailyStreak || 0;
  if (daily && stats.lastDaily !== today) {
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    dailyStreak = stats.lastDaily === localDateKey(yesterday) ? dailyStreak + 1 : 1;
  }
  const next = { ...stats, completed: (stats.completed || 0) + 1, bestTime: !stats.bestTime || elapsed < stats.bestTime ? elapsed : stats.bestTime, bestIndependent: Math.max(stats.bestIndependent || 0, independent), dailyStreak, lastDaily: daily ? today : stats.lastDaily };
  next.achievements = [next.completed >= 1 && "First Light", independent === total && "Perfect Recall", next.dailyStreak >= 3 && "Three Day Journey", next.completed >= 10 && "Crossword Scholar"].filter(Boolean);
  if (typeof localStorage !== "undefined") localStorage.setItem(CROSSWORD_STATS_KEY, JSON.stringify(next));
  return next;
}

export function crosswordShareText({ solved, total, elapsed, dailyStreak = 0 }) {
  const blocks = Array.from({ length: total }, (_, index) => index < solved ? "🟩" : "🟨").join("");
  return `Divine Crossword ${localDateKey()}\n${blocks}\n${solved}/${total} independently · ${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}${dailyStreak ? ` · ${dailyStreak} day streak` : ""}\n99NamesOfAllah.org`;
}
