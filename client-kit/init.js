#!/usr/bin/env node

/**
 * 🛠️ Interactive Setup Wizard for docsNlogs Client Configuration
 * Prompts developer for project info, creates client-kit/config.json,
 * and automatically onboards the project to the central Hub API.
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
 * Prompts user for single question and returns answer or default
 * @param {readline.Interface} rl
 * @param {string} question
 * @param {string} defaultValue
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
 * Sends onboarding HTTP request to Hub API
 * @param {string} apiUrl
 * @param {object} payload
 * @returns {Promise<any>}
 */
const onboardToHub = (apiUrl, payload) => {
  return new Promise((resolve) => {
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
  console.log("🚀 docsNlogs Project Setup & Onboarding Wizard");
  console.log("=======================================================\n");

  const rl = createInterface();

  // 1. Gather Project Info
  const projectName = await ask(rl, "1. Project Name", "My Client Project");
  const defaultSlug = projectName.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  const projectSlug = await ask(rl, "2. Project Slug / ID", defaultSlug);
  const description = await ask(rl, "3. Project Description", "Full-stack application with AI logging");
  const hubApiUrl = await ask(rl, "4. Central Hub API URL", "http://localhost:5000");

  // 2. Gather Doc Categories & Scopes
  const rawCategories = await ask(
    rl,
    "5. Initial Documentation Categories (comma-separated)",
    "Architecture, Backend, Frontend, Dashboard"
  );
  const categories = rawCategories.split(",").map((c) => c.trim()).filter(Boolean);

  const rawScopes = await ask(
    rl,
    "6. Action Log Scopes (comma-separated)",
    "frontend, backend, architecture, dashboard"
  );
  const scopes = rawScopes.split(",").map((s) => s.trim()).filter(Boolean);

  rl.close();

  // 3. Prepare Config
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

  // 4. Save to client-kit/config.json & .config/config.json
  const configPath = path.join(__dirname, "config.json");
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");

  console.log("\n✅ Configuration file successfully created at:");
  console.log(`   📁 ${configPath}`);

  // 5. Onboard to Hub
  console.log(`\n📡 Registering project "${projectName}" on Hub API (${hubApiUrl})...`);
  const res = await onboardToHub(hubApiUrl, {
    name: projectName,
    slug: projectSlug,
    description,
    docsCategories: categories,
    logScopes: scopes,
  });

  if (res.success) {
    console.log("🎉 Successfully registered & onboarded project on Hub!");
    console.log(`   Live at: ${hubApiUrl}/?project=${projectSlug}\n`);
  } else if (res.error) {
    console.log(`⚠️ Note: Could not reach Hub at ${hubApiUrl} (${res.error}). The configuration is saved locally and will connect once the Hub is running.\n`);
  } else {
    console.log("ℹ️ Server Response:", res);
  }

  console.log("=======================================================");
  console.log("✨ All set! Your AI assistants can now log commits using:");
  console.log(`   node client-kit/log.js\n`);
};

runWizard();
