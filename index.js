// Replit production server: serves the same generated static files as GitHub Pages.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".xml": "application/xml; charset=utf-8", ".txt": "text/plain; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf", ".mp3": "audio/mpeg", ".mp4": "video/mp4", ".ogg": "audio/ogg", ".wav": "audio/wav", ".webmanifest": "application/manifest+json" };
function createStaticServer(directory = path.join(__dirname, "dist")) {
  const root = path.resolve(directory);
  return http.createServer((req, res) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    if (req.socket.encrypted || req.headers["x-forwarded-proto"]?.split(",")[0].trim() === "https") res.setHeader("Strict-Transport-Security", "max-age=31536000");
    if (!["GET", "HEAD"].includes(req.method)) { res.writeHead(405, { Allow: "GET, HEAD" }); res.end(); return; }
    let url, pathname;
    try { url = new URL(req.url, "http://localhost"); pathname = decodeURIComponent(url.pathname); }
    catch { res.writeHead(400); res.end("Bad request"); return; }
    let target = path.resolve(root, "." + pathname);
    if (!target.startsWith(root + path.sep) && target !== root || pathname.includes("\\") || pathname.includes("\0")) { res.writeHead(400); res.end("Bad request"); return; }
    let status = 200;
    try {
      if (fs.statSync(target).isDirectory()) {
        if (!pathname.endsWith("/")) { res.writeHead(308, { Location: url.pathname + "/" + url.search }); res.end(); return; }
        target = path.join(target, "index.html");
      } else if (pathname.endsWith("/index.html")) {
        res.writeHead(308, { Location: url.pathname.slice(0, -10) + url.search }); res.end(); return;
      }
      if (!fs.statSync(target).isFile()) throw new Error("Not a file");
    } catch {
      status = 404;
      target = path.join(root, "404.html");
    }
    fs.stat(target, (error, stat) => {
      if (error) { res.writeHead(404); res.end("Page not found"); return; }
      res.setHeader("Content-Type", MIME[path.extname(target).toLowerCase()] || "application/octet-stream");
      res.setHeader("Cache-Control", status === 200 && target.includes(path.sep + "assets" + path.sep) ? "public, max-age=31536000, immutable" : "no-cache");
      // Audio playback can seek without downloading an entire track again.
      let start = 0, end = stat.size - 1;
      const range = req.headers.range;
      if (status === 200 && range && /^(audio|video)\//.test(MIME[path.extname(target)] || "")) {
        const match = range.match(/^bytes=(\d*)-(\d*)$/);
        if (match) {
          if (match[1]) { start = Number(match[1]); end = match[2] ? Number(match[2]) : end; }
          else if (match[2]) start = Math.max(0, stat.size - Number(match[2]));
          end = Math.min(end, stat.size - 1);
          if (start > end || start >= stat.size) { res.writeHead(416, { "Content-Range": `bytes */${stat.size}` }); res.end(); return; }
          status = 206;
          res.setHeader("Content-Range", `bytes ${start}-${end}/${stat.size}`);
        }
        res.setHeader("Accept-Ranges", "bytes");
      }
      res.setHeader("Content-Length", Math.max(0, end - start + 1));
      res.writeHead(status);
      if (req.method === "HEAD" || !stat.size) { res.end(); return; }
      const stream = fs.createReadStream(target, { start, end });
      stream.on("error", () => res.destroy());
      stream.pipe(res);
    });
  });
}
module.exports = { createStaticServer };
if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  createStaticServer().listen(port, "0.0.0.0", () => console.log(`99 Reflections is serving static pages on port ${port}`));
}
