# SEO update: October 3, 2026

This package contains the complete editable Replit project and a ready-built `dist` folder. The website remains static: learning progress stays in the browser. The included production server only serves static files.

## Changes

- 281 direct HTML pages, covering every existing fixed route, 99 Names, 114 surahs, and the existing Arabic letter lessons.
- Canonical URLs consistently end with a slash. The sitemap lists 270 public learning pages; personal progress and temporary results screens are excluded.
- Name pages include the existing reflections, Arabic and English Quran connections, and links before JavaScript loads.
- All 114 surahs contain the existing Arabic text and Pickthall English translation in their initial HTML. Text and translation source files are unchanged.
- The homepage includes a heading, description, learning links, and structured data before JavaScript loads.
- Page titles, descriptions, canonical links, and structured data update correctly when moving around the app.
- Old URLs without a final slash still lead to the same page. Verse anchors and query strings survive URL normalization.
- Missing addresses return an actual 404 instead of silently redirecting to Home.
- Offline cache refreshed. This does not clear learning progress, bookmarks, or achievements.
- Added llms.txt. The Replit production server sends security headers; an optional `_headers` file is provided for static hosts that support it.

## Publish with Replit

1. Download and unzip this complete package.
2. Open your existing Replit project. Back up its files first, then upload the contents of this package into the project root, replacing the matching files. `package.json`, `index.html`, `index.js`, `src`, `public`, and `scripts` belong at the top level, not inside another folder.
3. Open Replit's Shell and run `npm ci`.
4. Run `npm run build`. Wait for the message `Generated 281 HTML pages; 270 canonical sitemap URLs.`
5. Run `npm test`, then `npm run test:seo`. Both should pass.
6. Click Publish or Republish. The existing Replit deployment configuration builds with `npm run build` and runs `node index.js`. If configuring it manually, use those same commands.
7. Check the published site, not just the editor preview. Open `/learning-mode/`, `/quran/59/#ayah-21`, and `/names/ar-rahman/` directly in a new tab. They should load their own pages.

## If your custom domain is served by GitHub Pages

Uploading to Replit alone does not update a separate GitHub Pages deployment. Use your existing GitHub publishing workflow after building. The `npm run deploy` command builds and publishes the complete `dist` folder to the configured gh-pages branch using your existing authentication. Alternatively, replace the published branch's contents with the contents of `dist`, preserving the included `CNAME` and `.nojekyll`. Publish all route folders, not just `index.html` and `assets`.

GitHub Pages automatically redirects directory URLs to their slash-ending versions. The generated canonical links and sitemap now point directly to those final addresses. GitHub Pages ignores `_headers`, so some security-header notices may remain there; those require hosting support and are separate from the URL fixes.

## After publishing

- In Google Search Console, resubmit `https://99namesofallah.org/sitemap.xml`.
- Inspect `/names/ar-rahman/` and `/quran/59/` using URL Inspection and request indexing.
- Rerun the audit against the live custom domain. The fixes only take effect after publishing; Google's recrawl takes additional time.
- The audit may still flag short descriptions, short game introduction pages, or hosting-specific headers. Do not pad useful learning content just to increase word counts.

## Validation

The site tests and the production build were checked. The SEO verification checks every direct HTML route for a successful HTTP response, all canonical and sitemap addresses, navigation links, hashed assets, verse anchors, all 114 surahs against the existing source text, URL redirects, and real 404 behavior. A separate UI regression test verifies that Quran ayah links survive canonical URL normalization.
