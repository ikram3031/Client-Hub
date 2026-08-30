import dotenv from "dotenv";

dotenv.config();

// Dynamic D1 Query Endpoint Resolver
const getD1ApiUrl = () => {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const dbId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  return `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${dbId}/query`;
};

const getApiToken = () => {
  return process.env.CLOUDFLARE_API_TOKEN || "";
};

// Executes SQL Query on Cloudflare D1 via REST API
export const queryD1 = async <T = any>(sql: string, params: any[] = []): Promise<T[]> => {
  try {
    const url = getD1ApiUrl();
    const token = getApiToken();

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
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

// Safely adds column to SQLite table if it does not already exist
const safeAddColumn = async (table: string, column: string, typeDef: string) => {
  try {
    await queryD1(`ALTER TABLE ${table} ADD COLUMN ${column} ${typeDef}`);
  } catch (err: any) {
    // Column already exists
  }
};

// Initializes all core tables on Cloudflare D1
export const initD1Schema = async () => {
  console.log("⚡ [Cloudflare D1] Provisioning Core Schema (Users, Projects, Clients, Releases)...");

  // 1. Users Table (Super-Admin & Team Operators)
  await queryD1(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'super_admin',
      avatar_url TEXT DEFAULT '',
      last_login_at DATETIME,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Projects Table (Master Software Products Catalog)
  await queryD1(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT DEFAULT '',
      repo_url TEXT DEFAULT '',
      current_version TEXT DEFAULT '1.0.0',
      latest_release_id TEXT DEFAULT '',
      tech_stack_json TEXT DEFAULT '["Node.js", "React 19", "MongoDB", "Cloudflare"]',
      status TEXT DEFAULT 'active',
      docs_categories TEXT DEFAULT '["Architecture","Frontend","Backend","Dashboard"]',
      log_scopes TEXT DEFAULT '["frontend","backend","dashboard"]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Releases Table (Version Matrix, Release Notes & Changelogs)
  await queryD1(`
    CREATE TABLE IF NOT EXISTS releases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      release_id TEXT UNIQUE NOT NULL,
      project_id TEXT NOT NULL,
      version_tag TEXT NOT NULL,
      git_commit_sha TEXT NOT NULL,
      title TEXT NOT NULL,
      release_type TEXT DEFAULT 'minor',
      changelog_md TEXT NOT NULL,
      breaking_changes TEXT DEFAULT '',
      target_env TEXT DEFAULT 'production',
      is_published INTEGER DEFAULT 1,
      published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT DEFAULT 'super_admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. Clients Table (Master Fleet & White-Label Deployments)
  await queryD1(`
    CREATE TABLE IF NOT EXISTS clients (
      client_key TEXT PRIMARY KEY,
      brand_name TEXT NOT NULL,
      project_id TEXT DEFAULT 'prj_wlecom',
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
      client_secret_token TEXT DEFAULT '',
      last_heartbeat_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Safe migrations for table schema evolution
  await safeAddColumn("clients", "project_id", "TEXT DEFAULT 'prj_wlecom'");
  await safeAddColumn("clients", "client_secret_token", "TEXT DEFAULT ''");
  await safeAddColumn("projects", "repo_url", "TEXT DEFAULT ''");
  await safeAddColumn("projects", "current_version", "TEXT DEFAULT '1.0.0'");
  await safeAddColumn("projects", "latest_release_id", "TEXT DEFAULT ''");
  await safeAddColumn("projects", "tech_stack_json", "TEXT DEFAULT '[\"Node.js\", \"React 19\", \"MongoDB\", \"Cloudflare\"]'");
  await safeAddColumn("projects", "status", "TEXT DEFAULT 'active'");

  // 5. Docs Table
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

  // 6. Action / AI Logs Table
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

  // Optimized Query Indexes
  await queryD1(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
  await queryD1(`CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);`);
  await queryD1(`CREATE INDEX IF NOT EXISTS idx_releases_proj_ver ON releases(project_id, version_tag);`);
  await queryD1(`CREATE INDEX IF NOT EXISTS idx_clients_project ON clients(project_id);`);
  await queryD1(`CREATE INDEX IF NOT EXISTS idx_heartbeats_client_time ON heartbeat_logs(client_key, created_at DESC);`);
  await queryD1(`CREATE INDEX IF NOT EXISTS idx_tasks_client_status ON remote_tasks(client_key, status);`);
  await queryD1(`CREATE INDEX IF NOT EXISTS idx_tickets_client_status ON support_tickets(client_key, status);`);

  console.log("✅ [Cloudflare D1] All Core Tables and Indexes Provisioned Successfully!");
};
