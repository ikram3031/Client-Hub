import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { execSync } from "child_process";
import { queryD1, initD1Schema } from "./config/d1";
import { randomUUID } from "crypto";

dotenv.config();

const AFULL_DIR = "F:\\AFull";
const PROJECT_SLUG = "wl-ecom";
const PROJECT_NAME = "WL-Ecom";

interface ParsedLog {
  id: string;
  scope: string;
  action: string;
  summary: string;
  changedFiles: string[];
  promptUsed: string;
  commitId: string;
  createdAt: string;
}

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
};

const extractTitle = (content: string, fallback: string): string => {
  const match = content.match(/^#\s+(.+)$/m);
  if (match) return match[1].trim();
  const cleanFallback = fallback.replace(/^\d+[-_]/, "").replace(/\.md$/i, "").replace(/[-_]/g, " ");
  return cleanFallback.charAt(0).toUpperCase() + cleanFallback.slice(1);
};

const determineCategory = (relPath: string): string => {
  const normalized = relPath.toLowerCase().replace(/\\/g, "/");
  if (normalized.includes("arch")) return "Architecture";
  if (normalized.includes("backend")) return "Backend";
  if (normalized.includes("dashboard")) return "Dashboard";
  if (normalized.includes("deployment") || normalized.includes("vps")) return "Deployment";
  if (normalized.includes("decantre")) return "Decantre";
  if (normalized.includes("engulfic")) return "Engulfic";
  if (normalized.includes("toyoland")) return "Toyoland";
  if (normalized.includes("frontend")) return "Frontend Guide";
  if (normalized.includes("pipeline") || normalized.includes("r2") || normalized.includes("upload")) return "Pipeline";
  if (normalized.includes("backup")) return "Operations";
  return "Architecture";
};

const parseArchitectureLogs = (filePath: string): ParsedLog[] => {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const logs: ParsedLog[] = [];

  let currentLog: Partial<ParsedLog> | null = null;
  let currentSection = "";

  const finalizeLog = () => {
    if (currentLog && currentLog.id && currentLog.summary) {
      logs.push({
        id: currentLog.id,
        scope: currentLog.scope || "architecture",
        action: currentLog.action || "feat",
        summary: currentLog.summary,
        changedFiles: currentLog.changedFiles || [],
        promptUsed: (currentLog.promptUsed || "").trim(),
        commitId: currentLog.commitId || "",
        createdAt: currentLog.createdAt || "2026-08-25 12:00:00",
      });
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const headerMatch = line.match(/^#\s+\[([A-Za-z0-9_-]+)\]\s*(.+)$/i);

    if (headerMatch) {
      finalizeLog();
      const rawId = headerMatch[1].toUpperCase();
      const summary = headerMatch[2].trim();
      currentLog = {
        id: rawId,
        scope: rawId.startsWith("AB") ? "backend" : rawId.startsWith("AD") ? "dashboard" : "architecture",
        action: "feat",
        summary: summary,
        changedFiles: [],
        promptUsed: "",
        commitId: "",
        createdAt: "2026-08-25",
      };
      currentSection = "";
      continue;
    }

    if (!currentLog) continue;

    if (line.match(/^##\s+Change Summary/i) || line.match(/^##\s+Requirements/i)) {
      currentSection = "summary";
      continue;
    }

    if (line.includes("- **Module**:") || line.includes("### Files changed")) {
      const match = line.match(/`([^`]+)`/g);
      if (match) {
        currentLog.changedFiles = match.map((m) => m.replace(/`/g, "").trim());
      }
    }

    currentLog.promptUsed = (currentLog.promptUsed || "") + "\n" + line;
  }

  finalizeLog();
  return logs;
};

async function run() {
  console.log("=================================================");
  console.log(`🚀 Ingesting WL-Ecom (AFull) Documentation & Logs into Cloudflare D1`);
  console.log("=================================================\n");

  await initD1Schema();

  const docsCategories = [
    "Architecture",
    "Backend",
    "Dashboard",
    "Deployment",
    "Frontend Guide",
    "Decantre",
    "Engulfic",
    "Toyoland",
    "Pipeline",
    "Operations",
  ];
  const logScopes = ["backend", "dashboard", "decantre", "engulfic", "toyoland", "architecture", "deployment"];

  // 1. Ensure WL-Ecom Project Registered
  const existingProject = await queryD1(`SELECT * FROM projects WHERE slug = ?`, [PROJECT_SLUG]);
  if (existingProject.length === 0) {
    console.log(`📦 Registering Project '${PROJECT_NAME}' (slug: ${PROJECT_SLUG})...`);
    await queryD1(
      `INSERT INTO projects (id, name, slug, description, docs_categories, log_scopes) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        PROJECT_NAME,
        PROJECT_SLUG,
        "White-Label Multi-Tenant E-Commerce & Inventory Management Platform (Decantre, Engulfic, Toyoland)",
        JSON.stringify(docsCategories),
        JSON.stringify(logScopes),
      ]
    );
  } else {
    console.log(`ℹ️ Project '${PROJECT_NAME}' already registered. Updating scopes & categories...`);
    await queryD1(
      `UPDATE projects SET name = ?, docs_categories = ?, log_scopes = ? WHERE slug = ?`,
      [PROJECT_NAME, JSON.stringify(docsCategories), JSON.stringify(logScopes), PROJECT_SLUG]
    );
  }

  // 2. Read Git Commits for Authentic Hashes & Dates
  const gitCommitMap = new Map<string, { hash: string; date: string }>();
  if (fs.existsSync(AFULL_DIR)) {
    try {
      const gitOutput = execSync('git log --all --pretty=format:"%h|%ci|%s"', {
        cwd: AFULL_DIR,
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "ignore"],
      });
      const lines = gitOutput.split("\n");
      for (const line of lines) {
        const parts = line.split("|");
        if (parts.length >= 3) {
          const hash = parts[0].trim();
          const rawDate = parts[1].trim();
          const d = new Date(rawDate);
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          const hh = String(d.getHours()).padStart(2, "0");
          const min = String(d.getMinutes()).padStart(2, "0");
          const ss = String(d.getSeconds()).padStart(2, "0");
          const date = `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;

          const subject = parts.slice(2).join("|").trim();
          const idMatch = /^(?:##\s*)?([A-Za-z0-9_/-]+)[:\s(]/i.exec(subject);
          if (idMatch) {
            const cleanId = idMatch[1].toUpperCase().replace(/-/g, "");
            gitCommitMap.set(cleanId, { hash, date });
          }
          gitCommitMap.set(hash.toLowerCase(), { hash, date });
        }
      }
      console.log(`📦 Loaded ${gitCommitMap.size} authentic git commit entries from AFull`);
    } catch (e) {
      console.warn("Could not read git log from AFull:", e);
    }
  }

  // 3. Scan & Ingest All Markdown Documentation Files
  const docsDir = path.join(AFULL_DIR, "Docs");
  let docsIngestedCount = 0;

  function scanDocFiles(dir: string, baseDir: string): string[] {
    let files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(scanDocFiles(fullPath, baseDir));
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(fullPath);
      }
    }
    return files;
  }

  const allDocFiles = scanDocFiles(docsDir, docsDir);
  console.log(`\n📚 Discovered ${allDocFiles.length} documentation files in ${docsDir}:`);

  for (const docPath of allDocFiles) {
    const relPath = path.relative(docsDir, docPath);
    // Skip changelog files from general docs (they are ingested as logs)
    if (relPath.includes("ARCH\\A01") || relPath.includes("ARCH/A01") || relPath.includes("backend\\AB01") || relPath.includes("backend/AB01")) {
      continue;
    }

    const content = fs.readFileSync(docPath, "utf-8");
    const title = extractTitle(content, path.basename(docPath));
    const category = determineCategory(relPath);
    const docSlug = slugify(path.basename(docPath, ".md"));

    await queryD1(`DELETE FROM docs WHERE project_slug = ? AND slug = ?`, [PROJECT_SLUG, docSlug]);

    const tags = [category.toLowerCase(), PROJECT_SLUG];
    if (relPath.includes(path.sep)) {
      tags.push(path.dirname(relPath).toLowerCase().replace(/[\\/]/g, "-"));
    }

    await queryD1(
      `INSERT INTO docs (id, project_slug, category, title, slug, content, tags, last_edited_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        PROJECT_SLUG,
        category,
        title,
        docSlug,
        content,
        JSON.stringify(tags),
        "Lead Architect",
      ]
    );

    console.log(`  ✅ [Doc Ingested] [${category}] ${title} (${docSlug})`);
    docsIngestedCount++;
  }

  // 4. Ingest Historical Logs from A01-100.md & AB01-200.md
  console.log(`\n🔍 Parsing Historical Action Logs...`);
  const archLogFile = path.join(docsDir, "ARCH", "A01-100.md");
  const backendLogFile = path.join(docsDir, "backend", "AB01-200.md");

  const archLogs = parseArchitectureLogs(archLogFile);
  const backendLogs = parseArchitectureLogs(backendLogFile);
  const allLogs = [...archLogs, ...backendLogs];

  console.log(`  Found ${archLogs.length} Architecture logs & ${backendLogs.length} Backend logs.`);

  let logsIngestedCount = 0;
  for (let idx = 0; idx < allLogs.length; idx++) {
    const log = allLogs[idx];
    const cleanKey = log.id.toUpperCase().replace(/-/g, "");

    const gitEntry = gitCommitMap.get(cleanKey) || (log.commitId ? gitCommitMap.get(log.commitId.toLowerCase()) : null);
    if (gitEntry) {
      log.commitId = gitEntry.hash;
      log.createdAt = gitEntry.date;
    } else {
      // Historical fallback descending time
      const reverseRank = allLogs.length - idx;
      const totalMinutes = 10 * 60 + Math.floor((reverseRank * (6 * 60)) / Math.max(1, allLogs.length));
      const hour = Math.floor(totalMinutes / 60);
      const minute = totalMinutes % 60;
      const second = (reverseRank * 17) % 60;
      const hh = String(hour).padStart(2, "0");
      const mm = String(minute).padStart(2, "0");
      const ss = String(second).padStart(2, "0");
      log.createdAt = `2026-08-25 ${hh}:${mm}:${ss}`;
    }

    const existing = await queryD1(`SELECT id FROM logs WHERE project_slug = ? AND id = ?`, [PROJECT_SLUG, log.id]);
    if (existing.length > 0) {
      await queryD1(
        `UPDATE logs SET scope = ?, summary = ?, changed_files = ?, prompt_used = ?, commit_id = ?, created_at = ? WHERE project_slug = ? AND id = ?`,
        [log.scope, log.summary, JSON.stringify(log.changedFiles), log.promptUsed, log.commitId, log.createdAt, PROJECT_SLUG, log.id]
      );
    } else {
      await queryD1(
        `INSERT INTO logs (id, project_slug, scope, action, summary, changed_files, prompt_used, commit_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          log.id,
          PROJECT_SLUG,
          log.scope,
          log.action,
          log.summary,
          JSON.stringify(log.changedFiles),
          log.promptUsed,
          log.commitId,
          log.createdAt,
        ]
      );
    }
    logsIngestedCount++;
  }

  console.log(`\n=================================================`);
  console.log(`🎉 Ingestion Completed!`);
  console.log(`   Total Docs Ingested: ${docsIngestedCount}`);
  console.log(`   Total Logs Ingested: ${logsIngestedCount}`);
  console.log(`   View Documentation:  http://144.79.218.241:5000/wl-ecom/docs`);
  console.log(`   View Action Logs:    http://144.79.218.241:5000/wl-ecom/logs`);
  console.log(`=================================================\n`);
}

run().catch(console.error);
