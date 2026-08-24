import dotenv from "dotenv";
import { queryD1 } from "./config/d1";

dotenv.config();

/**
 * Diagnostic utility to verify live Cloudflare D1 database connection and tables
 */
const checkDatabaseHealth = async () => {
  console.log("=========================================");
  console.log("🔍 Checking Cloudflare D1 Database Connection...");
  console.log("=========================================");

  try {
    // 1. Check basic query
    const timeRes = await queryD1<{ current_time: string }>("SELECT datetime('now') as current_time;");
    console.log("✅ Cloudflare D1 Connection: ONLINE");
    console.log(`⏱️ Server Time (UTC): ${timeRes[0]?.current_time}`);

    // 2. Check all tables
    const tablesRes = await queryD1<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%';"
    );
    const tableNames = tablesRes.map((t) => t.name);
    console.log("📊 Available Tables:", tableNames);

    // 3. Count records per table
    for (const table of tableNames) {
      const countRes = await queryD1<{ count: number }>(`SELECT COUNT(*) as count FROM ${table};`);
      console.log(`   - 📁 ${table}: ${countRes[0]?.count || 0} records`);
    }

    // 4. Sample project lookup
    const projects = await queryD1("SELECT name, slug, created_at FROM projects;");
    console.log("\n📦 Registered Projects in Hub:", projects);

    console.log("\n=========================================");
    console.log("🎉 Database Check Status: 100% HEALTHY & CONNECTED!");
    console.log("=========================================\n");
  } catch (error: any) {
    console.error("❌ Cloudflare D1 Database Check Failed:", error.message);
    process.exit(1);
  }
};

checkDatabaseHealth();
