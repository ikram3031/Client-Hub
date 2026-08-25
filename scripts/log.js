#!/usr/bin/env node

/**
 * 🤖 AI Action Logger CLI & Direct Cloudflare D1 Ingestion Engine
 * Strictly follows Git Commit & Changelog Standards:
 * 
 * Format: <LogID>(<type>): <description>
 * 
 * LogID Examples:
 *   - Dashboard / UI changes : AD01, AD76, etc.
 *   - Backend / API changes  : AB01, AB84, etc.
 *   - Architecture changes   : AA01, AA10, etc.
 * 
 * Types: feat, fix, refc, docs, perf, chor, styl, test
 * 
 * Usage Examples:
 *   node scripts/log.js "AD76(feat): add localstorage persistence and in-dropdown category search"
 *   node scripts/log.js "AB85(fix): resolve category regex and comma separated query parsing in product filter"
 *   node scripts/log.js --scope backend --type fix --summary "resolve query parsing" --prompt "Fix regex issue"
 */

const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");
const { execSync } = require("child_process");

// 1. Load environment variables from .env
const loadEnv = () => {
  const envPath = path.join(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const [key, ...rest] = trimmed.split("=");
        const val = rest.join("=").replace(/^["']|["']$/g, "").trim();
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = val;
        }
      }
    }
  }
};

loadEnv();

// 2. Load project configuration
const loadConfig = () => {
  const configPath = path.join(process.cwd(), ".config", "config.json");
  if (fs.existsSync(configPath)) {
    try {
      const raw = fs.readFileSync(configPath, "utf-8").replace(/^\uFEFF/, "");
      return JSON.parse(raw);
    } catch (e) {}
  }
  return {
    project: { name: "docsNlogs", slug: "docsnlogs" },
    hubApiUrl: "http://localhost:5000",
  };
};

// 3. Parse CLI command line flags & positional message
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

// 4. Git Helpers
const getGitCommitHash = () => {
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch (e) {
    return "";
  }
};

const getGitChangedFiles = () => {
  try {
    const files = execSync("git diff-tree --no-commit-id --name-only -r HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
    if (files) {
      return files.split("\n").map((f) => f.trim()).filter(Boolean);
    }
  } catch (e) {}

  try {
    const status = execSync("git diff --name-only HEAD~1 HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
    if (status) {
      return status.split("\n").map((f) => f.trim()).filter(Boolean);
    }
  } catch (e) {}

  return [];
};

// 5. Cloudflare D1 Query Execution via REST API
const queryD1Direct = async (sql, params = []) => {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;

  if (!accountId || !apiToken || !databaseId) {
    throw new Error("Missing Cloudflare D1 credentials in .env");
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ sql, params });
    const req = https.request(
      url,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const data = JSON.parse(body);
            if (data.success) {
              resolve(data.result?.[0]?.results || []);
            } else {
              const err = data.errors?.map((e) => e.message).join(", ") || "D1 error";
              reject(new Error(err));
            }
          } catch (e) {
            reject(e);
          }
        });
      }
    );

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
};

// Calculates next sequential LogID (e.g. AB01, AD01, AA01)
const getNextSequentialLogId = async (projectSlug, prefix) => {
  try {
    const rows = await queryD1Direct(
      `SELECT id FROM logs WHERE project_slug = ? AND id LIKE ?`,
      [projectSlug, `${prefix}%`]
    );

    let maxNum = 0;
    for (const r of rows) {
      const match = new RegExp(`^${prefix}(\\d+)$`, "i").exec(r.id || "");
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }

    const nextNum = maxNum + 1;
    return `${prefix}${String(nextNum).padStart(2, "0")}`;
  } catch (e) {
    return `${prefix}01`;
  }
};

// Parses standard format: <LogID>(<type>): <description>
const parseStandardMessage = (text) => {
  const regex = /^([A-Za-z]{2}\d+)\((feat|fix|refc|docs|perf|chor|styl|test)\):\s*(.+)$/i;
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

// Main Logger Runner
const runLogger = async () => {
  const config = loadConfig();
  const { flags, positionalMessage } = parseArgs();

  const rawMessage = (positionalMessage || flags.summary || flags.m || "").trim();
  const parsed = parseStandardMessage(rawMessage);

  const projectSlug = (flags.project || config.project?.slug || "docsnlogs").toLowerCase();
  let scope = flags.scope || (parsed ? parsed.scope : "frontend");
  let action = flags.type || flags.action || (parsed ? parsed.type : "feat");
  let summary = parsed ? parsed.description : rawMessage;
  let logId = flags.id ? String(flags.id).toUpperCase() : (parsed ? parsed.logId : null);

  if (!summary) {
    console.error("❌ Error: Commit message or summary is required.");
    console.log(`\nUsage standard:\n  node scripts/log.js "<LogID>(<type>): <description>"`);
    console.log(`  e.g.: node scripts/log.js "AD76(feat): add localstorage persistence"`);
    console.log(`  e.g.: node scripts/log.js "AB85(fix): resolve category regex query parsing"\n`);
    process.exit(1);
  }

  // Calculate prefix & next sequential ID if not explicitly specified
  if (!logId) {
    const prefix = scope.toLowerCase() === "backend" ? "AB" : scope.toLowerCase() === "architecture" ? "AA" : "AD";
    logId = await getNextSequentialLogId(projectSlug, prefix);
  }

  const commitId = flags.commit || flags.c || getGitCommitHash();
  const promptUsed = flags.prompt || flags.p || "";
  const changedFiles = flags.files
    ? flags.files.split(",").map((f) => f.trim()).filter(Boolean)
    : getGitChangedFiles();

  const formattedCommitMessage = `${logId}(${action}): ${summary}`;

  console.log(`\n📝 [Git Commit & Changelog Standards] Ingesting log to Cloudflare D1...`);
  console.log(`   Project : ${projectSlug}`);
  console.log(`   LogID   : #${logId}`);
  console.log(`   Format  : ${formattedCommitMessage}`);
  console.log(`   Commit  : ${commitId || "N/A"}`);
  console.log(`   Scope   : ${scope}`);
  if (changedFiles.length > 0) {
    console.log(`   Files   : ${changedFiles.slice(0, 4).join(", ")}${changedFiles.length > 4 ? ` (+${changedFiles.length - 4} more)` : ""}`);
  }

  try {
    await queryD1Direct(
      `INSERT INTO logs (id, project_slug, scope, feature_key, sub_task_key, action, summary, prompt_used, changed_files, diff_summary, commit_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        logId,
        projectSlug,
        scope.toLowerCase(),
        flags.feat || null,
        flags.task || null,
        action,
        summary,
        promptUsed,
        JSON.stringify(changedFiles),
        "",
        commitId,
      ]
    );

    console.log(`\n✅ [Success] Log #${logId} stored directly in Cloudflare D1!`);
    console.log(`   Commit Message: "${formattedCommitMessage}"`);
    console.log(`   Live at: /?project=${projectSlug}&view=logs\n`);
  } catch (err) {
    console.error(`\n❌ Error storing log #${logId}:`, err.message);
  }
};

runLogger();
