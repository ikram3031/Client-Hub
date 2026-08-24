import express from "express";
import cors from "cors";
import dotenv from "dotenv";
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

/**
 * Initializes database schema and starts Express HTTP server
 */
const startServer = async () => {
  try {
    // Auto initialize Cloudflare D1 tables
    await initD1Schema();
    app.listen(PORT, () => {
      console.log(`🚀 [Server] Centralized AI Docs & Logs Hub API (Cloudflare D1) running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
