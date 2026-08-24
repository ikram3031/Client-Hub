#!/usr/bin/env node

/**
 * 🤖 AI / Developer Action Logger SDK
 * Automatically reads project configuration from `.config/config.json`.
 * 
 * Usage Examples:
 *   node scripts/log.js --scope backend --feat FEAT-1 --task TASK-1-1 --summary "Added payment webhook" --files "src/pay.ts"
 *   node scripts/log.js --summary "Quick bug fix"
 */

const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");

/**
 * Reads and parses .config/config.json
 * @returns {object} Project configuration
 */
const loadConfig = () => {
  const configPath = path.join(process.cwd(), ".config", "config.json");
  if (!fs.existsSync(configPath)) {
    console.error("❌ Error: `.config/config.json` not found!");
    console.error("👉 Please run `node scripts/init-config.js` first to initialize your project.");
    process.exit(1);
  }

  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("❌ Failed to parse `.config/config.json`:", err.message);
    process.exit(1);
  }
};

/**
 * Parses CLI command flags
 * @returns {Record<string, any>}
 */
const parseFlags = () => {
  const args = process.argv.slice(2);
  const flags = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].replace(/^--/, "");
      const val = args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : true;
      flags[key] = val;
    }
  }

  return flags;
};

/**
 * Sends POST request to push AI log
 * @param {string} apiUrl - Base URL
 * @param {string} projectSlug - Project slug
 * @param {object} payload - Log payload
 * @returns {Promise<any>}
 */
const sendLog = (apiUrl, projectSlug, payload) => {
  return new Promise((resolve, reject) => {
    const url = new URL(`${apiUrl}/api/projects/${projectSlug}/logs`);
    const client = url.protocol === "https:" ? https : http;
    const body = JSON.stringify(payload);

    const req = client.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let resBody = "";
        res.on("data", (chunk) => (resBody += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(resBody));
          } catch (e) {
            resolve({ raw: resBody });
          }
        });
      }
    );

    req.on("error", reject);
    req.write(body);
    req.end();
  });
};

/**
 * Main logger runner
 */
const runLogger = async () => {
  const config = loadConfig();
  const flags = parseFlags();

  if (!flags.summary) {
    console.error("❌ Error: `--summary` flag is required.");
    console.log(`\nUsage:\n  node scripts/log.js --summary "Summary of change" [--scope backend] [--feat FEAT-1] [--task TASK-1-1] [--files "file1.ts,file2.ts"]\n`);
    process.exit(1);
  }

  const payload = {
    scope: flags.scope || (config.logs?.scopes?.[0] || "backend"),
    featureKey: flags.feat || null,
    subTaskKey: flags.task || null,
    action: flags.action || "feature",
    summary: flags.summary,
    promptUsed: flags.prompt || "",
    changedFiles: flags.files ? flags.files.split(",").map((f) => f.trim()) : [],
  };

  const projectSlug = config.project?.slug;
  const hubApiUrl = config.hubApiUrl || "http://localhost:5000";

  console.log(`📝 [${config.project?.name || projectSlug}] Pushing log to Hub...`);

  try {
    const result = await sendLog(hubApiUrl, projectSlug, payload);
    if (result.success) {
      console.log("✅ Log stored successfully in Cloudflare D1!");
      console.log(`   ID: ${result.log?.id} | Scope: ${result.log?.scope} | Action: ${result.log?.action}`);
    } else {
      console.error("❌ Hub Error:", result);
    }
  } catch (err) {
    console.error("❌ Network / Connection Error:", err.message);
  }
};

runLogger();
