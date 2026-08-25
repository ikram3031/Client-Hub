#!/usr/bin/env node

/**
 * 🤖 docsNlogs Zero-Dependency AI Action Logger Client CLI
 * 
 * Auto-detects git commits, changed files, assigns sequential LogIDs (#AB01, #AD01, #AA01),
 * and pushes structured audit records to the central docsNlogs Hub API.
 * 
 * Usage:
 *   node client-kit/log.js
 *   node client-kit/log.js "AB01(feat): add auth middleware"
 *   node client-kit/log.js --summary "Fix button styling" --scope frontend --files "src/btn.tsx"
 */

const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");
const { execSync } = require("child_process");

/**
 * Loads project configuration from client-kit/config.json or .config/config.json
 * @returns {object}
 */
const loadConfig = () => {
  const possiblePaths = [
    path.join(__dirname, "config.json"),
    path.join(process.cwd(), "client-kit", "config.json"),
    path.join(process.cwd(), ".config", "config.json"),
    path.join(process.cwd(), "config.json"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, "utf-8").replace(/^\uFEFF/, "");
        return JSON.parse(raw);
      } catch (e) {}
    }
  }

  return {
    hubApiUrl: process.env.HUB_API_URL || "http://localhost:5000",
    project: { name: "docsNlogs", slug: "docsnlogs" },
  };
};

/**
 * Parses CLI command line flags into key-value pairs
 * @returns {{ flags: Record<string, any>, positionalMessage: string }}
 */
const parseArgs = () => {
  const args = process.argv.slice(2);
  const flags = {};
  let positionalMessage = "";

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].replace(/^--/, "");
      const val = args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : true;
      flags[key] = val;
    } else if (!positionalMessage) {
      positionalMessage = args[i];
    }
  }

  return { flags, positionalMessage };
};

/**
 * Git Helper: Gets short commit hash of HEAD
 * @returns {string}
 */
const getGitCommitHash = () => {
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch (e) {
    return "";
  }
};

/**
 * Git Helper: Gets latest commit message
 * @returns {string}
 */
const getLatestGitCommitMessage = () => {
  try {
    return execSync("git log -1 --pretty=%B", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch (e) {
    return "";
  }
};

/**
 * Git Helper: Gets list of changed files in latest commit or uncommitted staging
 * @returns {string[]}
 */
const getGitChangedFiles = () => {
  try {
    const files = execSync("git diff-tree --no-commit-id --name-only -r HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
    if (files) {
      return files.split("\n").map((f) => f.trim()).filter(Boolean);
    }
  } catch (e) {}

  try {
    const status = execSync("git status --porcelain", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
    if (status) {
      return status
        .split("\n")
        .map((line) => line.slice(3).trim())
        .filter(Boolean);
    }
  } catch (e) {}

  return [];
};

/**
 * Auto-detects scope (backend, frontend, architecture) based on modified file paths
 * @param {string[]} files
 * @returns {'backend' | 'frontend' | 'architecture'}
 */
const detectScopeFromFiles = (files) => {
  if (!files || files.length === 0) return "frontend";

  const backendKeywords = ["server", "api", "backend", "db", "routes", "models", "controllers", "config"];
  const archKeywords = ["doc", "docs", "arch", "architecture", "schema", "infra", "deploy"];

  const joined = files.join(" ").toLowerCase();

  for (const kw of backendKeywords) {
    if (joined.includes(kw)) return "backend";
  }
  for (const kw of archKeywords) {
    if (joined.includes(kw)) return "architecture";
  }

  return "frontend";
};

/**
 * Parses commit message standard: <LogID>(<type>): <description>
 * e.g. "AB01(feat): add auth middleware"
 * @param {string} text
 */
const parseCommitStandard = (text) => {
  if (!text) return null;
  const regex = /^([A-Za-z]{2}\d+)\((feat|fix|refc|docs|perf|chor|styl|config|test)\):\s*(.+)$/i;
  const match = regex.exec(text.trim());
  if (match) {
    const logId = match[1].toUpperCase();
    const type = match[2].toLowerCase();
    const description = match[3].trim();
    const prefix = logId.slice(0, 2);
    const scope = prefix === "AB" ? "backend" : prefix === "AA" ? "architecture" : "frontend";

    return {
      logId,
      type,
      description,
      scope,
    };
  }
  return null;
};

/**
 * Sends HTTP/HTTPS request to the Hub API
 * @param {string} baseUrl
 * @param {string} endpoint
 * @param {object} payload
 * @returns {Promise<any>}
 */
const sendToHubApi = (baseUrl, endpoint, payload) => {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(`${baseUrl}${endpoint}`);
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

      req.on("error", (err) => reject(err));
      req.write(data);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Main AI Logger execution runner
 */
const main = async () => {
  const config = loadConfig();
  const { flags, positionalMessage } = parseArgs();

  // Determine message: CLI argument, flag, or auto-read from latest git commit
  let rawMessage = (positionalMessage || flags.summary || flags.m || "").trim();
  if (!rawMessage) {
    rawMessage = getLatestGitCommitMessage();
  }

  const parsed = parseCommitStandard(rawMessage);
  const changedFiles = flags.files
    ? flags.files.split(",").map((f) => f.trim()).filter(Boolean)
    : getGitChangedFiles();

  const projectSlug = (flags.project || config.project?.slug || "docsnlogs").toLowerCase();
  let scope = flags.scope || (parsed ? parsed.scope : detectScopeFromFiles(changedFiles));
  let action = flags.type || flags.action || (parsed ? parsed.type : "feat");
  let summary = parsed ? parsed.description : rawMessage;
  let logId = flags.id ? String(flags.id).toUpperCase() : (parsed ? parsed.logId : null);
  const commitId = flags.commit || flags.c || getGitCommitHash();
  const promptUsed = flags.prompt || flags.p || "";

  if (!summary) {
    console.error("❌ Error: No summary provided and could not detect latest git commit.");
    console.log(`\nUsage examples:\n  node client-kit/log.js "AB01(feat): add auth endpoint"`);
    console.log(`  node client-kit/log.js --summary "Fix button alignment" --scope frontend\n`);
    process.exit(1);
  }

  const hubApiUrl = config.hubApiUrl || "http://localhost:5000";

  console.log(`\n🚀 [docsNlogs Client Kit] Pushing AI Action Log to Hub...`);
  console.log(`   Hub URL : ${hubApiUrl}`);
  console.log(`   Project : ${projectSlug}`);
  console.log(`   Scope   : ${scope}`);
  console.log(`   Summary : ${summary}`);
  if (commitId) console.log(`   Commit  : ${commitId}`);
  if (changedFiles.length > 0) {
    console.log(`   Files   : ${changedFiles.slice(0, 3).join(", ")}${changedFiles.length > 3 ? ` (+${changedFiles.length - 3} more)` : ""}`);
  }

  try {
    const payload = {
      id: logId,
      scope,
      action,
      summary,
      commitId,
      promptUsed,
      changedFiles,
      featureKey: flags.feat || null,
      subTaskKey: flags.task || null,
    };

    const res = await sendToHubApi(hubApiUrl, `/api/projects/${projectSlug}/logs`, payload);

    if (res.success) {
      const createdId = res.log?.id || logId || "OK";
      console.log(`\n✅ [Success] Action Log #${createdId} ingested into Cloudflare D1!`);
      console.log(`   Standard Format : #${createdId}(${action}): ${summary}`);
      console.log(`   Live Dashboard  : ${hubApiUrl}/?project=${projectSlug}\n`);
    } else {
      console.error(`\n❌ Hub API Error:`, res.error || res.message || res);
    }
  } catch (err) {
    console.error(`\n❌ Failed to connect to Hub API at ${hubApiUrl}:`, err.message);
    console.log(`   Ensure the docsNlogs server is running: npm run dev\n`);
  }
};

main();
