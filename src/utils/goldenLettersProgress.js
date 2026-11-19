export const GOLDEN_LETTERS_STORAGE_KEY = "golden_letters_progress";
export const GOLDEN_LETTERS_STREAK_KEY = "golden_letters_streak";

const emptyRecord = () => ({
  started: false,
  listened: false,
  watched: false,
  traced: false,
  fadedTraced: false,
  freeWritten: false,
  quizPassed: false,
  completed: false,
  mastery: 0,
  bestTraceScore: 0,
  bestFadedScore: 0,
  bestWriteScore: 0,
  attempts: [],
  lastPracticedAt: null,
  nextReviewAt: null,
});

export function readGoldenProgress() {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(GOLDEN_LETTERS_STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function writeGoldenProgress(progress) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(GOLDEN_LETTERS_STORAGE_KEY, JSON.stringify(progress || {}));
    window.dispatchEvent(new CustomEvent("golden-progress-updated"));
  } catch {
    // Learning remains usable if storage is unavailable.
  }
}

export function getGoldenRecord(progress, id) {
  const existing = progress?.[`id_${id}`] || {};
  return { ...emptyRecord(), ...existing, attempts: Array.isArray(existing.attempts) ? existing.attempts : [] };
}

export function calculateLetterMastery(record) {
  const trace = Math.min(100, Number(record.bestTraceScore || (record.traced ? 70 : 0)));
  const faded = Math.min(100, Number(record.bestFadedScore || (record.fadedTraced ? 70 : 0)));
  const write = Math.min(100, Number(record.bestWriteScore || (record.freeWritten ? 65 : 0)));
  const recognition = record.quizPassed ? 100 : 0;
  const lesson = record.listened ? 100 : 0;
  return Math.round(trace * 0.2 + faded * 0.2 + write * 0.35 + recognition * 0.2 + lesson * 0.05);
}

export function masteryStatus(record) {
  const score = calculateLetterMastery(record);
  if (record.needsReview) return "review";
  if (score >= 80 && record.completed) return "mastered";
  if (record.started || score > 0) return "learning";
  return "new";
}

export function saveGoldenAttempt(id, type, score, details = {}) {
  const progress = readGoldenProgress();
  const record = getGoldenRecord(progress, id);
  const now = new Date();
  const attempt = { type, score: Math.round(score), at: now.toISOString(), ...details };
  record.started = true;
  record.lastPracticedAt = attempt.at;
  record.attempts = [attempt, ...record.attempts].slice(0, 12);

  if (type === "trace") {
    record.traced = score >= 58;
    record.bestTraceScore = Math.max(record.bestTraceScore || 0, Math.round(score));
  }
  if (type === "faded") {
    record.fadedTraced = score >= 55;
    record.bestFadedScore = Math.max(record.bestFadedScore || 0, Math.round(score));
  }
  if (type === "write") {
    record.freeWritten = score >= 48;
    record.bestWriteScore = Math.max(record.bestWriteScore || 0, Math.round(score));
  }
  if (type === "recognition") record.quizPassed = score >= 100;

  record.mastery = calculateLetterMastery(record);
  record.completed = Boolean(record.traced && record.fadedTraced && record.freeWritten && record.quizPassed);
  if (record.completed) {
    const reviewDate = new Date(now);
    reviewDate.setDate(reviewDate.getDate() + (record.mastery >= 80 ? 7 : 2));
    record.nextReviewAt = reviewDate.toISOString();
    record.needsReview = false;
  }

  progress[`id_${id}`] = record;
  writeGoldenProgress(progress);
  updateGoldenStreak(now);
  return record;
}

export function patchGoldenRecord(id, changes) {
  const progress = readGoldenProgress();
  const record = { ...getGoldenRecord(progress, id), ...changes, started: true };
  record.mastery = calculateLetterMastery(record);
  progress[`id_${id}`] = record;
  writeGoldenProgress(progress);
  return record;
}

export function goldenSummary(progress, total = 28) {
  const records = Array.from({ length: total }, (_, index) => getGoldenRecord(progress, index + 1));
  const mastered = records.filter((record) => masteryStatus(record) === "mastered").length;
  const learning = records.filter((record) => masteryStatus(record) === "learning").length;
  const review = records.filter((record) => masteryStatus(record) === "review").length;
  const completed = records.filter((record) => record.completed).length;
  const attempted = records.flatMap((record) => record.attempts || []);
  const writing = attempted.filter((attempt) => attempt.type === "write");
  const writingAccuracy = writing.length
    ? Math.round(writing.reduce((sum, attempt) => sum + Number(attempt.score || 0), 0) / writing.length)
    : 0;
  return { mastered, learning, review, completed, writingAccuracy, total };
}

export function nextGoldenLetterId(progress, total = 28) {
  for (let id = 1; id <= total; id += 1) {
    if (!getGoldenRecord(progress, id).completed) return id;
  }
  return 1;
}

export function readGoldenStreak() {
  if (typeof window === "undefined") return { count: 0, lastDay: null };
  try {
    return JSON.parse(window.localStorage.getItem(GOLDEN_LETTERS_STREAK_KEY) || "{}") || {};
  } catch {
    return { count: 0, lastDay: null };
  }
}

function updateGoldenStreak(date = new Date()) {
  if (typeof window === "undefined") return;
  const day = date.toISOString().slice(0, 10);
  const previous = readGoldenStreak();
  if (previous.lastDay === day) return;
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  const count = previous.lastDay === yesterday.toISOString().slice(0, 10) ? Number(previous.count || 0) + 1 : 1;
  try {
    window.localStorage.setItem(GOLDEN_LETTERS_STREAK_KEY, JSON.stringify({ count, lastDay: day }));
  } catch {
    // Ignore storage failures.
  }
}

export function resetGoldenProgress(mode = "all") {
  if (typeof window === "undefined") return;
  if (mode === "all") {
    window.localStorage.removeItem(GOLDEN_LETTERS_STORAGE_KEY);
    window.localStorage.removeItem(GOLDEN_LETTERS_STREAK_KEY);
  } else {
    const progress = readGoldenProgress();
    Object.keys(progress).forEach((key) => {
      const record = { ...progress[key] };
      delete record.practiceCompleted;
      delete record.practiceSegmentsCompleted;
      progress[key] = record;
    });
    writeGoldenProgress(progress);
  }
  window.dispatchEvent(new CustomEvent("golden-progress-updated"));
}

