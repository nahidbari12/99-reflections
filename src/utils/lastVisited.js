export const LAST_VISITED_KEY = "reflections_last_visited_page_v1";

const labels = [
  [/^\/quran\/(\d+)/, (match) => [`۞`, `Qur’an · Surah ${match[1]}`]],
  [/^\/quran/, () => ["۞", "Qur’an Reader"]],
  [/^\/my-dashboard/, () => ["◫", "My Dashboard"]],
  [/^\/daily-quiz/, () => ["☾", "Daily Quiz"]],
  [/^\/daily-challenge|^\/challenge/, () => ["◎", "Daily Challenge"]],
  [/^\/learning-mode/, () => ["☾", "Learning Journey"]],
  [/^\/smart-learn/, () => ["✦", "Guided Lesson"]],
  [/^\/smart-review/, () => ["◎", "Smart Review"]],
  [/^\/flashcards/, () => ["✦", "99 Names Flashcards"]],
  [/^\/names\//, () => ["✦", "Name of Allah"]],
  [/^\/names/, () => ["✦", "All 99 Names"]],
  [/^\/themes/, () => ["◎", "Names by Theme"]],
  [/^\/arabic-alphabet/, () => ["أ", "Arabic Alphabet"]],
  [/^\/golden-letters/, () => ["✎", "Golden Letters"]],
  [/^\/gamer-mode\/birds-of-paradise/, () => ["♢", "Birds of Paradise"]],
  [/^\/gamer-mode\/chess/, () => ["♟", "Chess"]],
  [/^\/gamer-mode\/checkers/, () => ["◆", "Checkers"]],
  [/^\/gamer-mode\/crossword/, () => ["▦", "Divine Crossword"]],
  [/^\/gamer-mode\/lantern-match/, () => ["◇", "Lantern Match"]],
  [/^\/gamer-mode\/name-rush/, () => ["⚡", "Name Rush"]],
  [/^\/gamer-mode\/scramble/, () => ["↻", "Name Scramble"]],
  [/^\/gamer-mode\/divine-descent/, () => ["↓", "Divine Descent"]],
  [/^\/gamer-mode\/tic-tac-toe/, () => ["×", "Tic-Tac-Toe"]],
  [/^\/gamer-mode/, () => ["♟", "Gamer Mode"]],
];

export function describeRoute(pathname) {
  for (const [pattern, makeLabel] of labels) {
    const match = pathname.match(pattern);
    if (match) { const [icon, label] = makeLabel(match); return { icon, label }; }
  }
  return { icon: "↗", label: "Continue exploring" };
}

export function shouldRememberRoute(pathname) {
  return pathname !== "/" && pathname !== "/about" && !/results/.test(pathname);
}

export function rememberVisitedPage({ pathname, search = "", hash = "" }) {
  if (!shouldRememberRoute(pathname)) return null;
  const page = { path: `${pathname}${search}${hash}`, ...describeRoute(pathname), savedAt: Date.now() };
  try { localStorage.setItem(LAST_VISITED_KEY, JSON.stringify(page)); } catch { /* Continue without persistence. */ }
  return page;
}

export function loadLastVisitedPage() {
  try {
    const page = JSON.parse(localStorage.getItem(LAST_VISITED_KEY));
    if (page?.path?.startsWith("/") && page.path !== "/") return page;
  } catch { /* Use the safe fallback. */ }
  return { path: "/learning-mode", icon: "☾", label: "Learning Journey" };
}
