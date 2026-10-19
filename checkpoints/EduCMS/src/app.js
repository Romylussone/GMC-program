const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const { rateLimit } = require("express-rate-limit");
const fs = require("node:fs");
const path = require("node:path");
const config = require("./config/env");
const db = require("./config/database");
const { optionalAuth } = require("./middleware/auth");
const app = express();
app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        imgSrc: ["'self'", "data:", "blob:"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'", "data:"],
        upgradeInsecureRequests:
          process.env.NODE_ENV === "production" ? [] : null,
      },
    },
  }),
);
app.use(cors({ origin: config.frontendUrl }));
app.use(compression());
app.use(express.json({ limit: "2mb" }));
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 1000,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests. Please try again later.",
    },
  }),
);
app.get("/api/v1/health", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ success: true, data: { status: "healthy" } });
  } catch {
    res.status(503).json({ success: false, message: "Database unavailable" });
  }
});
app.use(
  "/api/v1",
  (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  },
  optionalAuth,
);
for (const route of [
  "auth",
  "posts",
  "comments",
  "media",
  "users",
  "analytics",
])
  app.use(`/api/v1/${route}`, require(`./routes/${route}`));
app.use("/api/v1/categories", require("./routes/taxonomy")("categories"));
app.use("/api/v1/tags", require("./routes/taxonomy")("tags"));
app.use("/api", (req, res) =>
  res.status(404).json({ success: false, message: "API endpoint not found" }),
);
app.use(
  "/uploads",
  (req, res, next) => {
    if (!/^\/[a-f0-9-]+\.(png|jpg|gif|webp|pdf)$/.test(req.path))
      return res.sendStatus(404);
    res.set("X-Content-Type-Options", "nosniff");
    if (req.path.endsWith(".pdf")) res.set("Content-Disposition", "attachment");
    next();
  },
  express.static(config.uploadDir, { dotfiles: "deny", fallthrough: false }),
);
const clientDir = path.resolve(__dirname, "../client/dist");
if (fs.existsSync(path.join(clientDir, "index.html"))) {
  app.use(express.static(clientDir));
  app.get("/{*path}", (req, res) =>
    res.sendFile(path.join(clientDir, "index.html")),
  );
} else
  app.get("/", (req, res) =>
    res.json({
      name: "EduCMS API",
      health: "/api/v1/health",
      frontend: "Run npm run dev or npm run build",
    }),
  );
app.use((req, res) =>
  res.status(404).json({ success: false, message: "Not found" }),
);
app.use(require("./middleware/errorHandler"));
module.exports = app;
