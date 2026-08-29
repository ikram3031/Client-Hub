import dotenv from "dotenv";

dotenv.config();

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || "";
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || "";
const DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID || "";

const D1_API_URL = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`;

/**
 * Execute SQL Query on Cloudflare D1 via REST API
 * @param sql - The SQL statement to run
 * @param params - Array of parameters for SQL binding
 * @returns Array of query result records
 */
export const queryD1 = async <T = any>(sql: string, params: any[] = []): Promise<T[]> => {
  try {
    const response = await fetch(D1_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sql,
        params,
      }),
    });

    const data: any = await response.json();

    if (!data.success) {
      const errorMsg = data.errors?.map((e: any) => e.message).join(", ") || "Cloudflare D1 Query Error";
      throw new Error(`[D1 Error]: ${errorMsg} (SQL: ${sql})`);
    }

    const result = data.result?.[0];
    return (result?.results || []) as T[];
  } catch (error: any) {
    console.error("[D1 Execution Error]:", error.message);
    throw error;
  }
};

/**
 * Execute raw D1 batch or statements
 * @param sql - The SQL statement to run
 * @param params - Query parameters
 */
export const executeD1 = async (sql: string, params: any[] = []) => {
  return queryD1(sql, params);
};

/**
 * Initialize all necessary SQLite tables on Cloudflare D1
 */
export const initD1Schema = async () => {
  console.log("⚡ [Cloudflare D1] Initializing Schema on docs-n-logs database...");

  // 1. Projects Table
  await queryD1(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT DEFAULT '',
      docs_categories TEXT DEFAULT '["Architecture","Frontend","Backend","Dashboard"]',
      log_scopes TEXT DEFAULT '["frontend","backend","dashboard"]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Docs Table
  await queryD1(`
    CREATE TABLE IF NOT EXISTS docs (
      id TEXT PRIMARY KEY,
      project_slug TEXT NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      slug TEXT NOT NULL,
      content TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      last_edited_by TEXT DEFAULT 'AI Assistant',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Features Table (JIRA-style Epics/Big Topics)
  await queryD1(`
    CREATE TABLE IF NOT EXISTS features (
      id TEXT PRIMARY KEY,
      project_slug TEXT NOT NULL,
      key TEXT NOT NULL,
      scope TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT DEFAULT 'todo',
      priority TEXT DEFAULT 'medium',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. SubTasks Table (JIRA-style Subtasks)
  await queryD1(`
    CREATE TABLE IF NOT EXISTS subtasks (
      id TEXT PRIMARY KEY,
      project_slug TEXT NOT NULL,
      key TEXT NOT NULL,
      feature_key TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'todo',
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 5. Action / AI Logs Table
  await queryD1(`
    CREATE TABLE IF NOT EXISTS logs (
      id TEXT NOT NULL,
      project_slug TEXT NOT NULL,
      scope TEXT NOT NULL,
      feature_key TEXT,
      sub_task_key TEXT,
      action TEXT DEFAULT 'feature',
      summary TEXT NOT NULL,
      prompt_used TEXT DEFAULT '',
      changed_files TEXT DEFAULT '[]',
      diff_summary TEXT DEFAULT '',
      commit_id TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (project_slug, id)
    );
  `);

  // 6. Master Clients Fleet Registry
  await queryD1(`
    CREATE TABLE IF NOT EXISTS clients (
      client_key TEXT PRIMARY KEY,
      brand_name TEXT NOT NULL,
      domain TEXT,
      vps_ip TEXT,
      api_url TEXT,
      dashboard_url TEXT,
      storefront_url TEXT,
      app_version TEXT DEFAULT '1.0.0',
      git_commit_hash TEXT DEFAULT '',
      last_deployed_at DATETIME,
      status TEXT DEFAULT 'healthy',
      disk_total_gb REAL DEFAULT 0,
      disk_used_gb REAL DEFAULT 0,
      disk_free_pct REAL DEFAULT 100,
      memory_rss_mb REAL DEFAULT 0,
      cpu_load_pct REAL DEFAULT 0,
      db_status TEXT DEFAULT 'unknown',
      hosting_package TEXT DEFAULT 'Standard VPS',
      hosting_start_date DATETIME,
      hosting_expiry_date DATETIME,
      hosting_billing_cycle TEXT DEFAULT 'yearly',
      hosting_status TEXT DEFAULT 'active',
      hosting_price_bdt REAL DEFAULT 0,
      policies_json TEXT DEFAULT '{}',
      last_heartbeat_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 7. Telemetry & Heartbeat Log History (Time-series)
  await queryD1(`
    CREATE TABLE IF NOT EXISTS heartbeat_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_key TEXT NOT NULL,
      vps_ip TEXT,
      db_status TEXT,
      disk_free_pct REAL,
      memory_rss_mb REAL,
      cpu_load_pct REAL,
      uptime_seconds INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 8. In-App Support Tickets & Bug Reports
  await queryD1(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_key TEXT NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      page_url TEXT,
      browser_info TEXT,
      error_logs_json TEXT DEFAULT '[]',
      screenshot_url TEXT DEFAULT '',
      priority TEXT DEFAULT 'normal',
      status TEXT DEFAULT 'open',
      resolution_notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME
    );
  `);

  // 9. Remote Operational Task Dispatch Queue
  await queryD1(`
    CREATE TABLE IF NOT EXISTS remote_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT UNIQUE NOT NULL,
      client_key TEXT NOT NULL,
      action_type TEXT NOT NULL,
      payload_json TEXT DEFAULT '{}',
      status TEXT DEFAULT 'pending',
      requested_by TEXT DEFAULT 'super_admin',
      execution_output TEXT DEFAULT '',
      duration_ms INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      started_at DATETIME,
      completed_at DATETIME
    );
  `);

  // 10. Hosting Alerts & Broadcast Banners
  await queryD1(`
    CREATE TABLE IF NOT EXISTS billing_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_key TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      banner_type TEXT DEFAULT 'warning',
      action_button_text TEXT,
      action_button_url TEXT,
      is_active INTEGER DEFAULT 1,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Indexes for high-speed queries
  await queryD1(`CREATE INDEX IF NOT EXISTS idx_heartbeats_client_time ON heartbeat_logs(client_key, created_at DESC);`);
  await queryD1(`CREATE INDEX IF NOT EXISTS idx_tasks_client_status ON remote_tasks(client_key, status);`);
  await queryD1(`CREATE INDEX IF NOT EXISTS idx_tickets_client_status ON support_tickets(client_key, status);`);

  console.log("✅ [Cloudflare D1] All Fleet and Core Tables initialized successfully!");
};
