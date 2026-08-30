import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { initD1Schema } from "./config/d1";
import { projectRouter } from "./routes/projectRoutes";
import { docRouter } from "./routes/docRoutes";
import { featureRouter } from "./routes/featureRoutes";
import { logRouter } from "./routes/logRoutes";
import { fleetRouter } from "./routes/fleetRoutes";
import { ticketRouter } from "./routes/ticketRoutes";
import { billingRouter } from "./routes/billingRoutes";
import { userRouter } from "./routes/userRoutes";
import { releaseRouter } from "./routes/releaseRoutes";
import { mailRouter } from "./routes/mailRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "x-hub-secret", "x-hub-signature", "x-client-key"],
  })
);
app.use(express.json({ limit: "10mb" }));

// Health Check
app.get("/api/health", (_req, res) => {
  res.json({
    service: "plexivia-clienthub-gateway",
    status: "ok",
    engine: "Cloudflare D1 (Serverless SQLite at Edge)",
    storage: "Cloudflare R2",
    timestamp: new Date().toISOString(),
  });
});

// Master Core Collections & Infrastructure APIs
app.use("/api/users", userRouter);
app.use("/api/releases", releaseRouter);
app.use("/api/fleet", fleetRouter);
app.use("/api/tickets", ticketRouter);
app.use("/api/billing", billingRouter);
app.use("/api/mail", mailRouter);

// Master Projects & Docs/Logs APIs
app.use("/api/projects", projectRouter);

// Project-Specific Sub-Routes
app.use("/api/projects/:projectSlug/docs", docRouter);
app.use("/api/projects/:projectSlug/features", featureRouter);
app.use("/api/projects/:projectSlug/logs", logRouter);

// Gemini AI Documentation Enhancement Endpoint
app.post("/api/gemini/generate", async (req, res) => {
  try {
    const { prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: "GEMINI_API_KEY not configured in .env" });
    }
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    res.json({ text: response.text });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Initializes D1 schema, mounts Vite SPA, and starts Express server
 */
const startServer = async () => {
  try {
    // 1. Initialize Cloudflare D1 tables
    await initD1Schema();

    // 2. Setup Static Multi-App Serving
    const adminDist = path.join(process.cwd(), "web-apps/admin/dist");
    const clientDist = path.join(process.cwd(), "web-apps/client/dist");
    const docsDist = path.join(process.cwd(), "web-apps/docsNlogs/dist");
    const rootDist = path.join(process.cwd(), "dist");

    // Admin Dashboard (/admin)
    if (fs.existsSync(adminDist)) {
      app.use("/admin", express.static(adminDist));
      app.get("/admin*", (_req, res) => res.sendFile(path.join(adminDist, "index.html")));
    }

    // Client Portal (/client)
    if (fs.existsSync(clientDist)) {
      app.use("/client", express.static(clientDist));
      app.get("/client*", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
    }

    // Docs & Logs Main Hub (/)
    const mainDocsDist = fs.existsSync(docsDist) ? docsDist : rootDist;
    if (fs.existsSync(mainDocsDist)) {
      app.use(express.static(mainDocsDist));
      app.get("*", (req, res, next) => {
        if (req.path.startsWith("/api/") || req.path.startsWith("/admin") || req.path.startsWith("/client")) {
          return next();
        }
        res.sendFile(path.join(mainDocsDist, "index.html"));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 [Server] Centralized AI Docs & Logs Hub running on http://localhost:${PORT}`);
      console.log(`👑 [Admin Panel] Super-Admin Fleet Hub at http://localhost:${PORT}/admin`);
      console.log(`🤝 [Client Portal] Client Self-Service at http://localhost:${PORT}/client`);
      console.log(`📖 [Docs Engine] Documentation App at http://localhost:${PORT}/`);
      console.log(`📡 [API] REST Endpoints available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
