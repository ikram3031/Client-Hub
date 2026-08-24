import { Router, Request, Response } from "express";
import { queryD1 } from "../config/d1";
import { randomUUID } from "crypto";

export const featureRouter = Router({ mergeParams: true });

// 1. GET /api/projects/:projectSlug/features - Get JIRA features tree with subtasks & logs
featureRouter.get("/", async (req: Request, res: Response) => {
  try {
    const projectSlug = req.params.projectSlug as string;
    const { scope, status } = req.query;

    let featSql = `SELECT * FROM features WHERE project_slug = ?`;
    const featParams: any[] = [projectSlug];

    if (scope) {
      featSql += ` AND LOWER(scope) = LOWER(?)`;
      featParams.push(scope);
    }
    if (status) {
      featSql += ` AND status = ?`;
      featParams.push(status);
    }

    featSql += ` ORDER BY created_at DESC`;

    const [features, subtasks, logs] = await Promise.all([
      queryD1(featSql, featParams),
      queryD1(`SELECT * FROM subtasks WHERE project_slug = ? ORDER BY created_at ASC`, [projectSlug]),
      queryD1(`SELECT * FROM logs WHERE project_slug = ? ORDER BY created_at DESC`, [projectSlug]),
    ]);

    const formattedLogs = logs.map((l: any) => ({
      ...l,
      changedFiles: JSON.parse(l.changed_files || "[]"),
    }));

    const enrichedFeatures = features.map((feat: any) => {
      const featSubtasks = subtasks
        .filter((st: any) => st.feature_key === feat.key)
        .map((st: any) => ({
          ...st,
          logs: formattedLogs.filter((log: any) => log.sub_task_key === st.key),
        }));

      const directLogs = formattedLogs.filter(
        (log: any) => log.feature_key === feat.key && !log.sub_task_key
      );

      return {
        ...feat,
        subTasks: featSubtasks,
        directLogs,
        totalLogsCount: formattedLogs.filter((l: any) => l.feature_key === feat.key).length,
      };
    });

    res.json({ success: true, features: enrichedFeatures });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. POST /api/projects/:projectSlug/features - Create Epic/Feature
featureRouter.post("/", async (req: Request, res: Response) => {
  try {
    const projectSlug = req.params.projectSlug as string;
    const { key, scope, title, description, priority, status } = req.body;

    if (!scope || !title) {
      return res.status(400).json({ success: false, error: "Scope and title are required" });
    }

    let featureKey = key;
    if (!featureKey) {
      const countRes = await queryD1(`SELECT COUNT(*) as count FROM features WHERE project_slug = ?`, [projectSlug]);
      const count = (countRes[0] as any)?.count || 0;
      featureKey = `FEAT-${count + 1}`;
    }

    const featId = randomUUID();
    await queryD1(
      `INSERT INTO features (id, project_slug, key, scope, title, description, priority, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [featId, projectSlug, featureKey.toUpperCase(), scope.toLowerCase(), title, description || "", priority || "medium", status || "todo"]
    );

    const created = await queryD1(`SELECT * FROM features WHERE id = ?`, [featId]);
    res.status(201).json({ success: true, feature: created[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. POST /api/projects/:projectSlug/features/:featureKey/subtasks - Create Subtask
featureRouter.post("/:featureKey/subtasks", async (req: Request, res: Response) => {
  try {
    const projectSlug = req.params.projectSlug as string;
    const featureKey = req.params.featureKey as string;
    const { key, title, notes, status } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: "Subtask title is required" });
    }

    const feature = await queryD1(`SELECT * FROM features WHERE project_slug = ? AND key = ?`, [projectSlug, featureKey.toUpperCase()]);
    if (feature.length === 0) {
      return res.status(404).json({ success: false, error: `Feature ${featureKey} not found` });
    }

    let subTaskKey = key;
    if (!subTaskKey) {
      const countRes = await queryD1(`SELECT COUNT(*) as count FROM subtasks WHERE project_slug = ? AND feature_key = ?`, [projectSlug, featureKey.toUpperCase()]);
      const count = (countRes[0] as any)?.count || 0;
      subTaskKey = `TASK-${featureKey.toUpperCase().replace("FEAT-", "")}-${count + 1}`;
    }

    const taskId = randomUUID();
    await queryD1(
      `INSERT INTO subtasks (id, project_slug, key, feature_key, title, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [taskId, projectSlug, subTaskKey.toUpperCase(), featureKey.toUpperCase(), title, status || "todo", notes || ""]
    );

    const created = await queryD1(`SELECT * FROM subtasks WHERE id = ?`, [taskId]);
    res.status(201).json({ success: true, subTask: created[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. PATCH /api/projects/:projectSlug/features/:featureKey - Update feature
featureRouter.patch("/:featureKey", async (req: Request, res: Response) => {
  try {
    const projectSlug = req.params.projectSlug as string;
    const featureKey = req.params.featureKey as string;
    const { title, status, priority, description } = req.body;

    const existing = await queryD1(`SELECT * FROM features WHERE project_slug = ? AND key = ?`, [projectSlug, featureKey.toUpperCase()]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: "Feature not found" });
    }

    const current = existing[0];
    await queryD1(
      `UPDATE features SET title = ?, status = ?, priority = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [title || current.title, status || current.status, priority || current.priority, description !== undefined ? description : current.description, current.id]
    );

    const updated = await queryD1(`SELECT * FROM features WHERE id = ?`, [current.id]);
    res.json({ success: true, feature: updated[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. PATCH /api/projects/:projectSlug/subtasks/:subTaskKey - Update subtask
featureRouter.patch("/subtasks/:subTaskKey", async (req: Request, res: Response) => {
  try {
    const projectSlug = req.params.projectSlug as string;
    const subTaskKey = req.params.subTaskKey as string;
    const { title, status, notes } = req.body;

    const existing = await queryD1(`SELECT * FROM subtasks WHERE project_slug = ? AND key = ?`, [projectSlug, subTaskKey.toUpperCase()]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: "Subtask not found" });
    }

    const current = existing[0];
    await queryD1(
      `UPDATE subtasks SET title = ?, status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [title || current.title, status || current.status, notes !== undefined ? notes : current.notes, current.id]
    );

    const updated = await queryD1(`SELECT * FROM subtasks WHERE id = ?`, [current.id]);
    res.json({ success: true, subTask: updated[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
