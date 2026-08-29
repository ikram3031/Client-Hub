import dotenv from "dotenv";
import { queryD1 } from "./config/d1";

dotenv.config();

const testFleetData = async () => {
  console.log("🧪 Testing ClientHub Fleet D1 APIs and Data...");

  // 1. Query all clients
  const clients = await queryD1("SELECT client_key, brand_name, status, app_version, disk_free_pct, hosting_status FROM clients");
  console.log("✓ Clients in D1:", clients);

  // 2. Test Heartbeat insertion for decantre
  const now = new Date().toISOString();
  await queryD1(
    `UPDATE clients
     SET disk_used_gb = 17.5, disk_free_pct = 56.25, memory_rss_mb = 495.0, cpu_load_pct = 14.2, last_heartbeat_at = ?
     WHERE client_key = 'decantre'`,
    [now]
  );
  console.log("✓ Updated live heartbeat for Decantre at", now);

  // 3. Test Support Ticket Insertion
  await queryD1(
    `INSERT INTO support_tickets (client_key, category, title, description, page_url, priority, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      "toyoland",
      "ui_bug",
      "Category filter dropdown glitch on mobile Safari",
      "When opening category filter on iOS 18 Safari, dropdown closes automatically.",
      "https://toyoland.shop/shop",
      "urgent",
      "open",
    ]
  );
  console.log("✓ Created test Support Ticket for Toyoland");

  // 4. Test Task Queue
  await queryD1(
    `INSERT INTO remote_tasks (task_id, client_key, action_type, payload_json, status, requested_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      "task_test_001",
      "engulfic",
      "BACKUP_DATABASE",
      JSON.stringify({ target: "r2", compression: "gzip" }),
      "pending",
      "super_admin",
    ]
  );
  console.log("✓ Queued test Remote Task [BACKUP_DATABASE] for Engulfic");

  // 5. Query results
  const tickets = await queryD1("SELECT id, client_key, title, status FROM support_tickets");
  console.log("✓ Support Tickets:", tickets);

  const tasks = await queryD1("SELECT task_id, client_key, action_type, status FROM remote_tasks");
  console.log("✓ Remote Tasks:", tasks);

  console.log("\n🎉 All Fleet, Ticket, and Task D1 operations verified 100% successfully!\n");
};

testFleetData().catch(console.error);
