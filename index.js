// index.js - Railway launcher
const { execSync } = require("node:child_process");

// Ensure we are in /backend
try {
  console.log("🚀 Starting AutoQuote backend from /backend ...");
  execSync("cd backend && npm install --omit=dev && npm run build && npm run start", {
    stdio: "inherit",
  });
} catch (err) {
  console.error("❌ Failed to start backend from launcher:", err);
  process.exit(1);
}

