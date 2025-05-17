// index.js (CommonJS syntax, compatible with Replit Deploy)

const express = require("express");
const path = require("path");

const app = express();

// ✅ Serve static files from dist (build output)
app.use(express.static(path.join(__dirname, "dist")));

// ✅ Serve public static assets like audio or images
app.use("/audio", express.static(path.join(__dirname, "public/audio")));
app.use("/images", express.static(path.join(__dirname, "public/images")));

// ✅ React Router fallback (only for non-asset routes)
app.get("*", (req, res) => {
  // If request is for a static asset, skip index fallback
  const ext = path.extname(req.url);
  if (ext) return res.status(404).send("Not Found");

  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// ✅ Port setup for Replit Deploy
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
