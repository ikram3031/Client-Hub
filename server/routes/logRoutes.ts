import { Router, Request, Response } from "express";
import { queryD1 } from "../config/d1";
import { randomUUID } from "crypto";

export const logRouter = Router({ mergeParams: true });

// Helper to determine prefix based on scope
const getScopePrefix = (scope?: string): string => {
  const s = (scope || "").toLowerCase();
  if (s === "backend" || s === "api") return "AB";
  if (s === "architecture" || s === "arch") return "AA";
  return "AD"; // default dashboard / frontend
};

// Generates next sequential LogID (e.g. AB01, AD76) from D1 logs
const getNextSequentialLogId = async (projectSlug: string, prefix: string): Promise<string> => {
  try {
    const existingLogs = await queryD1(
      `SELECT id FROM logs WHERE project_slug = ? AND id LIKE ?`,
      [projectSlug, `${prefix}%`]
    );

    let maxNum = 0;
    for (const log of existingLogs) {
      const match = new RegExp(`^${prefix}(\\d+)$`, "i").exec(log.id || "");
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

// Parses commit message structure: <LogID>(<type>): <description>
// e.g. "AD76(feat): add localstorage persistence and in-dropdown category search"
const parseCommitStandard = (text: string) => {
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

// 1. GET /api/projects/:projectSlug/logs - List all AI logs with filters
logRouter.get("/", async (req: Request, res: Response) => {
  try {
    const projectSlug = req.params.projectSlug as string;
    const { scope, featureKey, subTaskKey, limit } = req.query;

    let sql = `SELECT * FROM logs WHERE project_slug = ?`;
    const params: any[] = [projectSlug];

    if (scope) {
      sql += ` AND LOWER(scope) = LOWER(?)`;
      params.push(scope);
    }
    if (featureKey) {
      sql += ` AND feature_key = ?`;
      params.push(featureKey);
    }
    if (subTaskKey) {
      sql += ` AND sub_task_key = ?`;
      params.push(subTaskKey);
    }

    const maxLimit = parseInt(limit as string, 10) || 100;
    sql += ` ORDER BY created_at DESC LIMIT ${maxLimit}`;

    const logs = await queryD1(sql, params);
    const formatted = logs.map((l: any) => ({
      ...l,
      changedFiles: JSON.parse(l.changed_files || "[]"),
    }));

    res.json({ success: true, count: formatted.length, logs: formatted });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. POST /api/projects/:projectSlug/logs - AI Log ingestion endpoint with sequential <LogID> standard
logRouter.post("/", async (req: Request, res: Response) => {
  try {
    const projectSlug = req.params.projectSlug as string;
    let { id, logId, scope, featureKey, subTaskKey, action, summary, promptUsed, changedFiles, diffSummary, commitId } = req.body;

    if (!summary && !req.body.message) {
      return res.status(400).json({ success: false, error: "Summary or commit message is required" });
    }

    const rawMessage = (summary || req.body.message || "").trim();
    const parsed = parseCommitStandard(rawMessage);

    let finalLogId = id || logId || (parsed ? parsed.logId : null);
    let finalScope = scope || (parsed ? parsed.scope : "frontend");
    let finalAction = action || (parsed ? parsed.type : "feat");
    let finalSummary = parsed ? parsed.description : rawMessage;

    // If no LogID provided, calculate next sequential ID based on scope (e.g. AB01, AD01, AA01)
    const prefix = getScopePrefix(finalScope);
    if (!finalLogId) {
      finalLogId = await getNextSequentialLogId(projectSlug, prefix);
    } else {
      finalLogId = String(finalLogId).toUpperCase().trim();
      // Check if provided Log ID is already in use in this project; if so, assign next available ID
      const existing = await queryD1(`SELECT id FROM logs WHERE project_slug = ? AND id = ?`, [projectSlug, finalLogId]);
      if (existing.length > 0) {
        finalLogId = await getNextSequentialLogId(projectSlug, prefix);
      }
    }

    const cleanFeatureKey = featureKey ? String(featureKey).toUpperCase() : null;
    const cleanSubTaskKey = subTaskKey ? String(subTaskKey).toUpperCase() : null;
    const cleanFiles = Array.isArray(changedFiles) ? changedFiles : [];

    // Auto-create Feature if key provided
    if (cleanFeatureKey) {
      const featExists = await queryD1(`SELECT * FROM features WHERE project_slug = ? AND key = ?`, [projectSlug, cleanFeatureKey]);
      if (featExists.length === 0) {
        await queryD1(
          `INSERT INTO features (id, project_slug, key, scope, title, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [randomUUID(), projectSlug, cleanFeatureKey, finalScope.toLowerCase(), `Feature ${cleanFeatureKey}`, "Auto-created by AI Log Ingestion", "in_progress"]
        );
      }
    }

    // Auto-create SubTask if key provided
    if (cleanSubTaskKey && cleanFeatureKey) {
      const taskExists = await queryD1(`SELECT * FROM subtasks WHERE project_slug = ? AND key = ?`, [projectSlug, cleanSubTaskKey]);
      if (taskExists.length === 0) {
        await queryD1(
          `INSERT INTO subtasks (id, project_slug, key, feature_key, title, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [randomUUID(), projectSlug, cleanSubTaskKey, cleanFeatureKey, `Task ${cleanSubTaskKey}`, "in_progress", "Auto-created by AI Log Ingestion"]
        );
      }
    }

    await queryD1(
      `INSERT INTO logs (id, project_slug, scope, feature_key, sub_task_key, action, summary, prompt_used, changed_files, diff_summary, commit_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalLogId,
        projectSlug,
        finalScope.toLowerCase(),
        cleanFeatureKey,
        cleanSubTaskKey,
        finalAction || "feat",
        finalSummary,
        promptUsed || "",
        JSON.stringify(cleanFiles),
        diffSummary || "",
        commitId || "",
      ]
    );

    const created = await queryD1(`SELECT * FROM logs WHERE id = ?`, [finalLogId]);
    res.status(201).json({
      success: true,
      message: `Log ${finalLogId} stored in Cloudflare D1`,
      log: { ...created[0], changedFiles: JSON.parse(created[0].changed_files || "[]") },
    });
  } catch (error: any) {
    console.error("[AI Log Ingestion Error]:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. DELETE /api/projects/:projectSlug/logs/:logId - Delete single log entry
logRouter.delete("/:logId", async (req: Request, res: Response) => {
  try {
    const projectSlug = req.params.projectSlug as string;
    const logId = req.params.logId as string;

    await queryD1(`DELETE FROM logs WHERE project_slug = ? AND id = ?`, [projectSlug, logId]);
    res.json({ success: true, message: `Log ${logId} deleted successfully` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

