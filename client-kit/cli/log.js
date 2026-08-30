#!/usr/bin/env node

/**
 * 🤖 ClientHub Rich AI Action Logger CLI (@ikram3031/clienthub-kit)
 * 
 * Auto-detects git commits, changed files, formats detailed multi-section
 * audit logs with requirements, key changes, and test notes, then pushes
 * live records to the central ClientHub (Live VPS / Cloudflare D1).
 */

const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");
const { execSync } = require("child_process");

const loadConfig = () => {
  const possiblePaths = [
    path.join(process.cwd(), "clienthub.config.json"),
    path.join(process.cwd(), "client-kit", "config.json"),
    path.join(process.cwd(), ".config", "clienthub.json"),
    path.join(__dirname, "..", "config.json"),
    path.join(__dirname, "config.json"),
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
    hubApiUrl: process.env.HUB_API_URL || process.env.CLIENTHUB_URL || "http://144.79.218.241:5000",
    clientKey: process.env.CLIENT_KEY || process.env.CLIENTHUB_KEY || "",
    apiKey: process.env.CLIENTHUB_API_KEY || process.env.CLIENT_SECRET_TOKEN || "",
    project: { name: "WL-Ecom", slug: "wl-ecom" },
    defaultScope: "backend",
    scopes: ["backend", "dashboard", "decantre", "engulfic", "toyoland", "architecture", "deployment"],
    prefixMap: {
      backend: "AB-",
      dashboard: "AD-",
      decantre: "DEC-",
      engulfic: "ENG-",
      toyoland: "TOY-",
      architecture: "AA-",
      deployment: "DEP-",
    },
  };
};

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

const getGitCommitHash = () => {
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch (e) {
    return "";
  }
};

const getLatestGitCommitMessage = () => {
  try {
    return execSync("git log -1 --pretty=%B", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
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
    const uncommitted = execSync("git diff --name-only HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
    if (uncommitted) {
      return uncommitted.split("\n").map((f) => f.trim()).filter(Boolean);
    }
  } catch (e) {}
  return [];
};

const detectScopeFromFiles = (files = []) => {
  const fileStr = files.join(" ").toLowerCase();
  if (fileStr.includes("backend")) return "backend";
  if (fileStr.includes("dashboard")) return "dashboard";
  if (fileStr.includes("decantre")) return "decantre";
  if (fileStr.includes("engulfic")) return "engulfic";
  if (fileStr.includes("toyoland")) return "toyoland";
  if (fileStr.includes("docker") || fileStr.includes("nginx") || fileStr.includes("deploy")) return "deployment";
  if (fileStr.includes("doc")) return "architecture";
  return "backend";
};

const parseCommitSyntax = (message = "") => {
  const trimmed = message.trim();
  const match = /^(?:##\s*)?([A-Za-z0-9_/-]+)(?:\(([^)]+)\))?:\s*(.+)$/i.exec(trimmed);

  if (match) {
    return {
      id: match[1].toUpperCase(),
      action: (match[2] || "feat").toLowerCase(),
      summary: match[3].trim(),
    };
  }
  return { id: "", action: "feat", summary: trimmed };
};

const capitalize = (str) => {
  if (!str) return "";
  const trimmed = str.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

const fetchExistingLogs = (hubUrl, projectSlug, token = "") => {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(`${hubUrl}/api/projects/${projectSlug}/logs?limit=250`);
      const client = parsed.protocol === "https:" ? https : http;

      const headers = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const req = client.get(parsed.href, { headers, timeout: 5000 }, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            const list = Array.isArray(json) ? json : (json.logs || []);
            resolve(list);
          } catch (e) {
            resolve([]);
          }
        });
      });

      req.on("error", () => resolve([]));
      req.on("timeout", () => {
        req.destroy();
        resolve([]);
      });
    } catch (e) {
      resolve([]);
    }
  });
};

const computeNextId = (scope, existingLogs = [], prefixMap = {}) => {
  const prefix = prefixMap[scope] || `${scope.toUpperCase().slice(0, 3)}-`;
  const regex = new RegExp(`^${prefix}(\\d+)`, "i");

  let maxNum = 0;
  for (const log of existingLogs) {
    const match = regex.exec(log.id);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }

  const nextNum = maxNum + 1;
  const numFormatted = nextNum < 10 ? `0${nextNum}` : `${nextNum}`;
  return `${prefix}${numFormatted}`;
};

const postLogToHub = (hubUrl, projectSlug, logPayload, token = "") => {
  return new Promise((resolve, reject) => {
    const parsed = new URL(`${hubUrl}/api/projects/${projectSlug}/logs`);
    const client = parsed.protocol === "https:" ? https : http;
    const bodyData = JSON.stringify(logPayload);

    const headers = {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(bodyData),
      "Accept": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      headers["x-client-secret"] = token;
    }

    const req = client.request(
      parsed.href,
      {
        method: "POST",
        headers,
        timeout: 10000,
      },
      (res) => {
        let respBody = "";
        res.on("data", (chunk) => (respBody += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(respBody);
            resolve({ statusCode: res.statusCode, data: json });
          } catch (e) {
            resolve({ statusCode: res.statusCode, raw: respBody });
          }
        });
      }
    );

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out after 10s"));
    });
    req.on("error", (err) => reject(err));
    req.write(bodyData);
    req.end();
  });
};

const run = async () => {
  const config = loadConfig();
  const { flags, positionalMessage } = parseArgs();

  const commitHash = flags.hash || getGitCommitHash();
  const latestGitMsg = getLatestGitCommitMessage();
  const rawMessage = positionalMessage || flags.summary || flags.message || latestGitMsg;

  if (!rawMessage || rawMessage.trim() === "" || rawMessage.toLowerCase().includes("initial commit")) {
    console.warn("⚠️ [SKIPPED] No commit message or summary provided. Empty logs are not recorded.");
    return;
  }

  const parsedMsg = parseCommitSyntax(rawMessage);
  let files = flags.files
    ? flags.files.split(",").map((f) => f.trim()).filter(Boolean)
    : getGitChangedFiles();

  const scope = (flags.scope || (parsedMsg.id.startsWith("AB") ? "backend" : parsedMsg.id.startsWith("AD") ? "dashboard" : parsedMsg.id.startsWith("DEC") ? "decantre" : parsedMsg.id.startsWith("ENG") ? "engulfic" : parsedMsg.id.startsWith("TOY") ? "toyoland" : parsedMsg.id.startsWith("DEP") ? "deployment" : parsedMsg.id.startsWith("AA") ? "architecture" : detectScopeFromFiles(files)) || config.defaultScope || "backend").toLowerCase();
  const action = (flags.action || parsedMsg.action || "feat").toLowerCase();
  const summary = capitalize(flags.summary || parsedMsg.summary || rawMessage);

  const token = flags.token || flags.apiKey || config.apiKey || config.clientSecret || "";
  let logId = flags.id || parsedMsg.id;
  if (!logId) {
    const existingLogs = await fetchExistingLogs(config.hubApiUrl, config.project.slug, token);
    logId = computeNextId(scope, existingLogs, config.prefixMap || {});
  }

  const reqs = flags.reqs || flags.prompt || flags.requirements || "";
  const changes = flags.changes || flags.details || "";
  const notes = flags.notes || flags.comment || "";
  const audit = flags.audit || flags.verify || "";

  const promptSections = [];
  if (reqs) promptSections.push(`### 📋 Requirements & Problem Statement\n${reqs}`);
  if (changes) promptSections.push(`### 🛠️ Key Implementation Changes\n${changes}`);
  if (notes) promptSections.push(`### 📝 Notes & Remarks\n${notes}`);
  if (audit) promptSections.push(`### 🔍 Verification & Testing\n${audit}`);

  const finalPromptUsed = promptSections.length > 0
    ? promptSections.join("\n\n")
    : reqs || rawMessage;

  const payload = {
    id: logId,
    scope,
    action,
    summary,
    prompt_used: finalPromptUsed,
    changed_files: files,
    commit_id: commitHash,
  };

  console.log("\n📡 ==========================================");
  console.log(`📝 ClientHub Action Logger — ${config.project.name || "Project"}`);
  console.log("==========================================\n");
  console.log(`📌 Target Project: ${config.project.name} (${config.project.slug})`);
  console.log(`🏷️  Log Entry:     [#${payload.id}] (${payload.scope}/${payload.action})`);
  console.log(`💬 Summary:       ${payload.summary}`);
  console.log(`📂 Changed Files: ${payload.changed_files.length} files`);
  if (payload.commit_id) console.log(`🔗 Commit Hash:   ${payload.commit_id}`);
  console.log(`🌐 Primary Hub:   ${config.hubApiUrl}/api/projects/${config.project.slug}/logs\n`);

  try {
    const res = await postLogToHub(config.hubApiUrl, config.project.slug, payload, token);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log(`✅ [SUCCESS] Log #${payload.id} successfully recorded in ClientHub!`);
      console.log(`🔗 View Live: ${config.hubApiUrl}/${config.project.slug}/logs\n`);
      return;
    } else {
      console.error(`❌ [ERROR ${res.statusCode}]:`, res.data || res.raw);
    }
  } catch (err) {
    console.error(`❌ Could not reach ClientHub at ${config.hubApiUrl}: ${err.message}`);
  }
};

run().catch((e) => console.error("Logger error:", e));
