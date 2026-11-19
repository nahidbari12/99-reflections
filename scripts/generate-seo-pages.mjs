import fs from "node:fs";
import path from "node:path";
import { routes } from "./seo-routes.mjs";
import { JSDOM } from "jsdom";

const root = process.cwd();
const dist = path.join(root, "dist");
const baseUrl = "https://99namesofallah.org";
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
// Data-only modules have no imports or browser side effects. Keep content sourced from the app.
const loadData = async (relative) => import(`data:text/javascript;base64,${Buffer.from(read(relative)).toString("base64")}`);
const source = read("src/data/names.jsx");
const match = source.match(/const namesOfAllah\s*=\s*(\[[\s\S]*?\]);\s*\n\s*export default/);
if (!match) throw new Error("Could not read the Names data for SEO generation.");
const names = Function(`"use strict"; return (${match[1]});`)();
const { default: reflections } = await loadData("src/data/nameReflections.js");
const { default: themes } = await loadData("src/data/nameThemes.js");
const { default: letters } = await loadData("src/data/arabicAlphabet.js");
const { quranConnections, quranConnectionLabel } = await loadData("src/data/quranConnections.js");
const chapters = JSON.parse(read("public/quran/chapters.json"));
const chapterData = new Map(chapters.map((chapter) => [chapter.number, JSON.parse(read(`public/quran/chapters/${chapter.number}.json`))]));
if (names.length !== 99 || reflections.length !== 99 || quranConnections.length !== 99 || chapters.length !== 114) throw new Error("Incomplete learning data.");
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
const baseSlug = (value) => String(value).normalize("NFKD").toLowerCase().replace(/[‘’']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const slugFor = (card, index) => names.slice(0, index).some((item) => baseSlug(item.name) === baseSlug(card.name)) ? `${baseSlug(card.name)}-${index + 1}` : baseSlug(card.name);
const routePath = (route) => route ? `/${route.replace(/^\/+|\/+$/g, "")}/` : "/";
const link = (route, label) => `<a href="${routePath(route)}">${escapeHtml(label)}</a>`;
const paragraphs = (value) => String(value).split(/\n+/).filter(Boolean).map((part) => `<p>${escapeHtml(part)}</p>`).join("");
const nameList = (cards = names) => `<ol class="seo-name-list">${cards.map((card) => { const index = names.indexOf(card); return `<li>${link(`names/${slugFor(card, index)}`, `${card.name} — ${card.meaning}`)} <span lang="ar" dir="rtl">${escapeHtml(card.arabic)}</span></li>`; }).join("")}</ol>`;
const letterList = () => `<ul>${letters.map((letter) => `<li>${link(`golden-letters/letter/${letter.id}`, `${letter.name} — ${letter.letter}`)}</li>`).join("")}</ul>`;
const chapterList = () => `<ol>${chapters.map((chapter) => `<li>${link(`quran/${chapter.number}`, `${chapter.nameEnglish} — ${chapter.meaningEnglish}`)} <span lang="ar" dir="rtl">${escapeHtml(chapter.nameArabic)}</span></li>`).join("")}</ol>`;
const navigation = `<nav aria-label="Explore 99 Reflections">${link("", "Home")} · ${link("names", "All 99 Names")} · ${link("themes", "Themes")} · ${link("learning-mode", "Learn")} · ${link("quran", "Qur’an")} · ${link("gamer-mode", "Games")}</nav>`;
const pages = [];
function addPage(route, title, description, body, { indexable = true, schema } = {}) {
  const canonical = baseUrl + routePath(route);
  pages.push({ route, title, description, canonical, indexable, body,
    schema: schema || { "@context": "https://schema.org", "@type": "WebPage", name: title, description, url: canonical, inLanguage: "en" } });
}
for (const page of routes) {
  let content = paragraphs(page.description);
  const extraLinks = page.links.map((route) => link(route, routes.find((item) => item.route === route)?.heading || route)).join(" · ");
  if (extraLinks) content += `<section><h2>Continue exploring</h2><p>${extraLinks}</p></section>`;
  if (["names", "flashcards"].includes(page.route)) content += nameList();
  if (page.route === "themes" || page.route === "themed-journeys") content += themes.map((theme) => `<section><h2>${escapeHtml(theme.title)}</h2>${paragraphs(theme.description)}${nameList(names.filter((card) => theme.names.includes(card.name)))}</section>`).join("");
  if (["arabic-alphabet", "golden-letters/letters"].includes(page.route)) content += letterList();
  if (page.route === "quran") content += `<section><h2>Choose a surah</h2>${chapterList()}<p>Arabic text: Tanzil Uthmani. English translation: Mohammed Marmaduke Pickthall. ${link("quran/1", "Begin with Al-Faatiha")}</p></section>`;
  if (page.route === "") content += `<section><h2>Learn, remember, reflect</h2><p>Build a lasting connection with the 99 Names of Allah. Explore Arabic Names and English meanings, read a reflection, then practice recall through flashcards, daily quizzes, and meaningful challenges.</p><p>Begin with a guided lesson or browse the Names at your own pace. Arabic letter practice and Golden Letters provide a path to recognizing, tracing, and writing the alphabet. Gamer Mode offers nine learning games.</p><p>Read the Qur’an in Arabic and English, and explore the verse connections alongside each Name. Use your dashboard to follow your learning journey, mastery, achievements, and weekly progress.</p><p>Free. No account needed. Learning progress stays on your device.</p></section>`;
  if (page.route === "about") content += `<p>For inquiries, feedback, or permissions: <a href="mailto:99ReflectionsApp@gmail.com">99ReflectionsApp@gmail.com</a>.</p>`;
  addPage(page.route, page.title, page.description, `<h1>${escapeHtml(page.heading)}</h1>${content}`, { indexable: page.indexable });
}
names.forEach((card, index) => {
  const route = `names/${slugFor(card, index)}`;
  const canonical = baseUrl + routePath(route);
  const description = `${card.name} (${card.arabic}) means “${card.meaning}.” Read its reflection and Qur’an connection, and practice with 99 Reflections.`;
  const connection = quranConnections[index];
  const verse = chapterData.get(connection.surah)?.verses.find((item) => item.number === connection.ayah);
  if (!verse) throw new Error(`Missing Qur’an verse ${connection.reference}.`);
  const related = themes.filter((theme) => theme.names.includes(card.name));
  const previous = (index + names.length - 1) % names.length;
  const next = (index + 1) % names.length;
  const body = `<p>NAME ${index + 1} OF 99</p><div class="seo-arabic" lang="ar" dir="rtl">${escapeHtml(card.arabic)}</div><h1>${escapeHtml(card.name)}</h1><h2>${escapeHtml(card.meaning)}</h2><section><h2>Reflection</h2>${paragraphs(reflections[index])}</section><section><h2>${escapeHtml(quranConnectionLabel(connection))}</h2><p>Qur’an ${connection.reference}</p><p lang="ar" dir="rtl" class="seo-verse">${escapeHtml(verse.arabic)}</p><p>${escapeHtml(verse.english)}</p><p>English translation: Pickthall.</p>${connection.type === "contextual" ? "<p>This traditional Name is connected through the ayah’s wording or meaning rather than appearing as the exact title.</p>" : ""}<p><a href="/quran/${connection.surah}/#ayah-${connection.ayah}">Read Surah ${connection.surah}, Ayah ${connection.ayah}</a></p></section>${related.length ? `<section><h2>Related themes</h2><p>${related.map((theme) => link("themes", theme.title)).join(" · ")}</p></section>` : ""}<p>${link("flashcards", "Study with flashcards")} · ${link("smart-learn", "Start a guided lesson")}</p><nav aria-label="Previous and next Name">${link(`names/${slugFor(names[previous], previous)}`, `Previous: ${names[previous].name}`)} · ${link(`names/${slugFor(names[next], next)}`, `Next: ${names[next].name}`)}</nav>`;
  addPage(route, `${card.name}: Meaning & Reflection | 99 Names of Allah`, description, body, { schema: { "@context": "https://schema.org", "@type": "LearningResource", name: `${card.name} — ${card.meaning}`, description, educationalLevel: "Beginner", learningResourceType: "Study guide", inLanguage: ["en", "ar"], url: canonical } });
});
for (const chapter of chapterData.values()) {
  const body = `<h1>Surah ${escapeHtml(chapter.nameEnglish)}</h1><p lang="ar" dir="rtl" class="seo-arabic">${escapeHtml(chapter.nameArabic)}</p><p>${escapeHtml(chapter.meaningEnglish)} · Surah ${chapter.number} · ${chapter.verseCount} verses</p><p>Arabic text: Tanzil Uthmani. English translation: Mohammed Marmaduke Pickthall.</p>${chapter.verses.map((verse) => `<section id="ayah-${verse.number}"><h2>Ayah ${verse.number}</h2><p lang="ar" dir="rtl" class="seo-verse">${escapeHtml(verse.arabic)}</p><p>${escapeHtml(verse.english)}</p></section>`).join("")}`;
  addPage(`quran/${chapter.number}`, `Surah ${chapter.nameEnglish}: Arabic & English | 99 Reflections`, `Read Surah ${chapter.nameEnglish} (${chapter.meaningEnglish}), chapter ${chapter.number} of the Qur’an, in Arabic and Pickthall’s English translation.`, body);
}
for (const letter of letters) {
  addPage(`golden-letters/letter/${letter.id}`, `Write Arabic ${letter.name} | Golden Letters`, `Learn the Arabic letter ${letter.name} (${letter.letter}), its forms and sound, then practice tracing and writing it in Golden Letters.`, `<h1>Learn to write ${escapeHtml(letter.name)}</h1><p class="seo-arabic" lang="ar" dir="rtl">${escapeHtml(letter.letter)}</p><p>${escapeHtml(letter.soundExample)}</p>${paragraphs(letter.note)}<h2>Letter forms</h2><ul>${Object.entries(letter.forms).map(([form, value]) => `<li>${escapeHtml(form)}: <span lang="ar" dir="rtl">${escapeHtml(value)}</span></li>`).join("")}</ul><p>Learn, watch, trace, write, and check your understanding in the interactive lesson.</p><p>${link("golden-letters/letters", "Explore the Arabic alphabet")}</p>`);
}
const metadata = Object.fromEntries(pages.map(({ body, route, ...meta }) => [routePath(route), meta]));
if (process.argv.includes("--metadata")) {
  fs.writeFileSync(path.join(root, "src/data/seoMetadata.json"), JSON.stringify(metadata, null, 2) + "\n");
  console.log(`Prepared metadata for ${pages.length} routes.`);
  process.exit(0);
}
const template = read("dist/index.html");
const staticStyle = "#root>.seo-page{max-width:850px;margin:32px auto;padding:24px;color:#f8fafc;font:17px/1.7 system-ui}#root>.seo-page a{color:#fde047}#root>.seo-page nav{display:flex;flex-wrap:wrap;gap:8px}#root>.seo-page h1{font-size:clamp(26px,5vw,38px);line-height:1.25}#root>.seo-page .seo-arabic{font-size:clamp(42px,8vw,64px);line-height:1.8}#root>.seo-page .seo-verse{font-size:26px;line-height:2}#root>.seo-page li{margin:8px 0}#root>.seo-page section{margin:28px 0}";
function pageHtml(page) {
  // Parsing the template avoids brittle tag matching and makes generation repeatable.
  const dom = new JSDOM(template);
  const document = dom.window.document;
  document.title = page.title;
  const setTag = (selector, tag, attrs) => {
    const matches = [...document.head.querySelectorAll(selector)];
    const element = matches.shift() || document.createElement(tag);
    matches.forEach((duplicate) => duplicate.remove());
    for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
    if (!element.parentNode) document.head.appendChild(element);
    return element;
  };
  setTag('meta[name="description"]', "meta", { name: "description", content: page.description });
  setTag('meta[name="robots"]', "meta", { name: "robots", content: page.indexable ? "index, follow" : "noindex, follow" });
  setTag('link[rel="canonical"]', "link", { rel: "canonical", href: page.canonical });
  for (const [property, content] of Object.entries({ "og:title": page.title, "og:description": page.description, "og:url": page.canonical })) {
    setTag(`meta[property="${property}"]`, "meta", { property, content });
  }
  setTag("#seo-fallback-style", "style", { id: "seo-fallback-style" }).textContent = staticStyle;
  setTag("#page-schema", "script", { id: "page-schema", type: "application/ld+json" }).textContent = JSON.stringify(page.schema).replace(/</g, "\\u003c");
  document.getElementById("root").innerHTML = `<main class="seo-page">${navigation}${page.body}<footer>${link("about", "About 99 Reflections")}</footer></main>`;
  const html = dom.serialize();
  dom.window.close();
  return html;
}
for (const page of pages) {
  const directory = path.join(dist, page.route);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, "index.html"), pageHtml(page));
}
const indexedPages = pages.filter((page) => page.indexable);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexedPages.map((page) => `  <url><loc>${page.canonical}</loc></url>`).join("\n")}\n</urlset>\n`;
fs.writeFileSync(path.join(dist, "sitemap.xml"), sitemap);
fs.writeFileSync(path.join(root, "public/sitemap.xml"), sitemap);
const llms = `# 99 Reflections\n\nLearn and reflect on the 99 Names of Allah, and read the Qur’an in Arabic and English.\n\n## Learning resources\n- [All 99 Names](${baseUrl}/names/): Arabic, English meanings, reflections, and Qur’an connections.\n- [Names by theme](${baseUrl}/themes/): Related Names grouped for study.\n- [Qur’an](${baseUrl}/quran/): All 114 surahs; Tanzil Uthmani Arabic and Pickthall English.\n- [Learning activities](${baseUrl}/learning-mode/): Guided lessons, flashcards, and Arabic practice.\n- [About](${baseUrl}/about/): Educational purpose and contact.\n`;
fs.writeFileSync(path.join(dist, "llms.txt"), llms);
fs.writeFileSync(path.join(root, "public/llms.txt"), llms);
console.log(`Generated ${pages.length} HTML pages; ${indexedPages.length} canonical sitemap URLs.`);
