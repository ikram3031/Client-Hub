#!/usr/bin/env node

/**
 * 🛠️ Interactive Setup Wizard for docsNlogs Client Configuration
 * Prompts developer for project info, creates .config/config.json,
 * and automatically onboards the project to Cloudflare D1 Hub.
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const http = require("http");
const https = require("https");

/**
 * Creates terminal readline interface for interactive prompts
 * @returns {readline.Interface}
 */
const createInterface = () => {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
};

/**
 * Prompts user for single question and returns answer or fallback
 * @param {readline.Interface} rl - Readline interface instance
 * @param {string} question - Question prompt text
 * @param {string} defaultValue - Default answer if empty
 * @returns {Promise<string>}
 */
const ask = (rl, question, defaultValue = "") => {
  return new Promise((resolve) => {
    const promptText = defaultValue ? `${question} (${defaultValue}): ` : `${question}: `;
    rl.question(promptText, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
};

/**
 * Makes HTTP request to onboard project to Cloudflare D1 Hub
 * @param {string} apiUrl - Base hub URL
 * @param {object} payload - Project registration payload
 * @returns {Promise<any>}
 */
const onboardToHub = (apiUrl, payload) => {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(`${apiUrl}/api/projects/onboard`);
      const client = url.protocol === "https:" ? https : http;
      const data = JSON.stringify(payload);

      const req = client.request(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(data),
          },
        },
        (res) => {
          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              resolve({ raw: body });
            }
          });
        }
      );

      req.on("error", (err) => resolve({ error: err.message }));
      req.write(data);
      req.end();
    } catch (err) {
      resolve({ error: err.message });
    }
  });
};

/**
 * Main interactive wizard runner
 */
const runWizard = async () => {
  console.log("\n=======================================================");
  console.log("🚀 docsNlogs Project Setup & Configuration Wizard");
  console.log("=======================================================\n");

  const rl = createInterface();

  // 1. Gather Project Info
  const projectName = await ask(rl, "1. Project Name", "My Awesome Project");
  const defaultSlug = projectName.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  const projectSlug = await ask(rl, "2. Project Slug / ID", defaultSlug);
  const description = await ask(rl, "3. Project Description", "Full-stack application with AI logging");
  const hubApiUrl = await ask(rl, "4. Hub API Base URL", "http://localhost:5000");

  // 2. Gather Doc Categories & Log Scopes
  const rawCategories = await ask(
    rl,
    "5. Initial Documentation Categories (comma-separated)",
    "Architecture, Backend, Frontend, Dashboard"
  );
  const categories = rawCategories.split(",").map((c) => c.trim()).filter(Boolean);

  const rawScopes = await ask(
    rl,
    "6. Action Log Scopes (comma-separated)",
    "frontend, backend, dashboard"
  );
  const scopes = rawScopes.split(",").map((s) => s.trim()).filter(Boolean);

  rl.close();

  // 3. Prepare Config Object
  const config = {
    hubApiUrl,
    project: {
      name: projectName,
      slug: projectSlug,
      description,
    },
    docs: {
      categories,
    },
    logs: {
      scopes,
      autoCommit: true,
    },
    createdAt: new Date().toISOString(),
  };

  // 4. Create .config folder & write config.json
  const configDir = path.join(process.cwd(), ".config");
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const configFilePath = path.join(configDir, "config.json");
  fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), "utf-8");

  console.log("\n✅ Configuration file successfully created at:");
  console.log(`   📁 ${configFilePath}`);

  // 5. Automatically Onboard to Hub
  console.log("\n📡 Registering project with Cloudflare D1 Hub...");
  const onboardRes = await onboardToHub(hubApiUrl, {
    name: projectName,
    slug: projectSlug,
    description,
    docsCategories: categories,
    logScopes: scopes,
  });

  if (onboardRes.success) {
    console.log("🎉 Successfully onboarded project to Cloudflare D1 Hub!");
  } else if (onboardRes.error) {
    console.log(`⚠️ Note: Could not reach Hub API at ${hubApiUrl} (${onboardRes.error}). You can onboard later when the server is running.`);
  } else {
    console.log("ℹ️ Server Response:", onboardRes);
  }

  console.log("\n=======================================================");
  console.log("✨ All set! You can now use the client logger to push logs.");
  console.log("=======================================================\n");
};

runWizard();
