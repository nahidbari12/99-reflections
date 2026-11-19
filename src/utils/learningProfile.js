import namesOfAllah from "../data/names";

export const PROFILE_KEY = "reflections_learning_profile_v1";

const DAY = 24 * 60 * 60 * 1000;

const defaultProfile = () => ({
  version: 1,
  createdAt: Date.now(),
  goalMinutes: 7,
  goal: "meanings",
  lastActiveAt: null,
  activityDays: {},
  names: {},
  reflections: {},
  totalSeconds: 0,
});

export function nameId(nameOrCard) {
  const card = typeof nameOrCard === "string"
    ? namesOfAllah.find((item) => item.name === nameOrCard)
    : nameOrCard;
  const value = card?.name || nameOrCard;
  const slug = String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const index = namesOfAllah.findIndex((item) => item.name === card?.name && item.arabic === card?.arabic);
  return index >= 0 ? `${slug}-${index + 1}` : slug;
}

export function localDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function loadProfile() {
  if (typeof window === "undefined") return defaultProfile();
  try {
    const parsed = JSON.parse(window.localStorage.getItem(PROFILE_KEY) || "null");
    const recordOrEmpty = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};
    return parsed && typeof parsed === "object"
      ? { ...defaultProfile(), ...parsed, names: recordOrEmpty(parsed.names), reflections: recordOrEmpty(parsed.reflections), activityDays: recordOrEmpty(parsed.activityDays) }
      : defaultProfile();
  } catch {
    return defaultProfile();
  }
}

export function saveProfile(profile) {
  if (typeof window === "undefined") return profile;
  const next = { ...profile, lastActiveAt: Date.now() };
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("learning-profile-updated", { detail: next }));
  return next;
}

function applyActivity(profile, seconds = 0) {
  const key = localDateKey();
  const saved = profile.activityDays?.[key];
  const current = saved && typeof saved === "object" ? saved : { sessions: 0, seconds: 0 };
  return {
    ...profile,
    totalSeconds: (profile.totalSeconds || 0) + Math.max(0, seconds),
    activityDays: {
      ...profile.activityDays,
      [key]: { sessions: current.sessions + 1, seconds: current.seconds + Math.max(0, seconds) },
    },
  };
}

export function recordNameAttempt(cardOrName, correct, options = {}) {
  const profile = loadProfile();
  const id = nameId(cardOrName);
  if (!id) return profile;
  const now = Date.now();
  const previous = profile.names[id] || {
    attempts: 0,
    correct: 0,
    streak: 0,
    intervalDays: 0,
    level: 0,
    wrongCount: 0,
  };
  const rating = options.rating || (correct ? "good" : "again");
  const nextStreak = correct ? (previous.streak || 0) + 1 : 0;
  const nextLevel = correct
    ? Math.min(5, (previous.level || 0) + (rating === "easy" ? 2 : 1))
    : Math.max(0, (previous.level || 0) - 1);
  let intervalDays = 0;
  if (correct) {
    const base = previous.intervalDays || (rating === "easy" ? 3 : rating === "hard" ? 0.5 : 1);
    intervalDays = Math.min(60, Math.max(0.25, base * (rating === "easy" ? 2.5 : rating === "hard" ? 1.2 : 1.8)));
  }
  const entry = {
    ...previous,
    attempts: previous.attempts + 1,
    correct: previous.correct + (correct ? 1 : 0),
    wrongCount: (previous.wrongCount || 0) + (correct ? 0 : 1),
    streak: nextStreak,
    level: nextLevel,
    intervalDays,
    lastSeen: now,
    dueAt: now + intervalDays * DAY,
    lastResult: correct ? "correct" : "incorrect",
    source: options.source || "learn",
  };
  return saveProfile(applyActivity({ ...profile, names: { ...profile.names, [id]: entry } }, options.seconds || 20));
}

export function saveReflection(cardOrName, text) {
  const profile = loadProfile();
  const id = nameId(cardOrName);
  if (!id) return profile;
  const reflections = { ...profile.reflections };
  if (text.trim()) reflections[id] = { text: text.trim(), updatedAt: Date.now() };
  else delete reflections[id];
  return saveProfile({ ...profile, reflections });
}

export function updateGoals(goal, goalMinutes) {
  return saveProfile({ ...loadProfile(), goal, goalMinutes: Number(goalMinutes) || 7 });
}

export function getNameState(profile, card) {
  const entry = profile.names[nameId(card)];
  if (!entry) return "new";
  if (entry.dueAt && entry.dueAt <= Date.now() && entry.level > 0) return "review";
  if (entry.level >= 4 && entry.streak >= 2) return "mastered";
  if (entry.level >= 2) return "familiar";
  return "learning";
}

export function getLearningStats(profile = loadProfile()) {
  const states = { new: 0, learning: 0, familiar: 0, mastered: 0, review: 0 };
  let correct = 0;
  let attempts = 0;
  namesOfAllah.forEach((card) => {
    states[getNameState(profile, card)] += 1;
    const entry = profile.names[nameId(card)];
    if (entry) { correct += entry.correct || 0; attempts += entry.attempts || 0; }
  });
  const days = Object.keys(profile.activityDays || {}).sort();
  let streak = 0;
  const cursor = new Date();
  if (!profile.activityDays?.[localDateKey(cursor)]) cursor.setDate(cursor.getDate() - 1);
  while (profile.activityDays?.[localDateKey(cursor)]) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  const weekSeconds = Object.entries(profile.activityDays || {}).reduce((sum, [key, value]) => {
    return sum + (new Date(`${key}T00:00:00`) >= weekStart && value && typeof value === "object" ? Number(value.seconds) || 0 : 0);
  }, 0);
  const weekActiveDays = Object.keys(profile.activityDays || {}).filter((key) => new Date(`${key}T00:00:00`) >= weekStart).length;
  const weekNames = namesOfAllah.filter((card) => (profile.names[nameId(card)]?.lastSeen || 0) >= weekStart.getTime()).length;
  return {
    ...states,
    streak,
    retention: attempts ? Math.round((correct / attempts) * 100) : 0,
    attempts,
    weekMinutes: Math.round(weekSeconds / 60),
    weekActiveDays,
    weekNames,
    overall: Math.round(((states.mastered + states.familiar * 0.65 + states.learning * 0.3) / 99) * 100),
  };
}

export function buildSmartSession(minutes = 7, profile = loadProfile()) {
  const count = Math.max(5, Math.min(20, Math.round(Number(minutes) * 1.15)));
  const scored = namesOfAllah.map((card, index) => {
    const entry = profile.names[nameId(card)];
    let priority = 20 - index * 0.02;
    if (!entry) priority += 35;
    else {
      if ((entry.dueAt || 0) <= Date.now()) priority += 70;
      priority += (entry.wrongCount || 0) * 10;
      priority -= (entry.level || 0) * 8;
    }
    return { card, priority: priority + Math.random() * 5 };
  });
  return scored.sort((a, b) => b.priority - a.priority).slice(0, count).map((item) => item.card);
}

export function buildReviewQueue(profile = loadProfile(), limit = 8) {
  const now = Date.now();
  const ranked = namesOfAllah.map((card, index) => {
    const entry = profile.names[nameId(card)];
    if (!entry) return { card, score: 5 - index * 0.001, reason: "New to your journey" };
    const overdue = entry.dueAt && entry.dueAt <= now;
    const accuracy = entry.attempts ? entry.correct / entry.attempts : 0;
    const score = (overdue ? 100 : 0) + (entry.wrongCount || 0) * 18 + (1 - accuracy) * 35 - (entry.level || 0) * 4;
    const reason = overdue ? "Ready to review" : (entry.wrongCount || 0) > 0 ? "Needs strengthening" : "Keep it fresh";
    return { card, score, reason };
  });
  return ranked.sort((a, b) => b.score - a.score).slice(0, Math.max(1, limit));
}

export function getXpSummary(profile = loadProfile()) {
  const stats = getLearningStats(profile);
  const correct = Object.values(profile.names || {}).reduce((sum, entry) => sum + Number(entry?.correct || 0), 0);
  const reflections = Object.keys(profile.reflections || {}).length;
  const activeDays = Object.keys(profile.activityDays || {}).length;
  const letters = getGoldenLetterProgress();
  let bonusXp = 0;
  try { bonusXp = Number(JSON.parse(localStorage.getItem("reflections_daily_engagement_v1") || "{}")?.bonusXp || 0); } catch { bonusXp = 0; }
  const xp = correct * 12 + Math.max(0, stats.attempts - correct) * 3 + stats.mastered * 50 + reflections * 15 + activeDays * 20 + letters * 35 + bonusXp;
  const level = Math.floor(xp / 500) + 1;
  const levelXp = xp % 500;
  return { xp, level, levelXp, nextLevelXp: 500, progress: Math.round((levelXp / 500) * 100) };
}

export function getAchievements(profile = loadProfile()) {
  const stats = getLearningStats(profile);
  const xp = getXpSummary(profile);
  const reflections = Object.keys(profile.reflections || {}).length;
  const letters = getGoldenLetterProgress();
  return [
    { id: "first-step", icon: "✦", title: "First Step", description: "Complete your first Name activity", current: Math.min(1, stats.attempts), goal: 1, unlocked: stats.attempts >= 1 },
    { id: "steady-heart", icon: "🔥", title: "Steady Heart", description: "Reach a 3-day learning streak", current: Math.min(3, stats.streak), goal: 3, unlocked: stats.streak >= 3 },
    { id: "ten-names", icon: "☾", title: "Growing Knowledge", description: "Master 10 Names", current: Math.min(10, stats.mastered), goal: 10, unlocked: stats.mastered >= 10 },
    { id: "reflection", icon: "❖", title: "Thoughtful Seeker", description: "Save your first reflection", current: Math.min(1, reflections), goal: 1, unlocked: reflections >= 1 },
    { id: "golden-hand", icon: "✎", title: "Golden Hand", description: "Complete 5 Arabic letters", current: Math.min(5, letters), goal: 5, unlocked: letters >= 5 },
    { id: "scholar", icon: "♛", title: "Dedicated Scholar", description: "Earn 2,500 XP", current: Math.min(2500, xp.xp), goal: 2500, unlocked: xp.xp >= 2500 },
  ];
}

export function getWeeklySummary(profile = loadProfile(), today = new Date()) {
  const days = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - offset));
    const value = profile.activityDays?.[localDateKey(date)];
    return { key: localDateKey(date), label: date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1), minutes: Math.round(Number(value?.seconds || 0) / 60), sessions: Number(value?.sessions || 0) };
  });
  const minutes = days.reduce((sum, day) => sum + day.minutes, 0);
  const sessions = days.reduce((sum, day) => sum + day.sessions, 0);
  const activeDays = days.filter((day) => day.sessions > 0).length;
  const bestDay = days.reduce((best, day) => day.minutes > best.minutes ? day : best, days[0]);
  return { days, minutes, sessions, activeDays, bestDay, goalDays: 5, goalProgress: Math.min(100, Math.round((activeDays / 5) * 100)) };
}

export function getGoldenLetterProgress() {
  try {
    const data = JSON.parse(localStorage.getItem("golden_letters_progress") || "{}");
    return Object.values(data).filter((value) => value?.completed).length;
  } catch { return 0; }
}
