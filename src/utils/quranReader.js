export const QURAN_PREFS_KEY = "reflections_quran_preferences_v1";
export const QURAN_LAST_READ_KEY = "reflections_quran_last_read_v1";
export const QURAN_BOOKMARKS_KEY = "reflections_quran_bookmarks_v1";

export function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
export function loadQuranPreferences() { return { view: "both", fontSize: 34, theme: "night", ...readJson(QURAN_PREFS_KEY, {}) }; }
export function saveQuranPreferences(value) { localStorage.setItem(QURAN_PREFS_KEY, JSON.stringify(value)); }
export function loadLastRead() { return readJson(QURAN_LAST_READ_KEY, { surah: 1, ayah: 1 }); }
export function saveLastRead(surah, ayah) { localStorage.setItem(QURAN_LAST_READ_KEY, JSON.stringify({ surah, ayah, savedAt: Date.now() })); }
export function loadBookmarks() { return readJson(QURAN_BOOKMARKS_KEY, []); }
export function toggleBookmark(bookmarks, surah, ayah) {
  const key = `${surah}:${ayah}`;
  const next = bookmarks.includes(key) ? bookmarks.filter((item) => item !== key) : [...bookmarks, key];
  localStorage.setItem(QURAN_BOOKMARKS_KEY, JSON.stringify(next));
  return next;
}
export function normalizeArabic(value) { return value.normalize("NFKD").replace(/[\u064B-\u065F\u0670\u06D6-\u06EDـ]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي"); }
export function searchVerses(verses, query, limit = 80) {
  const needle = query.trim().toLocaleLowerCase();
  if (needle.length < 2) return [];
  const arabicNeedle = normalizeArabic(needle);
  return verses.filter((verse) => verse.en.toLocaleLowerCase().includes(needle) || normalizeArabic(verse.ar).includes(arabicNeedle)).slice(0, limit);
}

export async function fetchWithOfflineCache(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Unable to load (${response.status})`);
    if ("caches" in window) caches.open("99-reflections-quran-v1").then((cache) => cache.put(url, response.clone())).catch(() => {});
    return response.json();
  } catch (error) {
    if ("caches" in window) {
      const cached = await caches.match(url);
      if (cached) return cached.json();
    }
    throw error;
  }
}
