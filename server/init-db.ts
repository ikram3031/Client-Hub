import dotenv from "dotenv";
import { initD1Schema, queryD1 } from "./config/d1";

dotenv.config();

// Initializes and seeds Cloudflare D1 database
const runInit = async () => {
  try {
    console.log("⚡ [Cloudflare D1] Initializing full ClientHub schema on D1 database...");
    await initD1Schema();

    // 1. Seed Master Users (Dashboard Admins / Operators)
    console.log("🌱 [Seed] Seeding default Admin Users...");
    await queryD1(
      `INSERT OR IGNORE INTO users (user_id, email, password_hash, name, role)
       VALUES (?, ?, ?, ?, ?)`,
      [
        "usr_admin_01",
        "admin@plexivia.com",
        "pbkdf2_sha256_mock_hash_admin_secret",
        "Plexivia Super Admin",
        "super_admin",
      ]
    );

    // 2. Seed Master Projects
    console.log("🌱 [Seed] Seeding Master Software Projects Catalog...");
    await queryD1(
      `INSERT OR REPLACE INTO projects (id, name, slug, description, repo_url, current_version, latest_release_id, tech_stack_json, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "prj_wlecom",
        "White-Label eCommerce Engine",
        "wl-ecom",
        "Multi-tenant high-performance eCommerce platform with real-time stock sync and automated backups.",
        "https://github.com/ikram3031/mtEcomWhite",
        "2.4.1",
        "rel_wlecom_v241",
        JSON.stringify(["Node.js", "Express", "React 19", "MongoDB", "Cloudflare D1/R2", "Docker"]),
        "active",
      ]
    );

    // 3. Seed Releases Catalog
    console.log("🌱 [Seed] Seeding Releases and Version Matrix...");
    await queryD1(
      `INSERT OR REPLACE INTO releases (release_id, project_id, version_tag, git_commit_sha, title, release_type, changelog_md, target_env, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "rel_wlecom_v241",
        "prj_wlecom",
        "v2.4.1",
        "799cee4",
        "Cart Stock Verification & Meta Catalog URL Upgrade",
        "patch",
        "- **Stock Validation**: ProductModel integration inside OrdersController for rigorous cart deduction.\n- **Meta Catalog**: Updated product URL schema to clean `/product/` standard.\n- **Cloudflare Integration**: Telemetry sidecar daemon and automated R2 database streaming.",
        "production",
        1,
      ]
    );

    await queryD1(
      `INSERT OR REPLACE INTO releases (release_id, project_id, version_tag, git_commit_sha, title, release_type, changelog_md, target_env, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "rel_wlecom_v240",
        "prj_wlecom",
        "v2.4.0",
        "bfd42e3",
        "Centralized Config Loader & Telemetry Heartbeat",
        "minor",
        "- Centralized multi-tenant capability loader in frontend.\n- VPS heartbeat scheduler reporting Node heap and CPU load.\n- Redesigned orders analytics dashboard.",
        "production",
        1,
      ]
    );

    // 4. Seed White-Label Fleet Clients
    console.log("🌱 [Seed] Seeding White-Label Clients Fleet...");
    const fleetClients = [
      {
        client_key: "decantre",
        brand_name: "Decantre",
        project_id: "prj_wlecom",
        domain: "decantrebd.com",
        vps_ip: "144.79.218.241",
        api_url: "https://decantrebd.com/api",
        dashboard_url: "https://decantrebd.com/admin",
        storefront_url: "https://decantrebd.com",
        app_version: "2.4.1",
        git_commit_hash: "799cee4",
        status: "healthy",
        disk_total_gb: 40.0,
        disk_used_gb: 16.8,
        disk_free_pct: 58.0,
        memory_rss_mb: 480.0,
        cpu_load_pct: 12.5,
        db_status: "connected",
        hosting_package: "Business SSD VPS",
        hosting_start_date: "2025-01-01",
        hosting_expiry_date: "2027-01-01",
        hosting_billing_cycle: "yearly",
        hosting_status: "active",
        hosting_price_bdt: 12000,
        client_secret_token: "tok_decantre_sec_99a8",
      },
      {
        client_key: "engulfic",
        brand_name: "Engulfic",
        project_id: "prj_wlecom",
        domain: "engulfic.com",
        vps_ip: "144.79.218.241",
        api_url: "https://engulfic.com/api",
        dashboard_url: "https://engulfic.com/admin",
        storefront_url: "https://engulfic.com",
        app_version: "2.3.0",
        git_commit_hash: "3f65709",
        status: "healthy",
        disk_total_gb: 50.0,
        disk_used_gb: 39.0,
        disk_free_pct: 22.0,
        memory_rss_mb: 512.0,
        cpu_load_pct: 18.2,
        db_status: "connected",
        hosting_package: "Standard VPS",
        hosting_start_date: "2025-09-01",
        hosting_expiry_date: "2026-09-10",
        hosting_billing_cycle: "yearly",
        hosting_status: "expiring_soon",
        hosting_price_bdt: 10000,
        client_secret_token: "tok_engulfic_sec_77b2",
      },
      {
        client_key: "toyoland",
        brand_name: "Toyoland",
        project_id: "prj_wlecom",
        domain: "toyoland.shop",
        vps_ip: "144.79.218.241",
        api_url: "https://toyoland.shop/api",
        dashboard_url: "https://toyoland.shop/admin",
        storefront_url: "https://toyoland.shop",
        app_version: "2.4.1",
        git_commit_hash: "799cee4",
        status: "healthy",
        disk_total_gb: 40.0,
        disk_used_gb: 24.5,
        disk_free_pct: 38.75,
        memory_rss_mb: 420.0,
        cpu_load_pct: 8.0,
        db_status: "connected",
        hosting_package: "Standard VPS",
        hosting_start_date: "2025-06-01",
        hosting_expiry_date: "2027-06-01",
        hosting_billing_cycle: "yearly",
        hosting_status: "active",
        hosting_price_bdt: 10000,
        client_secret_token: "tok_toyoland_sec_55c1",
      },
    ];

    for (const client of fleetClients) {
      await queryD1(
        `INSERT OR REPLACE INTO clients (
          client_key, brand_name, project_id, domain, vps_ip, api_url, dashboard_url, storefront_url,
          app_version, git_commit_hash, status, disk_total_gb, disk_used_gb, disk_free_pct,
          memory_rss_mb, cpu_load_pct, db_status, hosting_package, hosting_start_date,
          hosting_expiry_date, hosting_billing_cycle, hosting_status, hosting_price_bdt, client_secret_token
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          client.client_key,
          client.brand_name,
          client.project_id,
          client.domain,
          client.vps_ip,
          client.api_url,
          client.dashboard_url,
          client.storefront_url,
          client.app_version,
          client.git_commit_hash,
          client.status,
          client.disk_total_gb,
          client.disk_used_gb,
          client.disk_free_pct,
          client.memory_rss_mb,
          client.cpu_load_pct,
          client.db_status,
          client.hosting_package,
          client.hosting_start_date,
          client.hosting_expiry_date,
          client.hosting_billing_cycle,
          client.hosting_status,
          client.hosting_price_bdt,
          client.client_secret_token,
        ]
      );
      console.log(`   - 🚀 Seeded Fleet Client: [${client.brand_name} (${client.client_key})] -> Linked to [${client.project_id}]`);
    }

    console.log("\n🎉 Full Schema (Users, Projects, Releases, Clients) & Seeded Data Provisioned on Cloudflare D1 successfully!\n");
  } catch (err: any) {
    console.error("❌ [Seed Error]:", err.message);
    process.exit(1);
  }
};

runInit();
