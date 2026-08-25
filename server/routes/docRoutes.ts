import { Router, Request, Response } from "express";
import { queryD1 } from "../config/d1";
import { randomUUID } from "crypto";

export const docRouter = Router({ mergeParams: true });

// 1. GET /api/projects/:projectSlug/docs - List docs
docRouter.get("/", async (req: Request, res: Response) => {
  try {
    const projectSlug = req.params.projectSlug as string;
    const { category } = req.query;

    let sql = `SELECT * FROM docs WHERE project_slug = ?`;
    const params: any[] = [projectSlug];

    if (category) {
      sql += ` AND LOWER(category) = LOWER(?)`;
      params.push(category);
    }

    sql += ` ORDER BY updated_at DESC`;

    const docs = await queryD1(sql, params);
    const formatted = docs.map((d: any) => ({
      ...d,
      tags: JSON.parse(d.tags || "[]"),
    }));

    res.json({ success: true, docs: formatted });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. POST /api/projects/:projectSlug/docs - Create doc
docRouter.post("/", async (req: Request, res: Response) => {
  try {
    const projectSlug = req.params.projectSlug as string;
    const { category, title, content, tags, lastEditedBy } = req.body;

    if (!category || !title) {
      return res.status(400).json({ success: false, error: "Category and title are required" });
    }

    const docId = randomUUID();
    const slug = title.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "-");

    await queryD1(
      `INSERT INTO docs (id, project_slug, category, title, slug, content, tags, last_edited_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [docId, projectSlug, category, title, slug, content || "", JSON.stringify(tags || []), lastEditedBy || "AI Assistant"]
    );

    const created = await queryD1(`SELECT * FROM docs WHERE id = ?`, [docId]);
    res.status(201).json({
      success: true,
      doc: { ...created[0], tags: JSON.parse(created[0].tags || "[]") },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2.5 GET /api/projects/:projectSlug/docs/:docId - Get single doc by ID or Slug
docRouter.get("/:docId", async (req: Request, res: Response) => {
  try {
    const projectSlug = req.params.projectSlug as string;
    const docId = req.params.docId as string;

    const docs = await queryD1(
      `SELECT * FROM docs WHERE (id = ? OR slug = ?) AND project_slug = ? LIMIT 1`,
      [docId, docId, projectSlug]
    );

    if (docs.length === 0) {
      return res.status(404).json({ success: false, error: "Document not found" });
    }

    const d = docs[0];
    res.json({
      success: true,
      doc: { ...d, tags: JSON.parse(d.tags || "[]") },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. PUT /api/projects/:projectSlug/docs/:docId - Update doc
docRouter.put("/:docId", async (req: Request, res: Response) => {
  try {
    const projectSlug = req.params.projectSlug as string;
    const docId = req.params.docId as string;
    const { title, content, category, tags, lastEditedBy } = req.body;

    const existing = await queryD1(
      `SELECT * FROM docs WHERE (id = ? OR slug = ?) AND project_slug = ? LIMIT 1`,
      [docId, docId, projectSlug]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: "Document not found" });
    }

    const current = existing[0];
    const targetId = current.id;
    const newTitle = title || current.title;
    const newContent = content !== undefined ? content : current.content;
    const newCategory = category || current.category;
    const newTags = tags ? JSON.stringify(tags) : current.tags;
    const newEditor = lastEditedBy || "AI Assistant";

    await queryD1(
      `UPDATE docs SET title = ?, content = ?, category = ?, tags = ?, last_edited_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [newTitle, newContent, newCategory, newTags, newEditor, targetId]
    );

    const updated = await queryD1(`SELECT * FROM docs WHERE id = ?`, [targetId]);
    res.json({
      success: true,
      doc: { ...updated[0], tags: JSON.parse(updated[0].tags || "[]") },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. DELETE /api/projects/:projectSlug/docs/:docId - Delete doc
docRouter.delete("/:docId", async (req: Request, res: Response) => {
  try {
    const projectSlug = req.params.projectSlug as string;
    const docId = req.params.docId as string;

    await queryD1(
      `DELETE FROM docs WHERE (id = ? OR slug = ?) AND project_slug = ?`,
      [docId, docId, projectSlug]
    );
    res.json({ success: true, message: "Document deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
