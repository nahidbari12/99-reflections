export const QURAN_PROGRESS_KEY = "reflections_quran_progress_v1";
export const QURAN_PROGRESS_EVENT = "quran-progress-updated";
const DEFAULT_GOAL = 5;

export function quranDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function readState() {
  try { return { goal: DEFAULT_GOAL, days: {}, totalVerses: [], surahs: [], ...JSON.parse(localStorage.getItem(QURAN_PROGRESS_KEY) || "{}") }; }
  catch { return { goal: DEFAULT_GOAL, days: {}, totalVerses: [], surahs: [] }; }
}
function writeState(state) {
  localStorage.setItem(QURAN_PROGRESS_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(QURAN_PROGRESS_EVENT));
}
function previousDate(date, amount) { const copy = new Date(date); copy.setDate(copy.getDate() - amount); return copy; }

export function getQuranProgress(now = new Date()) {
  const state = readState();
  const today = quranDateKey(now);
  const todayCount = state.days[today]?.length || 0;
  let streak = 0;
  let offset = todayCount >= state.goal ? 0 : 1;
  while ((state.days[quranDateKey(previousDate(now, offset))]?.length || 0) >= state.goal) { streak += 1; offset += 1; }
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = previousDate(now, 6 - index); const key = quranDateKey(date); const count = state.days[key]?.length || 0;
    return { key, label: date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1), count, complete: count >= state.goal };
  });
  const milestones = [25, 50, 100, 250, 500, 1000, 6236];
  const total = state.totalVerses.length;
  return { ...state, todayCount, completed: todayCount >= state.goal, percent: Math.min(100, Math.round((todayCount / state.goal) * 100)), streak, total, surahsExplored: state.surahs.length, week, nextMilestone: milestones.find((value) => value > total) || 6236 };
}

export function recordQuranVerseRead(surah, ayah, now = new Date()) {
  const state = readState(); const key = `${surah}:${ayah}`; const today = quranDateKey(now);
  const todayVerses = state.days[today] || [];
  if (!todayVerses.includes(key)) state.days[today] = [...todayVerses, key];
  if (!state.totalVerses.includes(key)) state.totalVerses.push(key);
  if (!state.surahs.includes(surah)) state.surahs.push(surah);
  writeState(state);
  return getQuranProgress(now);
}

export function setQuranDailyGoal(goal) {
  const state = readState(); state.goal = Math.max(1, Math.min(50, Number(goal) || DEFAULT_GOAL)); writeState(state); return getQuranProgress();
}
