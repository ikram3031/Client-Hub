import dotenv from "dotenv";
import { queryD1 } from "./config/d1";

dotenv.config();

/**
 * Migrates logs table to composite primary key (project_slug, id)
 */
const migrateLogsTable = async () => {
  try {
    console.log("⚡ [Migration] Updating logs table schema on Cloudflare D1...");
    
    await queryD1(`
      CREATE TABLE IF NOT EXISTS logs_v2 (
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

    console.log("   - Copying existing records to logs_v2...");
    try {
      await queryD1(`
        INSERT OR IGNORE INTO logs_v2 
        SELECT id, project_slug, scope, feature_key, sub_task_key, action, summary, prompt_used, changed_files, diff_summary, commit_id, created_at 
        FROM logs;
      `);
      await queryD1(`DROP TABLE logs;`);
      await queryD1(`ALTER TABLE logs_v2 RENAME TO logs;`);
      console.log("✅ [Migration] logs table successfully updated with composite PRIMARY KEY (project_slug, id)!");
    } catch (e) {
      console.log("   - Table migration note:", e.message);
    }
  } catch (err) {
    console.error("❌ Migration error:", err.message);
  }
};

migrateLogsTable();
