import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { initD1Schema } from "./config/d1";
import { projectRouter } from "./routes/projectRoutes";
import { docRouter } from "./routes/docRoutes";
import { featureRouter } from "./routes/featureRoutes";
import { logRouter } from "./routes/logRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Static Assets Serving (Ultra-Lightweight Public Viewer UI)
const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));

// Health Check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", engine: "Cloudflare D1 (SQLite)", timestamp: new Date().toISOString() });
});

// Master Projects API
app.use("/api/projects", projectRouter);

// Project-Specific Sub-Routes
app.use("/api/projects/:projectSlug/docs", docRouter);
app.use("/api/projects/:projectSlug/features", featureRouter);
app.use("/api/projects/:projectSlug/logs", logRouter);

// Fallback for Single Page Web UI
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api/")) {
    return res.sendFile(path.join(publicDir, "index.html"));
  }
  next();
});

/**
 * Initializes database schema and starts Express HTTP server
 */
const startServer = async () => {
  try {
    // Auto initialize Cloudflare D1 tables
    await initD1Schema();
    app.listen(PORT, () => {
      console.log(`🚀 [Server] Centralized AI Docs & Logs Hub running on http://localhost:${PORT}`);
      console.log(`🌐 [Web UI] Ultra-lightweight viewer available at http://localhost:${PORT}`);
      console.log(`📡 [API] REST API base: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

