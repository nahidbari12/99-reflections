import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { JSDOM } from "jsdom";

const require = createRequire(import.meta.url);
const { createStaticServer } = require("../index.js");
const root = process.cwd();
const dist = path.join(root, "dist");
const metadata = JSON.parse(fs.readFileSync(path.join(root, "src/data/seoMetadata.json"), "utf8"));
const sitemapDocument = new JSDOM(fs.readFileSync(path.join(dist, "sitemap.xml"), "utf8"), { contentType: "application/xml" }).window.document;
const sitemapUrls = [...sitemapDocument.querySelectorAll("loc")].map((item) => item.textContent);
assert.equal(sitemapDocument.querySelector("parsererror"), null, "Sitemap must be valid XML");
assert.equal(new Set(sitemapUrls).size, sitemapUrls.length, "Sitemap must not contain duplicates");
assert.deepEqual(sitemapUrls.sort(), Object.values(metadata).filter((page) => page.indexable).map((page) => page.canonical).sort());
const linkedPaths = new Set();
for (const [route, page] of Object.entries(metadata)) {
  const html = fs.readFileSync(path.join(dist, route.slice(1), "index.html"), "utf8");
  const document = new JSDOM(html).window.document;
  assert.equal(document.querySelectorAll("h1").length, 1, `${route} needs one H1 before JavaScript`);
  assert.equal(document.title, page.title);
  assert.equal(document.querySelectorAll('link[rel="canonical"]').length, 1);
  assert.equal(document.querySelector('link[rel="canonical"]').href, page.canonical);
  assert.equal(document.querySelector('meta[property="og:url"]').content, page.canonical);
  assert.equal(document.querySelector('meta[name="description"]').content, page.description);
  assert.equal(document.querySelector('meta[name="robots"]').content, page.indexable ? "index, follow" : "noindex, follow");
  assert.equal(JSON.parse(document.querySelector("#page-schema").textContent).url, page.canonical);
  assert.ok(document.querySelectorAll('a[href^="/"]').length >= 2, `${route} needs crawlable navigation`);
  for (const anchor of document.querySelectorAll('a[href^="/"]')) {
    const url = new URL(anchor.getAttribute("href"), "https://99namesofallah.org");
    assert.ok(metadata[url.pathname], `${route} links to missing or noncanonical ${url.pathname}`);
    linkedPaths.add(url.pathname);
    if (url.hash.startsWith("#ayah-")) {
      const target = new JSDOM(fs.readFileSync(path.join(dist, url.pathname.slice(1), "index.html"), "utf8")).window.document;
      assert.ok(target.getElementById(url.hash.slice(1)), `Missing ayah anchor ${url.href}`);
    }
  }
  for (const asset of document.querySelectorAll('script[src^="/assets/"], link[href^="/assets/"]')) {
    const filename = asset.getAttribute("src") || asset.getAttribute("href");
    assert.ok(fs.existsSync(path.join(dist, filename.slice(1))), `Missing asset ${filename}`);
  }
  if (route.startsWith("/names/") && route !== "/names/") {
    assert.ok(document.body.textContent.includes("Reflection"));
    assert.ok(document.querySelector('.seo-verse[lang="ar"]'));
    assert.ok(document.body.textContent.includes("Pickthall"));
    assert.ok(document.body.textContent.split(/\s+/).length > 80, `${route} must include its existing learning content`);
  }
  if (/^\/quran\/\d+\/$/.test(route)) {
    const chapterNumber = route.split("/")[2];
    const chapter = JSON.parse(fs.readFileSync(path.join(root, "public/quran/chapters", `${chapterNumber}.json`), "utf8"));
    assert.equal(document.querySelectorAll('section[id^="ayah-"]').length, chapter.verseCount);
    for (const verse of chapter.verses) {
      const section = document.getElementById(`ayah-${verse.number}`);
      assert.equal(section.querySelector('[lang="ar"]').textContent, verse.arabic);
      assert.equal(section.querySelectorAll("p")[1].textContent, verse.english);
    }
  }
}
assert.equal(Object.keys(metadata).filter((route) => route.startsWith("/names/") && route !== "/names/").length, 99);
assert.equal(Object.keys(metadata).filter((route) => /^\/quran\/\d+\/$/.test(route)).length, 114);
// Every public page must be discoverable through actual HTML links.
for (const [route, page] of Object.entries(metadata)) if (page.indexable && route !== "/") assert.ok(linkedPaths.has(route), `Orphan page ${route}`);

const server = createStaticServer(dist);
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
try {
  // Inspect real HTTP statuses without silently following redirects.
  for (const route of Object.keys(metadata)) {
    const response = await fetch(base + route, { redirect: "manual" });
    assert.equal(response.status, 200, `Direct URL ${route} must return 200`);
    assert.ok((await response.text()).includes('id="root"'));
    if (route !== "/") {
      const redirect = await fetch(base + route.slice(0, -1) + "?practice=1", { redirect: "manual" });
      assert.equal(redirect.status, 308);
      assert.equal(redirect.headers.get("location"), route + "?practice=1");
      await redirect.text();
    }
  }
  const missing = await fetch(base + "/this-page-does-not-exist/", { redirect: "manual" });
  assert.equal(missing.status, 404);
  const errorHtml = await missing.text();
  assert.ok(errorHtml.includes('content="noindex, follow"'));
  assert.ok(!errorHtml.includes("window.location"));
  const head = await fetch(base + "/quran/59/", { method: "HEAD", headers: { "x-forwarded-proto": "https" } });
  assert.equal(head.status, 200);
  assert.equal(head.headers.get("x-content-type-options"), "nosniff");
  assert.equal(head.headers.get("strict-transport-security"), "max-age=31536000");
  const data = await fetch(base + "/quran/chapters/59.json");
  assert.equal(data.headers.get("content-type"), "application/json; charset=utf-8");
  assert.equal((await data.json()).number, 59);
  console.log(`SEO checks passed: ${Object.keys(metadata).length} direct HTML routes, ${sitemapUrls.length} canonical sitemap URLs, all reflections and 114 complete surahs, links, assets, redirects, and 404 behavior.`);
} finally {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
