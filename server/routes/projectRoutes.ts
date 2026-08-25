import { Router, Request, Response } from "express";
import { queryD1 } from "../config/d1";
import { randomUUID } from "crypto";

export const projectRouter = Router();

// 1. GET /api/projects - List all onboarded projects
projectRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const projects = await queryD1(`SELECT * FROM projects ORDER BY created_at DESC`);
    const formatted = projects.map((p: any) => ({
      ...p,
      docsCategories: JSON.parse(p.docs_categories || "[]"),
      logScopes: JSON.parse(p.log_scopes || "[]"),
    }));
    res.json({ success: true, projects: formatted });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. POST /api/projects/onboard - Onboard a new project & seed initial structures in D1
projectRouter.post("/onboard", async (req: Request, res: Response) => {
  try {
    const { name, slug, description, docsCategories, logScopes } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: "Project name is required" });
    }

    const projectSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, "-");

    const existing = await queryD1(`SELECT * FROM projects WHERE slug = ?`, [projectSlug]);

    let project: any;
    const cats = docsCategories || ["Architecture", "Frontend", "Backend", "Dashboard"];
    const scopes = logScopes || ["frontend", "backend", "dashboard"];

    if (existing.length > 0) {
      project = existing[0];
    } else {
      const projectId = randomUUID();
      await queryD1(
        `INSERT INTO projects (id, name, slug, description, docs_categories, log_scopes) VALUES (?, ?, ?, ?, ?, ?)`,
        [projectId, name, projectSlug, description || "", JSON.stringify(cats), JSON.stringify(scopes)]
      );

      // Seed initial default docs
      for (const cat of cats) {
        const docId = randomUUID();
        const docSlug = `${cat.toLowerCase()}-overview`;
        const content = `# ${cat} Documentation for ${name}\n\nAdd your architectural designs, component structures, API schemas, and deployment instructions here.`;
        await queryD1(
          `INSERT INTO docs (id, project_slug, category, title, slug, content, tags, last_edited_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [docId, projectSlug, cat, `${cat} Overview & Guidelines`, docSlug, content, JSON.stringify([cat.toLowerCase(), "getting-started"]), "System Setup"]
        );
      }

      // Seed initial feature & task
      const featId = randomUUID();
      await queryD1(
        `INSERT INTO features (id, project_slug, key, scope, title, description, status, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [featId, projectSlug, "FEAT-1", "backend", "Project Initialization on Cloudflare D1", `Automatic schema initialization on D1 for ${name}`, "done", "medium"]
      );

      const taskId = randomUUID();
      await queryD1(
        `INSERT INTO subtasks (id, project_slug, key, feature_key, title, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [taskId, projectSlug, "TASK-1-1", "FEAT-1", "D1 SQLite Table Provisioning", "done", "Completed during initial onboarding"]
      );

      const logId = randomUUID();
      await queryD1(
        `INSERT INTO logs (id, project_slug, scope, feature_key, sub_task_key, action, summary, changed_files) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [logId, projectSlug, "backend", "FEAT-1", "TASK-1-1", "config", `Project ${name} onboarded on Cloudflare D1 database (docs-n-logs)`, JSON.stringify(["d1.ts", "projectRoutes.ts"])]
      );

      const created = await queryD1(`SELECT * FROM projects WHERE id = ?`, [projectId]);
      project = created[0];
    }

    res.status(201).json({
      success: true,
      message: `Project ${name} onboarded on Cloudflare D1!`,
      project: {
        ...project,
        docsCategories: JSON.parse(project.docs_categories || "[]"),
        logScopes: JSON.parse(project.log_scopes || "[]"),
      },
    });
  } catch (error: any) {
    console.error("[Project Onboard Error]:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. GET /api/projects/:projectSlug - Single project details and counts
projectRouter.get("/:projectSlug", async (req: Request, res: Response) => {
  try {
    const projectSlug = req.params.projectSlug as string;
    const projects = await queryD1(`SELECT * FROM projects WHERE slug = ?`, [projectSlug]);

    if (projects.length === 0) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    const project = projects[0];
    const [docsCount, featuresCount, logsCount] = await Promise.all([
      queryD1(`SELECT COUNT(*) as count FROM docs WHERE project_slug = ?`, [projectSlug]),
      queryD1(`SELECT COUNT(*) as count FROM features WHERE project_slug = ?`, [projectSlug]),
      queryD1(`SELECT COUNT(*) as count FROM logs WHERE project_slug = ?`, [projectSlug]),
    ]);

    res.json({
      success: true,
      project: {
        ...project,
        docsCategories: JSON.parse(project.docs_categories || "[]"),
        logScopes: JSON.parse(project.log_scopes || "[]"),
      },
      stats: {
        docsCount: (docsCount[0] as any)?.count || 0,
        featuresCount: (featuresCount[0] as any)?.count || 0,
        logsCount: (logsCount[0] as any)?.count || 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. PUT /api/projects/:projectSlug - Update project metadata
projectRouter.put("/:projectSlug", async (req: Request, res: Response) => {
  try {
    const projectSlug = req.params.projectSlug as string;
    const { name, description, docsCategories, logScopes } = req.body;

    const existing = await queryD1(`SELECT * FROM projects WHERE slug = ?`, [projectSlug]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    const current = existing[0];
    const newName = name || current.name;
    const newDesc = description !== undefined ? description : current.description;
    const newCats = docsCategories ? JSON.stringify(docsCategories) : current.docs_categories;
    const newScopes = logScopes ? JSON.stringify(logScopes) : current.log_scopes;

    await queryD1(
      `UPDATE projects SET name = ?, description = ?, docs_categories = ?, log_scopes = ?, updated_at = CURRENT_TIMESTAMP WHERE slug = ?`,
      [newName, newDesc, newCats, newScopes, projectSlug]
    );

    const updated = await queryD1(`SELECT * FROM projects WHERE slug = ?`, [projectSlug]);
    res.json({
      success: true,
      project: {
        ...updated[0],
        docsCategories: JSON.parse(updated[0].docs_categories || "[]"),
        logScopes: JSON.parse(updated[0].log_scopes || "[]"),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. DELETE /api/projects/:projectSlug - Delete project and cascade records
projectRouter.delete("/:projectSlug", async (req: Request, res: Response) => {
  try {
    const projectSlug = req.params.projectSlug as string;
    await Promise.all([
      queryD1(`DELETE FROM logs WHERE project_slug = ?`, [projectSlug]),
      queryD1(`DELETE FROM subtasks WHERE project_slug = ?`, [projectSlug]),
      queryD1(`DELETE FROM features WHERE project_slug = ?`, [projectSlug]),
      queryD1(`DELETE FROM docs WHERE project_slug = ?`, [projectSlug]),
      queryD1(`DELETE FROM projects WHERE slug = ?`, [projectSlug]),
    ]);

    res.json({ success: true, message: `Project ${projectSlug} deleted successfully` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

