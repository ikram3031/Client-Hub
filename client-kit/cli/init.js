#!/usr/bin/env node

/**
 * 🛠️ Interactive Setup Wizard for ClientHub SDK Configuration
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const http = require("http");
const https = require("https");

const createInterface = () => {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
};

const ask = (rl, question, defaultValue = "") => {
  return new Promise((resolve) => {
    const promptText = defaultValue ? `${question} (${defaultValue}): ` : `${question}: `;
    rl.question(promptText, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
};

const runWizard = async () => {
  console.log("\n=======================================================");
  console.log("🚀 ClientHub Project Setup & Onboarding Wizard");
  console.log("=======================================================\n");

  const rl = createInterface();

  const projectName = await ask(rl, "1. Project Name", "My Client Project");
  const defaultSlug = projectName.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  const projectSlug = await ask(rl, "2. Project Slug / ID", defaultSlug);
  const clientKey = await ask(rl, "3. Client Key / Subdomain", projectSlug);
  const apiKey = await ask(rl, "4. ClientHub API Secret Key (optional for public hub)", "");
  const hubApiUrl = await ask(rl, "5. Central Hub API URL", "http://144.79.218.241:5000");

  const rawScopes = await ask(
    rl,
    "6. Action Log Scopes (comma-separated)",
    "frontend, backend, architecture, dashboard"
  );
  const scopes = rawScopes.split(",").map((s) => s.trim()).filter(Boolean);

  rl.close();

  const config = {
    hubApiUrl,
    clientKey,
    apiKey,
    project: {
      name: projectName,
      slug: projectSlug,
      description: `${projectName} with embedded ClientHub telemetry & logging`,
    },
    defaultScope: scopes[0] || "backend",
    scopes,
    prefixMap: {
      backend: "AB-",
      dashboard: "AD-",
      frontend: "AF-",
      architecture: "AA-",
      deployment: "DEP-",
    },
    createdAt: new Date().toISOString(),
  };

  const configPath = path.join(process.cwd(), "clienthub.config.json");
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");

  console.log("\n✅ Configuration file successfully created at:");
  console.log(`   📁 ${configPath}`);
  console.log("\n✨ All set! Your AI assistants can now log commits using:");
  console.log(`   npx clienthub-log\n`);
};

runWizard();
