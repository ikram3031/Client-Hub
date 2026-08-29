import { Router } from "express";
import { queryD1 } from "../config/d1";

export const ticketRouter = Router();

// 1. Ingest In-App Support Ticket from Client Dashboard
ticketRouter.post("/", async (req, res) => {
  try {
    const {
      clientKey,
      category,
      title,
      description,
      pageUrl,
      browserInfo,
      errorLogs,
      screenshotUrl,
      priority,
    } = req.body;

    if (!clientKey || !title || !description) {
      return res.status(422).json({
        success: false,
        error: "clientKey, title, and description are required fields",
      });
    }

    const nowIso = new Date().toISOString();

    await queryD1(
      `INSERT INTO support_tickets (
        client_key, category, title, description, page_url, browser_info,
        error_logs_json, screenshot_url, priority, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?)`,
      [
        clientKey,
        category || "general",
        title,
        description,
        pageUrl || "",
        browserInfo || "",
        JSON.stringify(errorLogs || []),
        screenshotUrl || "",
        priority || "normal",
        nowIso,
      ]
    );

    res.json({
      success: true,
      message: `Support ticket submitted successfully for client [${clientKey}]`,
      timestamp: nowIso,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. List Support Tickets (with filtering by clientKey, status, category)
ticketRouter.get("/", async (req, res) => {
  try {
    const { clientKey, status, priority, limit } = req.query;

    let sql = `SELECT * FROM support_tickets WHERE 1=1`;
    const params: any[] = [];

    if (clientKey) {
      sql += ` AND client_key = ?`;
      params.push(clientKey);
    }
    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }
    if (priority) {
      sql += ` AND priority = ?`;
      params.push(priority);
    }

    sql += ` ORDER BY id DESC LIMIT ?`;
    params.push(Number(limit) || 100);

    const rawTickets = await queryD1(sql, params);

    const tickets = rawTickets.map((t: any) => ({
      id: t.id,
      clientKey: t.client_key,
      category: t.category,
      title: t.title,
      description: t.description,
      pageUrl: t.page_url,
      browserInfo: t.browser_info,
      errorLogs: t.error_logs_json ? JSON.parse(t.error_logs_json) : [],
      screenshotUrl: t.screenshot_url,
      priority: t.priority,
      status: t.status,
      resolutionNotes: t.resolution_notes,
      createdAt: t.created_at,
      resolvedAt: t.resolved_at,
    }));

    res.json({ success: true, count: tickets.length, data: tickets });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Update Support Ticket Status & Resolution Notes (Super-Admin)
ticketRouter.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolutionNotes } = req.body;

    const nowIso = status === "resolved" || status === "closed" ? new Date().toISOString() : null;

    await queryD1(
      `UPDATE support_tickets
       SET status = COALESCE(?, status),
           resolution_notes = COALESCE(?, resolution_notes),
           resolved_at = COALESCE(?, resolved_at)
       WHERE id = ?`,
      [status || null, resolutionNotes || null, nowIso, id]
    );

    res.json({ success: true, message: `Ticket #${id} updated successfully` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
