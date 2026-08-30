import { Router } from "express";
import { queryD1 } from "../config/d1";
import { randomUUID } from "crypto";

export const fleetRouter = Router();

// Evaluates health based on last heartbeat timestamp and database status
const evaluateHealth = (lastHeartbeatIso?: string | null, dbStatus?: string): "healthy" | "degraded" | "offline" => {
  if (!lastHeartbeatIso) return "offline";
  const diffMs = Date.now() - new Date(lastHeartbeatIso).getTime();
  const diffMinutes = diffMs / (60 * 1000);

  if (diffMinutes > 5) return "offline";
  if (diffMinutes > 3 || dbStatus !== "connected") return "degraded";
  return "healthy";
};

// 1. Ingest Heartbeat Telemetry from Client VPS Agent
fleetRouter.post("/heartbeat", async (req, res) => {
  try {
    const hubSecret = req.headers["x-hub-secret"] || req.query.secret;
    const expectedSecret = process.env.HUB_SECRET || "wlecom-fleet-secret";

    if (hubSecret && hubSecret !== expectedSecret) {
      return res.status(401).json({ success: false, error: "Invalid hub secret" });
    }

    const {
      clientKey,
      brandName,
      domain,
      vpsIp,
      apiUrl,
      dashboardUrl,
      storefrontUrl,
      appVersion,
      gitCommitHash,
      diskTotalGb,
      diskUsedGb,
      diskFreePct,
      memoryRssMb,
      cpuLoadPct,
      dbStatus,
      uptimeSeconds,
      policies,
    } = req.body;

    if (!clientKey) {
      return res.status(422).json({ success: false, error: "clientKey is required" });
    }

    const nowIso = new Date().toISOString();
    const status = evaluateHealth(nowIso, dbStatus || "connected");

    // Upsert into clients table
    await queryD1(
      `INSERT INTO clients (
        client_key, brand_name, domain, vps_ip, api_url, dashboard_url, storefront_url,
        app_version, git_commit_hash, status, disk_total_gb, disk_used_gb, disk_free_pct,
        memory_rss_mb, cpu_load_pct, db_status, policies_json, last_heartbeat_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(client_key) DO UPDATE SET
        brand_name = COALESCE(excluded.brand_name, clients.brand_name),
        domain = COALESCE(excluded.domain, clients.domain),
        vps_ip = COALESCE(excluded.vps_ip, clients.vps_ip),
        api_url = COALESCE(excluded.api_url, clients.api_url),
        dashboard_url = COALESCE(excluded.dashboard_url, clients.dashboard_url),
        storefront_url = COALESCE(excluded.storefront_url, clients.storefront_url),
        app_version = COALESCE(excluded.app_version, clients.app_version),
        git_commit_hash = COALESCE(excluded.git_commit_hash, clients.git_commit_hash),
        status = excluded.status,
        disk_total_gb = COALESCE(excluded.disk_total_gb, clients.disk_total_gb),
        disk_used_gb = COALESCE(excluded.disk_used_gb, clients.disk_used_gb),
        disk_free_pct = COALESCE(excluded.disk_free_pct, clients.disk_free_pct),
        memory_rss_mb = COALESCE(excluded.memory_rss_mb, clients.memory_rss_mb),
        cpu_load_pct = COALESCE(excluded.cpu_load_pct, clients.cpu_load_pct),
        db_status = COALESCE(excluded.db_status, clients.db_status),
        policies_json = COALESCE(excluded.policies_json, clients.policies_json),
        last_heartbeat_at = excluded.last_heartbeat_at,
        updated_at = excluded.updated_at`,
      [
        clientKey,
        brandName || clientKey,
        domain || "",
        vpsIp || "",
        apiUrl || "",
        dashboardUrl || "",
        storefrontUrl || "",
        appVersion || "1.0.0",
        gitCommitHash || "",
        status,
        diskTotalGb || 0,
        diskUsedGb || 0,
        diskFreePct || 100,
        memoryRssMb || 0,
        cpuLoadPct || 0,
        dbStatus || "connected",
        JSON.stringify(policies || {}),
        nowIso,
        nowIso,
      ]
    );

    // Insert time-series log
    await queryD1(
      `INSERT INTO heartbeat_logs (
        client_key, vps_ip, db_status, disk_free_pct, memory_rss_mb, cpu_load_pct, uptime_seconds, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        clientKey,
        vpsIp || "",
        dbStatus || "connected",
        diskFreePct || 100,
        memoryRssMb || 0,
        cpuLoadPct || 0,
        uptimeSeconds || 0,
        nowIso,
      ]
    );

    // Check if there are pending tasks for this client to return in heartbeat response
    const pendingTasks = await queryD1(
      `SELECT * FROM remote_tasks WHERE client_key = ? AND status = 'pending' ORDER BY created_at ASC LIMIT 1`,
      [clientKey]
    );

    res.json({
      success: true,
      status,
      timestamp: nowIso,
      pendingTask: pendingTasks[0] || null,
    });
  } catch (err: any) {
    console.error("[Fleet Heartbeat Error]:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Get Fleet Overview (All Clients with Live Status & Version Matrix)
fleetRouter.get("/clients", async (_req, res) => {
  try {
    const rawClients = await queryD1(`SELECT * FROM clients ORDER BY client_key ASC`);

    const clients = rawClients.map((row: any) => {
      const dynamicStatus = evaluateHealth(row.last_heartbeat_at, row.db_status);
      return {
        clientKey: row.client_key,
        brandName: row.brand_name,
        domain: row.domain,
        vpsIp: row.vps_ip,
        apiUrl: row.api_url,
        dashboardUrl: row.dashboard_url,
        storefrontUrl: row.storefront_url,
        appVersion: row.app_version,
        gitCommitHash: row.git_commit_hash,
        lastDeployedAt: row.last_deployed_at,
        status: dynamicStatus,
        diskTotalGb: row.disk_total_gb,
        diskUsedGb: row.disk_used_gb,
        diskFreePct: row.disk_free_pct,
        memoryRssMb: row.memory_rss_mb,
        cpuLoadPct: row.cpu_load_pct,
        dbStatus: row.db_status,
        hostingPackage: row.hosting_package,
        hostingStartDate: row.hosting_start_date,
        hostingExpiryDate: row.hosting_expiry_date,
        hostingBillingCycle: row.hosting_billing_cycle,
        hostingStatus: row.hosting_status,
        hostingPriceBdt: row.hosting_price_bdt,
        policies: row.policies_json ? JSON.parse(row.policies_json) : {},
        lastHeartbeatAt: row.last_heartbeat_at,
        updatedAt: row.updated_at,
      };
    });

    const summary = {
      total: clients.length,
      healthy: clients.filter((c) => c.status === "healthy").length,
      degraded: clients.filter((c) => c.status === "degraded").length,
      offline: clients.filter((c) => c.status === "offline").length,
      avgDiskUsagePct:
        clients.length > 0
          ? Math.round(
              clients.reduce((acc, c) => acc + (100 - (c.diskFreePct || 100)), 0) / clients.length
            )
          : 0,
    };

    res.json({ success: true, summary, data: clients });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Get Single Client Details & Telemetry History
fleetRouter.get("/clients/:clientKey", async (req, res) => {
  try {
    const { clientKey } = req.params;
    const clientRows = await queryD1(`SELECT * FROM clients WHERE client_key = ?`, [clientKey]);

    if (!clientRows || clientRows.length === 0) {
      return res.status(404).json({ success: false, error: "Client not found" });
    }

    const history = await queryD1(
      `SELECT * FROM heartbeat_logs WHERE client_key = ? ORDER BY id DESC LIMIT 50`,
      [clientKey]
    );

    const client = clientRows[0];
    res.json({
      success: true,
      data: {
        ...client,
        policies: client.policies_json ? JSON.parse(client.policies_json) : {},
        status: evaluateHealth(client.last_heartbeat_at, client.db_status),
      },
      history,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Dispatch a Remote Operational Task (Super-Admin)
fleetRouter.post("/tasks", async (req, res) => {
  try {
    const { clientKey, actionType, payload, requestedBy } = req.body;

    const allowedActions = [
      "DEPLOY_LATEST",
      "BACKUP_DATABASE",
      "RESTART_BACKEND",
      "RESTART_DASHBOARD",
      "FLUSH_CACHE",
    ];

    if (!clientKey || !actionType) {
      return res.status(422).json({ success: false, error: "clientKey and actionType are required" });
    }

    if (!allowedActions.includes(actionType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid actionType. Must be one of: ${allowedActions.join(", ")}`,
      });
    }

    const taskId = `task_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
    const nowIso = new Date().toISOString();

    await queryD1(
      `INSERT INTO remote_tasks (task_id, client_key, action_type, payload_json, status, requested_by, created_at)
       VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
      [taskId, clientKey, actionType, JSON.stringify(payload || {}), requestedBy || "super_admin", nowIso]
    );

    res.json({
      success: true,
      message: `Task [${actionType}] queued for client [${clientKey}]`,
      taskId,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Agent Updates Task Status and Execution Logs
fleetRouter.post("/tasks/:taskId/status", async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, executionOutput, durationMs } = req.body;

    const nowIso = new Date().toISOString();

    await queryD1(
      `UPDATE remote_tasks
       SET status = ?, execution_output = ?, duration_ms = ?, completed_at = ?
       WHERE task_id = ?`,
      [status || "completed", executionOutput || "", durationMs || 0, nowIso, taskId]
    );

    res.json({ success: true, message: `Task [${taskId}] updated to [${status}]` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
