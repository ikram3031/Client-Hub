import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
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

    // 2. Setup Vite SPA Middleware or Static Production Serve
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.use((req, res, next) => {
        if (req.method === "GET" && !req.path.startsWith("/api/")) {
          return res.sendFile(path.join(distPath, "index.html"));
        }
        next();
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 [Server] Centralized AI Docs & Logs Hub running on http://localhost:${PORT}`);
      console.log(`📖 [Docs Engine] Vite React Documentation App ready at http://localhost:${PORT}`);
      console.log(`📡 [API] REST Endpoints available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
