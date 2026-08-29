import dotenv from "dotenv";
import { initD1Schema, queryD1 } from "./config/d1";

dotenv.config();

const initAndSeedFleet = async () => {
  console.log("⚡ [Cloudflare D1] Initializing full ClientHub schema on D1 database...");
  await initD1Schema();

  console.log("🌱 [Seed] Seeding initial White-Label Fleet clients...");

  const initialClients = [
    {
      client_key: "decantre",
      brand_name: "Decantre",
      domain: "decantrebd.com",
      vps_ip: "144.79.218.241",
      api_url: "https://server.decantrebd.com",
      dashboard_url: "https://admin.decantrebd.com",
      storefront_url: "https://decantrebd.com",
      app_version: "2.4.1",
      git_commit_hash: "799cee4",
      status: "healthy",
      disk_total_gb: 40.0,
      disk_used_gb: 16.8,
      disk_free_pct: 58.0,
      memory_rss_mb: 480.0,
      cpu_load_pct: 12.0,
      db_status: "connected",
      hosting_package: "Premium VPS",
      hosting_start_date: "2026-01-01 00:00:00",
      hosting_expiry_date: "2027-01-01 00:00:00",
      hosting_billing_cycle: "yearly",
      hosting_status: "active",
      hosting_price_bdt: 12000.0,
    },
    {
      client_key: "engulfic",
      brand_name: "Engulfic",
      domain: "engulfic.com",
      vps_ip: "144.79.218.241",
      api_url: "https://server.engulfic.com",
      dashboard_url: "https://admin.engulfic.com",
      storefront_url: "https://engulfic.com",
      app_version: "2.3.0",
      git_commit_hash: "b318fa1",
      status: "healthy",
      disk_total_gb: 40.0,
      disk_used_gb: 31.2,
      disk_free_pct: 22.0,
      memory_rss_mb: 520.0,
      cpu_load_pct: 18.0,
      db_status: "connected",
      hosting_package: "Standard VPS",
      hosting_start_date: "2026-02-15 00:00:00",
      hosting_expiry_date: "2026-09-15 00:00:00",
      hosting_billing_cycle: "yearly",
      hosting_status: "expiring_soon",
      hosting_price_bdt: 10000.0,
    },
    {
      client_key: "toyoland",
      brand_name: "Toyoland",
      domain: "toyoland.shop",
      vps_ip: "144.79.218.241",
      api_url: "https://server.toyoland.shop",
      dashboard_url: "https://admin.toyoland.shop",
      storefront_url: "https://toyoland.shop",
      app_version: "2.4.1",
      git_commit_hash: "799cee4",
      status: "healthy",
      disk_total_gb: 40.0,
      disk_used_gb: 24.5,
      disk_free_pct: 38.75,
      memory_rss_mb: 390.0,
      cpu_load_pct: 8.5,
      db_status: "connected",
      hosting_package: "Standard VPS",
      hosting_start_date: "2026-04-01 00:00:00",
      hosting_expiry_date: "2027-04-01 00:00:00",
      hosting_billing_cycle: "yearly",
      hosting_status: "active",
      hosting_price_bdt: 10000.0,
    },
  ];

  for (const c of initialClients) {
    await queryD1(
      `INSERT INTO clients (
        client_key, brand_name, domain, vps_ip, api_url, dashboard_url, storefront_url,
        app_version, git_commit_hash, status, disk_total_gb, disk_used_gb, disk_free_pct,
        memory_rss_mb, cpu_load_pct, db_status, hosting_package, hosting_start_date,
        hosting_expiry_date, hosting_billing_cycle, hosting_status, hosting_price_bdt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(client_key) DO UPDATE SET
        brand_name = excluded.brand_name,
        domain = excluded.domain,
        vps_ip = excluded.vps_ip,
        api_url = excluded.api_url,
        dashboard_url = excluded.dashboard_url,
        storefront_url = excluded.storefront_url,
        app_version = excluded.app_version,
        git_commit_hash = excluded.git_commit_hash,
        status = excluded.status,
        disk_total_gb = excluded.disk_total_gb,
        disk_used_gb = excluded.disk_used_gb,
        disk_free_pct = excluded.disk_free_pct,
        memory_rss_mb = excluded.memory_rss_mb,
        cpu_load_pct = excluded.cpu_load_pct,
        db_status = excluded.db_status,
        hosting_package = excluded.hosting_package,
        hosting_expiry_date = excluded.hosting_expiry_date,
        hosting_status = excluded.hosting_status`,
      [
        c.client_key,
        c.brand_name,
        c.domain,
        c.vps_ip,
        c.api_url,
        c.dashboard_url,
        c.storefront_url,
        c.app_version,
        c.git_commit_hash,
        c.status,
        c.disk_total_gb,
        c.disk_used_gb,
        c.disk_free_pct,
        c.memory_rss_mb,
        c.cpu_load_pct,
        c.db_status,
        c.hosting_package,
        c.hosting_start_date,
        c.hosting_expiry_date,
        c.hosting_billing_cycle,
        c.hosting_status,
        c.hosting_price_bdt,
      ]
    );
    console.log(`   - 🚀 Seeded Fleet Client: [${c.brand_name} (${c.client_key})]`);
  }

  // Also seed project 'afull' for Docs & Logs if not exists
  await queryD1(
    `INSERT INTO projects (id, name, slug, description, docs_categories, log_scopes)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO NOTHING`,
    [
      "afull-project-id",
      "WL-Ecom (AFull)",
      "afull",
      "Multi-tenant white-label e-commerce core platform",
      JSON.stringify(["Architecture", "Backend", "Dashboard", "Deployment"]),
      JSON.stringify(["backend", "dashboard", "decantre", "engulfic", "toyoland", "deployment", "architecture"]),
    ]
  );
  console.log("   - 📦 Seeded Core Project: WL-Ecom (AFull)");

  console.log("\n🎉 Full Schema & Fleet initialized on Cloudflare D1 successfully!\n");
};

initAndSeedFleet().catch((err) => {
  console.error("❌ Init Error:", err);
  process.exit(1);
});
