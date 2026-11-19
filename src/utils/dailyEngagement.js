import names from "../data/names";
import themes from "../data/nameThemes";
import { loadProfile, localDateKey, saveProfile } from "./learningProfile";

export const ENGAGEMENT_KEY = "reflections_daily_engagement_v1";
export const DAILY_STEPS = ["name", "learn", "review", "quiz"];

const empty = () => ({ days: {}, activeJourney: null, journeyProgress: {}, shieldsUsed: 0, bonusXp: 0, lastAchievementCount: 0 });
export function loadEngagement() {
  if (typeof window === "undefined") return empty();
  try { const value = JSON.parse(localStorage.getItem(ENGAGEMENT_KEY) || "null"); return value && typeof value === "object" ? { ...empty(), ...value, days: value.days || {}, journeyProgress: value.journeyProgress || {} } : empty(); }
  catch { return empty(); }
}
export function saveEngagement(value) {
  if (typeof window === "undefined") return value;
  localStorage.setItem(ENGAGEMENT_KEY, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("daily-engagement-updated"));
  return value;
}
export function getNameOfDay(date = new Date()) {
  const key = localDateKey(date);
  const seed = [...key].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 17);
  return { card: names[seed % names.length], index: seed % names.length, key };
}
export function markDailyStep(step, xp = 20) {
  if (!DAILY_STEPS.includes(step)) return loadEngagement();
  const data = loadEngagement(); const key = localDateKey();
  const complete = new Set(data.days[key]?.complete || []);
  const isNew = !complete.has(step); complete.add(step);
  if (isNew && step === "name") {
    const profile = loadProfile(); const activity = profile.activityDays?.[key] || { sessions: 0, seconds: 0 };
    saveProfile({ ...profile, totalSeconds: Number(profile.totalSeconds || 0) + 30, activityDays: { ...profile.activityDays, [key]: { ...activity, sessions: Number(activity.sessions || 0) + 1, seconds: Number(activity.seconds || 0) + 30 } } });
  }
  return saveEngagement({ ...data, bonusXp: Number(data.bonusXp || 0) + (isNew ? xp : 0), days: { ...data.days, [key]: { complete: [...complete], updatedAt: Date.now() } } });
}
export function getDailyPath(date = new Date()) {
  const data = loadEngagement(); const key = localDateKey(date); const complete = data.days[key]?.complete || [];
  return { key, complete, count: complete.length, total: DAILY_STEPS.length, percent: Math.round((complete.length / DAILY_STEPS.length) * 100) };
}
export function startJourney(id) {
  const data = loadEngagement();
  if (!themes.some((theme) => theme.id === id)) return data;
  const progress = data.journeyProgress[id] || { day: 1, completedDates: [], startedAt: Date.now(), completed: false };
  return saveEngagement({ ...data, activeJourney: id, journeyProgress: { ...data.journeyProgress, [id]: progress } });
}
export function getActiveJourney() {
  const data = loadEngagement(); const theme = themes.find((item) => item.id === data.activeJourney);
  if (!theme) return null;
  const progress = data.journeyProgress[theme.id] || { day: 1, completedDates: [], completed: false };
  const cards = Array.from({ length: 7 }, (_, index) => names.find((card) => card.name === theme.names[index % theme.names.length])).filter(Boolean);
  return { theme, progress, cards, current: cards[Math.min(6, Math.max(0, progress.day - 1))] };
}
export function completeJourneyDay() {
  const active = getActiveJourney(); if (!active) return loadEngagement();
  const data = loadEngagement(); const key = localDateKey(); const dates = new Set(active.progress.completedDates || []);
  if (dates.has(key)) return data;
  dates.add(key); const nextDay = Math.min(7, active.progress.day + 1); const completed = active.progress.day >= 7;
  const profile = loadProfile(); const activity = profile.activityDays?.[key] || { sessions: 0, seconds: 0 };
  saveProfile({ ...profile, totalSeconds: Number(profile.totalSeconds || 0) + 60, activityDays: { ...profile.activityDays, [key]: { ...activity, sessions: Number(activity.sessions || 0) + 1, seconds: Number(activity.seconds || 0) + 60 } } });
  return saveEngagement({ ...data, bonusXp: Number(data.bonusXp || 0) + (completed ? 100 : 30), journeyProgress: { ...data.journeyProgress, [active.theme.id]: { ...active.progress, day: nextDay, completedDates: [...dates], completed, completedAt: completed ? Date.now() : null } } });
}
export function getStreakSupport(profile = loadProfile()) {
  const data = loadEngagement(); const activeDays = Object.keys(profile.activityDays || {}).length;
  const earned = Math.floor(activeDays / 7); const shields = Math.max(0, earned - Number(data.shieldsUsed || 0));
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const missedYesterday = !profile.activityDays?.[localDateKey(yesterday)] && activeDays > 0;
  return { shields, missedYesterday, canProtect: shields > 0 && missedYesterday };
}
export function useStreakShield() {
  const profile = loadProfile(); const support = getStreakSupport(profile); if (!support.canProtect) return support;
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1); const key = localDateKey(yesterday);
  saveProfile({ ...profile, activityDays: { ...profile.activityDays, [key]: { sessions: 0, seconds: 0, protected: true } } });
  const data = loadEngagement(); saveEngagement({ ...data, shieldsUsed: Number(data.shieldsUsed || 0) + 1 });
  return getStreakSupport(loadProfile());
}
