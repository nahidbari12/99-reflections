// index.js

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Always serve static assets from the Vite build output
app.use(express.static(path.join(__dirname, "dist")));

// ✅ Serve static audio and image files from /public
app.use("/audio", express.static(path.join(__dirname, "public/audio")));
app.use("/images", express.static(path.join(__dirname, "public/images")));

// ✅ React Router fallback — serve index.html for all unmatched routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist/index.html"));
});

// ✅ Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
