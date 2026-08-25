import fs from "fs";
import dotenv from "dotenv";
import { execSync } from "child_process";
import { queryD1 } from "./config/d1";

dotenv.config();

async function run() {
  console.log("⚡ Reading real Git commit timestamps from D:\\B2B\\rafflesia...");
  
  const RAFFLESIA_DIR = "D:\\B2B\\rafflesia";
  const gitCommitMap = new Map<string, { hash: string; date: string }>();

  if (fs.existsSync(RAFFLESIA_DIR)) {
    const gitOutput = execSync('git log --all --pretty=format:"%h|%ci|%s"', {
      cwd: RAFFLESIA_DIR,
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
          const cleanId = idMatch[1].toUpperCase().replace(/^RH\//, "").replace(/-/g, "");
          gitCommitMap.set(cleanId, { hash, date });
        }
        gitCommitMap.set(hash.toLowerCase(), { hash, date });
      }
    }
  }

  console.log(`📦 Loaded ${gitCommitMap.size} authentic git commit dates!`);

  // Fetch all logs for project rafflesia
  const allLogs = await queryD1(`SELECT id, commit_id, created_at FROM logs WHERE project_slug = 'rafflesia'`);
  let matchedCount = 0;

  for (const log of allLogs) {
    const cleanId = (log.id || "").toUpperCase().replace(/-/g, "");
    const gitEntry = gitCommitMap.get(cleanId) || (log.commit_id ? gitCommitMap.get(log.commit_id.toLowerCase()) : null);

    if (gitEntry) {
      matchedCount++;
      await queryD1(
        `UPDATE logs SET commit_id = ?, created_at = ? WHERE project_slug = 'rafflesia' AND id = ?`,
        [gitEntry.hash, gitEntry.date, log.id]
      );
    }
  }

  console.log(`✅ Synced ${matchedCount} logs to exact Git commit author dates!`);

  // Print top latest logs
  const topLogs = await queryD1(
    `SELECT id, scope, commit_id, summary, created_at FROM logs WHERE project_slug = 'rafflesia' ORDER BY created_at DESC LIMIT 10`
  );
  console.log("\n📋 Top 10 Latest Logs in Cloudflare D1:");
  console.table(topLogs);
}

run().catch(console.error);
