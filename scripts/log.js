#!/usr/bin/env node

/**
 * 🤖 AI Action Logger CLI & Direct Cloudflare D1 Ingestion Engine
 * 
 * Automatically captures git commit hash, modified files, AI prompts,
 * and pushes the log directly to Cloudflare D1 database.
 * 
 * Usage:
 *   node scripts/log.js --summary "Refactored UI to pure lightweight documentation reader" --scope frontend --prompt "Make it a simple doc viewer"
 *   node scripts/log.js --summary "Implemented user authentication" --scope backend --feat FEAT-1
 */

const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");
const { execSync } = require("child_process");
const crypto = require("crypto");

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

// 3. Parse CLI command line flags
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

// 4. Git Helpers
const getGitCommitHash = () => {
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch (e) {
    return "";
  }
};

const getGitFullCommitHash = () => {
  try {
    return execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
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

// 5. Direct Cloudflare D1 Query Execution via REST API
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

// 6. HTTP API fallback
const sendLogViaHttp = (apiUrl, projectSlug, payload) => {
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

// 7. Main Logger Runner
const runLogger = async () => {
  const config = loadConfig();
  const flags = parseFlags();

  const projectSlug = (flags.project || config.project?.slug || "docsnlogs").toLowerCase();
  const summary = flags.summary || flags.m || "Executed AI code update";
  const scope = (flags.scope || "frontend").toLowerCase();
  const action = flags.action || "feature";
  const promptUsed = flags.prompt || flags.p || "";
  const commitId = flags.commit || flags.c || getGitCommitHash();
  const changedFiles = flags.files
    ? flags.files.split(",").map((f) => f.trim()).filter(Boolean)
    : getGitChangedFiles();

  const logId = crypto.randomUUID();

  console.log(`\n🤖 [AI Action Logger] Ingesting commit into Cloudflare D1 database...`);
  console.log(`   Project : ${projectSlug}`);
  console.log(`   Log ID  : #${logId.slice(0, 8)} (${logId})`);
  console.log(`   Commit  : ${commitId || "N/A"}`);
  console.log(`   Scope   : ${scope}`);
  console.log(`   Summary : ${summary}`);
  if (changedFiles.length > 0) {
    console.log(`   Files   : ${changedFiles.slice(0, 4).join(", ")}${changedFiles.length > 4 ? ` (+${changedFiles.length - 4} more)` : ""}`);
  }

  // Attempt Direct D1 Ingestion
  try {
    await queryD1Direct(
      `INSERT INTO logs (id, project_slug, scope, feature_key, sub_task_key, action, summary, prompt_used, changed_files, diff_summary, commit_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        logId,
        projectSlug,
        scope,
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

    console.log(`\n✅ [Success] Commit log directly stored in Cloudflare D1!`);
    console.log(`   Available in Activity Changelog at: /?project=${projectSlug}&view=logs\n`);
    return;
  } catch (d1Err) {
    // Fallback to local express API if direct D1 credentials not available
    try {
      const hubApiUrl = config.hubApiUrl || "http://localhost:5000";
      const result = await sendLogViaHttp(hubApiUrl, projectSlug, {
        scope,
        action,
        summary,
        promptUsed,
        changedFiles,
        commitId,
        featureKey: flags.feat || null,
        subTaskKey: flags.task || null,
      });

      if (result.success) {
        console.log(`\n✅ [Success] Log stored in Cloudflare D1 via Hub API!`);
      } else {
        console.error(`\n❌ Error storing log:`, result.error || d1Err.message);
      }
    } catch (httpErr) {
      console.error(`\n❌ Ingestion Error: ${d1Err.message}`);
    }
  }
};

runLogger();
