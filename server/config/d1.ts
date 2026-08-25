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

  console.log("✅ [Cloudflare D1] Schema initialized successfully!");
};
