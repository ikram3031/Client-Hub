import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { queryD1, initD1Schema } from "./config/d1";
import { randomUUID } from "crypto";

dotenv.config();

const B2B_LOGS_DIR = "D:\\B2B\\Logs";
const PROJECT_SLUG = "rafflesia";
const PROJECT_NAME = "Rafflesia";

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

const capitalize = (str: string) => {
  if (!str) return "";
  const trimmed = str.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

const cleanFilePath = (line: string): string => {
  let cleaned = line.trim().replace(/^[-*•\d.]+\s*/, "");
  // If markdown link [text](url), extract text
  const linkMatch = /\[([^\]]+)\]\([^)]+\)/.exec(cleaned);
  if (linkMatch) {
    cleaned = linkMatch[1];
  }
  // Remove backticks and (Modified)/(Created) annotations
  cleaned = cleaned.replace(/`/g, "").replace(/\s*\((Modified|Created|NEW|Deleted)\)\s*/gi, "").trim();
  // Remove file:/// URL prefix or full drive path
  cleaned = cleaned.replace(/^file:\/\/\/[a-zA-Z]:\/[^/]+\//, "");
  // If still contains absolute path, strip d:/...
  cleaned = cleaned.replace(/^[a-zA-Z]:[/\\][^/\\]+[/\\]/, "");
  // Split on dash if description follows (e.g. `src/...` — Added login handler)
  if (cleaned.includes(" — ")) {
    cleaned = cleaned.split(" — ")[0].trim();
  }
  return cleaned.trim();
};

/**
 * Parses markdown log files matching specific track log ID prefixes
 */
const parseMarkdownLogFile = (filePath: string, defaultScope: string): ParsedLog[] => {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return [];
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const logs: ParsedLog[] = [];

  let currentLog: Partial<ParsedLog> | null = null;
  let currentSection: string = "";
  let filesList: string[] = [];
  let notesList: string[] = [];
  let reqsList: string[] = [];

  const finalizeLog = () => {
    if (
      currentLog &&
      currentLog.id &&
      !currentLog.id.includes("--") &&
      currentLog.id !== "ANY" &&
      !currentLog.summary?.toLowerCase().includes("title of the implementation")
    ) {
      logs.push({
        id: currentLog.id,
        scope: currentLog.scope || defaultScope,
        action: currentLog.action || "feat",
        summary: capitalize(currentLog.summary || `Update for ${currentLog.id}`),
        changedFiles: filesList.filter(Boolean),
        promptUsed: notesList.join("\n").trim() || reqsList.join("\n").trim() || "",
        commitId: currentLog.commitId || "",
        createdAt: currentLog.createdAt || new Date().toISOString().replace("T", " ").slice(0, 19),
      });
    }
    currentLog = null;
    currentSection = "";
    filesList = [];
    notesList = [];
    reqsList = [];
  };

  // Precise Log ID matching: ITC-XX, SMXX, RH/RXX, RXX, O-XX, OXX, FBXX, TL-XX, TLXX
  const logHeaderRegex = /^(?:##|###)\s+((?:ITC|SM|RH\/R|R|O|FB|TL)[-\d]+)[:\s]+(.+)$/i;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Skip example template instructions
    if (line.includes("Title of the implementation") || line.includes("AI Instructions")) {
      continue;
    }

    const headerMatch = logHeaderRegex.exec(line);

    if (headerMatch) {
      finalizeLog();

      let logId = headerMatch[1].replace(/^RH\//i, "").trim().toUpperCase();
      let summary = headerMatch[2].trim();

      if (logId.includes("--") || summary.toLowerCase().includes("title of the implementation")) {
        continue;
      }

      // If summary has date in parentheses at end (e.g. Shared Login Helper (2026-08-02))
      let dateStr = "";
      const dateInParens = /\((202\d-\d{2}-\d{2})\)$/.exec(summary);
      if (dateInParens) {
        dateStr = dateInParens[1];
        summary = summary.replace(/\s*\((202\d-\d{2}-\d{2})\)$/, "").trim();
      }

      currentLog = {
        id: logId,
        scope: defaultScope,
        action: "feat",
        summary: summary,
        createdAt: dateStr ? `${dateStr}` : "",
      };
      continue;
    }

    if (!currentLog) continue;

    // Commit Hash
    const commitMatch = /\*\*Commit Hash:\*\*\s*`?([a-zA-Z0-9]+)`?/i.exec(line);
    if (commitMatch) {
      currentLog.commitId = commitMatch[1];
      continue;
    }

    // Date line (e.g. ### Date: 2026-08-09 or Date: 24 Aug, 2026)
    const dateMatch = /(?:###\s*)?Date:\s*(.+)$/i.exec(line);
    if (dateMatch && !currentLog.createdAt) {
      const rawDate = dateMatch[1].trim();
      try {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          currentLog.createdAt = `${yyyy}-${mm}-${dd}`;
        }
      } catch (e) {}
      continue;
    }

    // Sections tracking
    if (/^###?\s*(Files changed|Files Modified)/i.test(line)) {
      currentSection = "files";
      continue;
    } else if (/^###?\s*(Requirements|Requirement)/i.test(line) || /^\*\*Requirements?:\*\*/i.test(line)) {
      currentSection = "requirements";
      const inlineReq = line.replace(/^(?:###?\s*)?\*{0,2}Requirements?:\*{0,2}\s*/i, "").trim();
      if (inlineReq) reqsList.push(inlineReq);
      continue;
    } else if (/^###?\s*(Any notes or comment|Overview|Changes|Code Audit)/i.test(line)) {
      currentSection = "notes";
      continue;
    }

    // Accumulate section items
    if (currentSection === "files") {
      if (line.startsWith("-") || line.startsWith("*") || /^\d+\./.test(line)) {
        const f = cleanFilePath(line);
        if (f && (f.includes(".") || f.includes("/"))) {
          filesList.push(f);
        }
      }
    } else if (currentSection === "requirements") {
      if (line.startsWith("-") || line.startsWith("*") || line.length > 5) {
        reqsList.push(line.replace(/^[-*•]\s*/, ""));
      }
    } else if (currentSection === "notes") {
      if (line && !line.startsWith("#")) {
        notesList.push(line);
      }
    }
  }

  finalizeLog();
  return logs;
};

const runMigration = async () => {
  console.log("=================================================");
  console.log("🚀 Starting Ingestion of D:\\B2B\\Logs into Cloudflare D1");
  console.log("=================================================\n");

  await initD1Schema();

  // Completely clean all previous logs for project before re-ingesting fresh parsed logs
  await queryD1(`DELETE FROM logs WHERE project_slug = ?`, [PROJECT_SLUG]);

  // 1. Onboard / Ensure Project 'rafflesia'
  const logScopes = ["itc", "serimachan", "projectsetup", "optimization", "flightbangla", "tripleader"];
  const docsCategories = ["Architecture", "Audit"];

  const existingProject = await queryD1(`SELECT * FROM projects WHERE slug = ?`, [PROJECT_SLUG]);
  if (existingProject.length === 0) {
    console.log(`📦 Creating Project '${PROJECT_NAME}' (slug: ${PROJECT_SLUG})...`);
    await queryD1(
      `INSERT INTO projects (id, name, slug, description, docs_categories, log_scopes) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        PROJECT_NAME,
        PROJECT_SLUG,
        "Rafflesia B2B Multi-tenant Travel Booking Frontend Platform",
        JSON.stringify(docsCategories),
        JSON.stringify(logScopes),
      ]
    );
  } else {
    console.log(`ℹ️ Project '${PROJECT_NAME}' already registered. Updating scopes...`);
    await queryD1(
      `UPDATE projects SET docs_categories = ?, log_scopes = ? WHERE slug = ?`,
      [JSON.stringify(docsCategories), JSON.stringify(logScopes), PROJECT_SLUG]
    );
  }

  // 2. Ingest Architecture Document (Architechture.md)
  const archFile = path.join(B2B_LOGS_DIR, "Architechture.md");
  if (fs.existsSync(archFile)) {
    console.log(`📄 Ingesting 'Architechture.md' -> Docs...`);
    const archContent = fs.readFileSync(archFile, "utf-8");
    const docId = randomUUID();
    const docSlug = "frontend-architecture";

    await queryD1(`DELETE FROM docs WHERE project_slug = ? AND slug = ?`, [PROJECT_SLUG, docSlug]);

    await queryD1(
      `INSERT INTO docs (id, project_slug, category, title, slug, content, tags, last_edited_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        docId,
        PROJECT_SLUG,
        "Architecture",
        "Rafflesia — Frontend Architecture & Stack",
        docSlug,
        archContent,
        JSON.stringify(["architecture", "stack", "redux", "multi-tenant", "vite"]),
        "Lead Architect",
      ]
    );
    console.log(`✅ [Doc Ingested] Rafflesia Frontend Architecture`);
  }

  // 3. Ingest FlySeri Audit Report (SeriMachan/FlyseriAuditReport.md)
  const auditFile = path.join(B2B_LOGS_DIR, "SeriMachan", "FlyseriAuditReport.md");
  if (fs.existsSync(auditFile)) {
    console.log(`📄 Ingesting 'FlyseriAuditReport.md' -> Docs...`);
    const auditContent = fs.readFileSync(auditFile, "utf-8");
    const docId = randomUUID();
    const docSlug = "flyseri-audit-report";

    await queryD1(`DELETE FROM docs WHERE project_slug = ? AND slug = ?`, [PROJECT_SLUG, docSlug]);

    await queryD1(
      `INSERT INTO docs (id, project_slug, category, title, slug, content, tags, last_edited_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        docId,
        PROJECT_SLUG,
        "Audit",
        "FlySeri Brand UI & Performance Audit Report",
        docSlug,
        auditContent,
        JSON.stringify(["audit", "flyseri", "serimachan", "performance"]),
        "Lead Architect",
      ]
    );
    console.log(`✅ [Doc Ingested] FlySeri Brand Audit Report`);
  }

  // 4. Ingest All Track Logs
  const logFilesToParse = [
    { file: path.join(B2B_LOGS_DIR, "ITC", "ITC01-100.md"), scope: "itc" },
    { file: path.join(B2B_LOGS_DIR, "SeriMachan", "SM01-20.md"), scope: "serimachan" },
    { file: path.join(B2B_LOGS_DIR, "ProjectSetup", "R01-R20.md"), scope: "projectsetup" },
    { file: path.join(B2B_LOGS_DIR, "Optimization", "O01-O20.md"), scope: "optimization" },
    { file: path.join(B2B_LOGS_DIR, "FlightBangla", "FB01-20.md"), scope: "flightbangla" },
    { file: path.join(B2B_LOGS_DIR, "TripLeader", "TL01-TL100.md"), scope: "tripleader" },
  ];

  let totalParsed = 0;

  for (const track of logFilesToParse) {
    if (!fs.existsSync(track.file)) continue;

    const parsedLogs = parseMarkdownLogFile(track.file, track.scope);
    totalParsed += parsedLogs.length;

    console.log(`🔍 Cleanly parsed ${parsedLogs.length} logs for track '${track.scope}' (${path.basename(track.file)})...`);

    const totalLogsInTrack = parsedLogs.length;
    for (let idx = 0; idx < parsedLogs.length; idx++) {
      const log = parsedLogs[idx];
      
      // Calculate realistic descending Bangladesh Time (UTC+6)
      let dateBase = log.createdAt || "2026-08-25";
      if (dateBase.length === 10) {
        // e.g. "2026-08-25" -> distribute between 10:00 AM and 07:30 PM BD Time
        const reverseRank = totalLogsInTrack - idx; // Higher rank = later in the day
        const hour = 10 + Math.floor((reverseRank * 9) / Math.max(1, totalLogsInTrack));
        const minute = (reverseRank * 17) % 60;
        const second = (reverseRank * 23) % 60;
        const hh = String(hour).padStart(2, "0");
        const mm = String(minute).padStart(2, "0");
        const ss = String(second).padStart(2, "0");
        log.createdAt = `${dateBase} ${hh}:${mm}:${ss}`;
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
    }
  }

  console.log("\n=================================================");
  console.log(`🎉 Ingestion Completed!`);
  console.log(`   Total Logs Parsed & Ingested: ${totalParsed}`);
  console.log(`   View Documentation: http://localhost:5000/rafflesia/docs`);
  console.log(`   View Action Logs:   http://localhost:5000/rafflesia/logs`);
  console.log("=================================================\n");
};

runMigration().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
