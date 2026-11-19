import { mkdir, readFile, writeFile } from "node:fs/promises";
import { getSurahNames } from "quran-meta";
import { getSurahMeta } from "quran-meta/hafs";

const root = new URL("../", import.meta.url);
const source = new URL("./quran-source/", import.meta.url);
const output = new URL("../public/quran/", import.meta.url);
const chaptersOutput = new URL("./chapters/", output);

function parse(text) {
  return text.split(/\r?\n/).filter((line) => /^\d+\|\d+\|/.test(line)).map((line) => {
    const [surah, ayah, ...parts] = line.split("|");
    return { surah: Number(surah), ayah: Number(ayah), text: parts.join("|") };
  });
}

const [arabicText, englishText] = await Promise.all([
  readFile(new URL("quran-uthmani.txt", source), "utf8"),
  readFile(new URL("en.pickthall.txt", source), "utf8"),
]);
const arabic = parse(arabicText);
const english = parse(englishText);
if (arabic.length !== 6236 || english.length !== 6236) throw new Error("Expected 6,236 verses in both sources");

const englishNames = getSurahNames("en");
await mkdir(chaptersOutput, { recursive: true });
const chapters = [];
const search = [];

for (let number = 1; number <= 114; number += 1) {
  const meta = getSurahMeta(number);
  const [nameEnglish, meaningEnglish] = englishNames[number];
  const ar = arabic.filter((verse) => verse.surah === number);
  const en = english.filter((verse) => verse.surah === number);
  if (ar.length !== meta.ayahCount || en.length !== meta.ayahCount) throw new Error(`Verse count mismatch in surah ${number}`);
  const verses = ar.map((verse, index) => ({ number: verse.ayah, arabic: verse.text, english: en[index].text }));
  const chapter = { number, nameArabic: meta.name, nameEnglish, meaningEnglish, revelationType: meta.isMeccan ? "Meccan" : "Medinan", verseCount: meta.ayahCount, verses };
  chapters.push({ number, nameArabic: meta.name, nameEnglish, meaningEnglish, revelationType: chapter.revelationType, verseCount: meta.ayahCount });
  verses.forEach((verse) => search.push({ s: number, a: verse.number, ar: verse.arabic, en: verse.english }));
  await writeFile(new URL(`${number}.json`, chaptersOutput), `${JSON.stringify(chapter)}\n`);
}

await writeFile(new URL("chapters.json", output), `${JSON.stringify(chapters)}\n`);
await writeFile(new URL("search-index.json", output), `${JSON.stringify(search)}\n`);
console.log(`Generated ${chapters.length} chapters and ${search.length} searchable verses.`);
