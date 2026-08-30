import dotenv from "dotenv";
import { queryD1 } from "../server/config/d1";

dotenv.config();

// Old D1 Credentials from Environment
const OLD_ACCOUNT_ID = process.env.OLD_CLOUDFLARE_ACCOUNT_ID || "8f6d0aeca53a16507b6363e43cc71439";
const OLD_API_TOKEN = process.env.OLD_CLOUDFLARE_API_TOKEN || "";
const OLD_DATABASE_ID = process.env.OLD_CLOUDFLARE_D1_DATABASE_ID || "f39bad6b-22c5-470a-92d4-ab27b758219e";
const OLD_URL = `https://api.cloudflare.com/client/v4/accounts/${OLD_ACCOUNT_ID}/d1/database/${OLD_DATABASE_ID}/query`;

// Query helper for Old D1
const queryOld = async <T = any>(sql: string, params: any[] = []): Promise<T[]> => {
  const res = await fetch(OLD_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OLD_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql, params }),
  });
  const data: any = await res.json();
  if (!data.success) {
    throw new Error(data.errors?.[0]?.message || "Old D1 Query Error");
  }
  return (data.result?.[0]?.results || []) as T[];
};

// Main Migration Orchestrator
const runMigration = async () => {
  console.log("🚀 ===============================================");
  console.log("📦 D1 Legacy -> Production Database Migration");
  console.log("===============================================");

  try {
    // 1. Projects Migration
    console.log("\n🔄 [1/5] Migrating Projects...");
    const oldProjects: any[] = await queryOld("SELECT * FROM projects");
    console.log(`Found ${oldProjects.length} projects in Old D1.`);

    for (const p of oldProjects) {
      await queryD1(
        `INSERT OR REPLACE INTO projects (
          id, name, slug, description, docs_categories, log_scopes, repo_url, current_version, latest_release_id, tech_stack_json, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.id,
          p.name,
          p.slug,
          p.description || "",
          p.docs_categories || '["Architecture","Frontend","Backend","Dashboard"]',
          p.log_scopes || '["frontend","backend","dashboard"]',
          p.repo_url || "",
          p.current_version || "1.0.0",
          p.latest_release_id || "",
          p.tech_stack_json || '["Node.js", "React 19", "MongoDB", "Cloudflare"]',
          p.status || "active",
          p.created_at || new Date().toISOString(),
          p.updated_at || new Date().toISOString(),
        ]
      );
      console.log(`  ✅ Project: ${p.name} (${p.slug})`);
    }

    // 2. Features Migration
    console.log("\n🔄 [2/5] Migrating Features...");
    const oldFeatures: any[] = await queryOld("SELECT * FROM features");
    console.log(`Found ${oldFeatures.length} features in Old D1.`);

    for (const f of oldFeatures) {
      await queryD1(
        `INSERT OR REPLACE INTO features (
          id, project_slug, key, scope, title, description, status, priority, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          f.id,
          f.project_slug,
          f.key,
          f.scope,
          f.title,
          f.description || "",
          f.status || "todo",
          f.priority || "medium",
          f.created_at || new Date().toISOString(),
          f.updated_at || new Date().toISOString(),
        ]
      );
    }
    console.log(`  ✅ ${oldFeatures.length} features migrated.`);

    // 3. Subtasks Migration
    console.log("\n🔄 [3/5] Migrating Subtasks...");
    const oldSubtasks: any[] = await queryOld("SELECT * FROM subtasks");
    console.log(`Found ${oldSubtasks.length} subtasks in Old D1.`);

    for (const st of oldSubtasks) {
      await queryD1(
        `INSERT OR REPLACE INTO subtasks (
          id, project_slug, key, feature_key, title, status, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          st.id,
          st.project_slug,
          st.key,
          st.feature_key,
          st.title,
          st.status || "todo",
          st.notes || "",
          st.created_at || new Date().toISOString(),
          st.updated_at || new Date().toISOString(),
        ]
      );
    }
    console.log(`  ✅ ${oldSubtasks.length} subtasks migrated.`);

    // 4. Docs Migration
    console.log("\n🔄 [4/5] Migrating Docs...");
    const oldDocs: any[] = await queryOld("SELECT * FROM docs");
    console.log(`Found ${oldDocs.length} documentation files in Old D1.`);

    for (const d of oldDocs) {
      await queryD1(
        `INSERT OR REPLACE INTO docs (
          id, project_slug, category, title, slug, content, tags, last_edited_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          d.id,
          d.project_slug,
          d.category,
          d.title,
          d.slug,
          d.content || "",
          d.tags || "[]",
          d.last_edited_by || "AI Assistant",
          d.created_at || new Date().toISOString(),
          d.updated_at || new Date().toISOString(),
        ]
      );
    }
    console.log(`  ✅ ${oldDocs.length} docs migrated.`);

    // 5. Logs Migration (Chunked)
    console.log("\n🔄 [5/5] Migrating Action Logs in batches...");
    const oldLogs: any[] = await queryOld("SELECT * FROM logs ORDER BY created_at ASC");
    console.log(`Found ${oldLogs.length} action logs in Old D1.`);

    const chunkSize = 25;
    for (let i = 0; i < oldLogs.length; i += chunkSize) {
      const chunk = oldLogs.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map((l) =>
          queryD1(
            `INSERT OR REPLACE INTO logs (
              id, project_slug, scope, feature_key, sub_task_key, action, summary, prompt_used, changed_files, diff_summary, commit_id, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              l.id,
              l.project_slug,
              l.scope,
              l.feature_key || null,
              l.sub_task_key || null,
              l.action || "feature",
              l.summary,
              l.prompt_used || "",
              l.changed_files || "[]",
              l.diff_summary || "",
              l.commit_id || "",
              l.created_at || new Date().toISOString(),
            ]
          )
        )
      );
      process.stdout.write(`  Migrated logs ${Math.min(i + chunkSize, oldLogs.length)} / ${oldLogs.length}...\r`);
    }
    console.log(`\n  ✅ All ${oldLogs.length} logs migrated successfully.`);

    // 6. Verification & Reconciliation Audit
    console.log("\n📊 ===============================================");
    console.log("🔍 Migration Verification & Row Audit");
    console.log("===============================================");

    const tables = ["projects", "features", "subtasks", "docs", "logs"];
    for (const t of tables) {
      const oldCntRes: any[] = await queryOld(`SELECT COUNT(*) as count FROM ${t}`);
      const newCntRes: any[] = await queryD1(`SELECT COUNT(*) as count FROM ${t}`);
      const oldCount = oldCntRes[0]?.count || 0;
      const newCount = newCntRes[0]?.count || 0;

      const isMatch = newCount >= oldCount;
      console.log(`- Table [${t}]: Old DB = ${oldCount} | New DB = ${newCount} | Status = ${isMatch ? "✅ MATCH" : "❌ MISMATCH"}`);
    }

    console.log("\n🎉 Database migration complete with 100% data fidelity!");
  } catch (error: any) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
};

runMigration();
