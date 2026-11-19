import namesOfAllah from "../data/names";
import nameReflections from "../data/nameReflections";
import { shuffle } from "./gameUtils";

export const CROSSWORD_SIZE = 17;

export function normalizeCrosswordAnswer(name) {
  return String(name || "").normalize("NFKD").replace(/[^a-zA-Z]/g, "").toUpperCase();
}

function descriptionFor(index, card) {
  const reflection = String(nameReflections[index] || "").split("\n").slice(1).join(" ").trim();
  const escapedName = String(card.name || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const sentence = reflection.split(/(?<=[.!?])\s+/)[0].replace(new RegExp(escapedName, "gi"), "This Name");
  if (sentence && sentence.length <= 180) return sentence;
  return `This Name reminds us that Allah is ${String(card.meaning || "").replace(/^The\s+/i, "").toLowerCase()}.`;
}

export function buildCrosswordCards(random = Math.random) {
  return namesOfAllah.map((card, index) => ({
    ...card,
    index,
    answer: normalizeCrosswordAnswer(card.name),
    definitionClue: card.meaning,
    descriptionClue: descriptionFor(index, card),
  })).filter((card) => card.answer.length >= 4 && card.answer.length <= CROSSWORD_SIZE);
}

function key(row, col) { return `${row}-${col}`; }

function placementCandidates(entry, placed, cells, size) {
  const candidates = [];
  for (const existing of placed) {
    for (let a = 0; a < entry.answer.length; a += 1) {
      for (let b = 0; b < existing.answer.length; b += 1) {
        if (entry.answer[a] !== existing.answer[b]) continue;
        const direction = existing.direction === "across" ? "down" : "across";
        const row = existing.row + (existing.direction === "down" ? b : 0) - (direction === "down" ? a : 0);
        const col = existing.col + (existing.direction === "across" ? b : 0) - (direction === "across" ? a : 0);
        const checked = validatePlacement(entry.answer, row, col, direction, cells, size);
        if (checked.valid) candidates.push({ row, col, direction, intersections: checked.intersections, center: Math.abs(row - size / 2) + Math.abs(col - size / 2) });
      }
    }
  }
  return candidates.sort((a, b) => b.intersections - a.intersections || a.center - b.center);
}

function validatePlacement(answer, row, col, direction, cells, size) {
  const endRow = row + (direction === "down" ? answer.length - 1 : 0);
  const endCol = col + (direction === "across" ? answer.length - 1 : 0);
  if (row < 0 || col < 0 || endRow >= size || endCol >= size) return { valid: false, intersections: 0 };
  const before = direction === "across" ? key(row, col - 1) : key(row - 1, col);
  const after = direction === "across" ? key(row, endCol + 1) : key(endRow + 1, col);
  if (cells.has(before) || cells.has(after)) return { valid: false, intersections: 0 };
  let intersections = 0;
  for (let index = 0; index < answer.length; index += 1) {
    const currentRow = row + (direction === "down" ? index : 0);
    const currentCol = col + (direction === "across" ? index : 0);
    const occupied = cells.get(key(currentRow, currentCol));
    if (occupied) {
      if (occupied.solution !== answer[index] || occupied.directions.has(direction)) return { valid: false, intersections: 0 };
      intersections += 1;
    } else {
      const neighbors = direction === "across" ? [key(currentRow - 1, currentCol), key(currentRow + 1, currentCol)] : [key(currentRow, currentCol - 1), key(currentRow, currentCol + 1)];
      if (neighbors.some((neighbor) => cells.has(neighbor))) return { valid: false, intersections: 0 };
    }
  }
  return { valid: intersections > 0, intersections };
}

function place(entry, row, col, direction, cells, placed) {
  const id = `${entry.index}-${placed.length}`;
  const next = { ...entry, id, row, col, direction };
  placed.push(next);
  for (let index = 0; index < entry.answer.length; index += 1) {
    const cellRow = row + (direction === "down" ? index : 0);
    const cellCol = col + (direction === "across" ? index : 0);
    const cellKey = key(cellRow, cellCol);
    const current = cells.get(cellKey) || { row: cellRow, col: cellCol, solution: entry.answer[index], directions: new Set(), entries: [] };
    current.directions.add(direction); current.entries.push(id); cells.set(cellKey, current);
  }
}

function cropPuzzle(placed, cells) {
  const values = [...cells.values()];
  const minRow = Math.min(...values.map((cell) => cell.row));
  const minCol = Math.min(...values.map((cell) => cell.col));
  const maxRow = Math.max(...values.map((cell) => cell.row));
  const maxCol = Math.max(...values.map((cell) => cell.col));
  const entries = placed.map((entry) => ({ ...entry, row: entry.row - minRow, col: entry.col - minCol }));
  const starts = new Map();
  entries.sort((a, b) => a.row - b.row || a.col - b.col || (a.direction === "across" ? -1 : 1)).forEach((entry) => {
    const startKey = key(entry.row, entry.col);
    if (!starts.has(startKey)) starts.set(startKey, starts.size + 1);
    entry.number = starts.get(startKey);
  });
  const croppedCells = values.map((cell) => ({ ...cell, row: cell.row - minRow, col: cell.col - minCol, directions: [...cell.directions], number: starts.get(key(cell.row - minRow, cell.col - minCol)) || null }));
  return { entries, cells: croppedCells, rows: maxRow - minRow + 1, cols: maxCol - minCol + 1 };
}

export function hashSeed(value) {
  let hash = 2166136261;
  for (const character of String(value)) { hash ^= character.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return hash >>> 0;
}

export function seededRandom(seedValue) {
  let seed = hashSeed(seedValue) || 1;
  return () => { seed += 0x6D2B79F5; let value = seed; value = Math.imul(value ^ value >>> 15, value | 1); value ^= value + Math.imul(value ^ value >>> 7, value | 61); return ((value ^ value >>> 14) >>> 0) / 4294967296; };
}

export function generateCrossword({ count = 10, random = Math.random, attempts = 160, cards, clueMode = "mixed" } = {}) {
  const all = cards?.length ? cards : buildCrosswordCards(random);
  let best = null;
  for (let run = 0; run < attempts; run += 1) {
    const pool = shuffle(all, random).slice(0, Math.max(count + 8, 22)).sort((a, b) => b.answer.length - a.answer.length);
    const cells = new Map();
    const placed = [];
    const first = pool.shift();
    const startCol = Math.floor((CROSSWORD_SIZE - first.answer.length) / 2);
    place(first, Math.floor(CROSSWORD_SIZE / 2), startCol, "across", cells, placed);
    for (const entry of pool) {
      if (placed.length >= count) break;
      const candidates = placementCandidates(entry, placed, cells, CROSSWORD_SIZE);
      if (candidates.length) {
        const bestScore = candidates[0].intersections;
        const top = candidates.filter((candidate) => candidate.intersections === bestScore).slice(0, 5);
        const candidate = top[Math.floor(random() * top.length)];
        place(entry, candidate.row, candidate.col, candidate.direction, cells, placed);
      }
    }
    if (!best || placed.length > best.entries.length) best = cropPuzzle(placed, cells);
    if (placed.length >= count) {
      const puzzle = cropPuzzle(placed.slice(0, count), rebuildCells(placed.slice(0, count)));
      return withClueTypes(puzzle, random, clueMode);
    }
  }
  return withClueTypes(best, random, clueMode);
}

function rebuildCells(entries) {
  const cells = new Map();
  entries.forEach((entry, order) => {
    const copy = { ...entry };
    copy.id = entry.id || `${entry.index}-${order}`;
    for (let index = 0; index < copy.answer.length; index += 1) {
      const row = copy.row + (copy.direction === "down" ? index : 0);
      const col = copy.col + (copy.direction === "across" ? index : 0);
      const cellKey = key(row, col);
      const current = cells.get(cellKey) || { row, col, solution: copy.answer[index], directions: new Set(), entries: [] };
      current.directions.add(copy.direction); current.entries.push(copy.id); cells.set(cellKey, current);
    }
  });
  return cells;
}

function withClueTypes(puzzle, random, clueMode = "mixed") {
  return { ...puzzle, entries: puzzle.entries.map((entry) => ({ ...entry, clue: clueMode === "meaning" ? entry.definitionClue : clueMode === "reflection" ? entry.descriptionClue : random() < 0.62 ? entry.definitionClue : entry.descriptionClue })) };
}
