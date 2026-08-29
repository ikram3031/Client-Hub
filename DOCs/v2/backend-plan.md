# ⚡ ClientHub: Backend & Sidecar Agent Implementation Plan (v2)

> **Document Version:** 2.0.0  
> **Target Scope:** Central Backend Hub, Cloudflare D1/R2, and Client VPS Sidecar Micro-Agent  
> **Status:** Approved Architectural Blueprint

---

## 🎯 1. Architectural Overview & Design Philosophy

The ClientHub Backend operates on a **Decoupled Edge-and-Sidecar Architecture**:
1. **Central Edge Hub (Cloudflare D1 + Workers/Express API):** Acts as the central coordination brain. It holds client telemetry, version releases, support tickets, and task dispatch queues. It stores **ZERO VPS passwords, ZERO SSH keys, and ZERO client eCommerce business data**.
2. **Client VPS Sidecar Micro-Agent (Stateless Daemon):** Runs locally on each client's VPS. It is completely isolated from the main eCommerce application containers, consumes less than **10-15 MB RAM**, has **NO database**, and executes only **whitelisted, cryptographically signed operational tasks** (Deploy, Backup, Health Telemetry).

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                   CLOUDFLARE D1 + REST BACKEND GATEWAY (CENTRAL HUB)                     │
│                                                                                          │
│  [Clients Table]    [Heartbeat Logs]    [Support Tickets]    [Remote Task Dispatch Queue]│
└────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                         │
                   Encrypted HTTPS REST / Outbound Polling
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐
│   CLIENT VPS AGENT    │  │   CLIENT VPS AGENT    │  │   CLIENT VPS AGENT    │
│      (Decantre)       │  │      (Engulfic)       │  │      (Toyoland)       │
│                       │  │                       │  │                       │
│ • RAM: ~10 MB         │  │ • RAM: ~10 MB         │  │ • RAM: ~10 MB         │
│ • ZERO Database       │  │ • ZERO Database       │  │ • ZERO Database       │
│ • Whitelisted Actions │  │ • Whitelisted Actions │  │ • Whitelisted Actions │
│ • Outbound Polling    │  │ • Outbound Polling    │  │ • Outbound Polling    │
└───────────────────────┘  └───────────────────────┘  └───────────────────────┘
```

---

## 🗄️ 2. Cloudflare D1 SQL Schema Specification

The D1 SQL database (`plexivia-whitelabel`) is structured with high-performance indexed tables:

```sql
-- 1. Master Clients Registry
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
  status TEXT DEFAULT 'healthy', -- healthy, degraded, offline
  
  -- Infrastructure Telemetry Metrics
  disk_total_gb REAL DEFAULT 0,
  disk_used_gb REAL DEFAULT 0,
  disk_free_pct REAL DEFAULT 100,
  memory_rss_mb REAL DEFAULT 0,
  cpu_load_pct REAL DEFAULT 0,
  db_status TEXT DEFAULT 'unknown',
  
  -- Hosting & Subscription Lifecycle
  hosting_package TEXT DEFAULT 'Standard VPS',
  hosting_start_date DATETIME,
  hosting_expiry_date DATETIME,
  hosting_billing_cycle TEXT DEFAULT 'yearly', -- monthly, yearly
  hosting_status TEXT DEFAULT 'active',        -- active, expiring_soon, expired, suspended
  hosting_price_bdt REAL DEFAULT 0,
  
  policies_json TEXT DEFAULT '{}',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Telemetry & Heartbeat Log History (Time-series)
CREATE TABLE IF NOT EXISTS heartbeat_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_key TEXT NOT NULL,
  vps_ip TEXT,
  db_status TEXT,
  disk_free_pct REAL,
  memory_rss_mb REAL,
  cpu_load_pct REAL,
  uptime_seconds INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_key) REFERENCES clients(client_key) ON DELETE CASCADE
);

-- 3. In-App Support Tickets & Bug Reports
CREATE TABLE IF NOT EXISTS support_tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_key TEXT NOT NULL,
  category TEXT NOT NULL,              -- ui_bug, order_flow, payment, stock, other
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  page_url TEXT,
  browser_info TEXT,
  error_logs_json TEXT DEFAULT '[]',
  screenshot_url TEXT DEFAULT '',
  priority TEXT DEFAULT 'normal',       -- low, normal, urgent
  status TEXT DEFAULT 'open',          -- open, in_progress, resolved, closed
  resolution_notes TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  FOREIGN KEY (client_key) REFERENCES clients(client_key) ON DELETE CASCADE
);

-- 4. Remote Operational Task Dispatch Queue
CREATE TABLE IF NOT EXISTS remote_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT UNIQUE NOT NULL,        -- UUID or nano-id
  client_key TEXT NOT NULL,
  action_type TEXT NOT NULL,           -- DEPLOY_LATEST, BACKUP_DATABASE, RESTART_SERVICE, FLUSH_CACHE
  payload_json TEXT DEFAULT '{}',
  status TEXT DEFAULT 'pending',       -- pending, processing, completed, failed
  requested_by TEXT DEFAULT 'super_admin',
  execution_output TEXT DEFAULT '',
  duration_ms INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME,
  completed_at DATETIME,
  FOREIGN KEY (client_key) REFERENCES clients(client_key) ON DELETE CASCADE
);

-- 5. Hosting Alerts & Broadcast Banners
CREATE TABLE IF NOT EXISTS billing_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_key TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  banner_type TEXT DEFAULT 'warning',  -- info, warning, danger
  action_button_text TEXT,
  action_button_url TEXT,
  is_active INTEGER DEFAULT 1,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_key) REFERENCES clients(client_key) ON DELETE CASCADE
);

-- Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_heartbeats_client_time ON heartbeat_logs(client_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_client_status ON remote_tasks(client_key, status);
CREATE INDEX IF NOT EXISTS idx_tickets_client_status ON support_tickets(client_key, status);
```

---

## 🔒 3. Cryptographic Security & Communication Protocol

```
Central Cloudflare Hub                                   Client VPS Fleet Agent
      │                                                           │
      │── 1. Create Command Payload:                              │
      │      { action: "DEPLOY_LATEST", timestamp: 1725002100 }   │
      │── 2. Sign Payload using Secret HMAC-SHA256                │
      │── 3. Send HTTP Request with Header [x-hub-signature] ────►│
      │                                                           │
      │                                  4. Verify Signature ────┤
      │                                  5. Check Timestamp (<5m) │
      │                                  6. Match Whitelist Action│
      │                                     (Only DEPLOY/BACKUP)  │
      │                                  7. Execute Local Script  │
      │                                                           │
      │◄── 8. Return Execution Output & Status (Success/Error) ───│
```

### Security Guardrails:
1. **HMAC-SHA256 Signature Verification:**
   - Every request between Central Hub and the Agent must carry an `x-hub-signature` header:
     $$\text{Signature} = \text{HMAC-SHA256}(\text{payloadJSON}, \text{CLIENT\_AGENT\_SECRET})$$
   - Any tampering or invalid token results in immediate `401 Unauthorized`.
2. **Replay-Attack Prevention:**
   - Payloads contain an ISO timestamp or Unix epoch. If the timestamp differs from current server time by $> 300\text{ seconds}$ (5 minutes), the agent rejects the payload.
3. **Strict Whitelist Action Mapping:**
   - The Agent will **never** accept arbitrary bash strings. Only fixed mapping handlers exist in code:
   ```typescript
   const ACTION_REGISTRY: Record<string, () => Promise<string>> = {
     DEPLOY_LATEST: async () => executeCommand("make deploy"),
     BACKUP_DATABASE: async () => executeCommand("bash scripts/backup-to-r2.sh"),
     RESTART_BACKEND: async () => executeCommand("make build-backend"),
     RESTART_DASHBOARD: async () => executeCommand("make build-dashboard"),
   };
   ```

---

## 🤖 4. Client VPS Sidecar Micro-Agent Implementation

The Sidecar Agent is a tiny, single-file Node.js script (or lightweight binary) located in `/opt/<client>/agent/index.js` managed by `systemd` or as a background container.

### Core Implementation (`agent/index.js`):

```javascript
// Lightweight Client VPS Sidecar Agent
import http from "http";
import crypto from "crypto";
import os from "os";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

const PORT = process.env.AGENT_PORT || 5099;
const AGENT_SECRET = process.env.CLIENT_AGENT_SECRET || "change-me-secret";
const CLIENT_KEY = process.env.CLIENT_KEY || "decantre";
const HUB_URL = process.env.CENTRAL_HUB_URL || "https://hub.plexivia.com";

// Executes shell command safely as a promise
const executeCommand = (cmd) => {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd: "/opt/" + CLIENT_KEY, timeout: 300000 }, (error, stdout, stderr) => {
      if (error) {
        return reject(new Error(stderr || error.message));
      }
      resolve(stdout.trim());
    });
  });
};

// Collects local OS health metrics (Zero business data)
const collectSystemMetrics = async () => {
  const memTotal = os.totalmem();
  const memFree = os.freemem();
  const memUsedMb = Math.round((memTotal - memFree) / (1024 * 1024));
  
  // Read git commit and app version
  let gitCommit = "unknown";
  let appVersion = "1.0.0";
  try {
    const pkg = JSON.parse(fs.readFileSync(`/opt/${CLIENT_KEY}/backend/package.json`, "utf8"));
    appVersion = pkg.version || "1.0.0";
  } catch {}

  return {
    clientKey: CLIENT_KEY,
    memoryRssMb: memUsedMb,
    cpuLoadPct: Math.round(os.loadavg()[0] * 10),
    appVersion,
    gitCommitHash: gitCommit,
    uptimeSeconds: Math.round(os.uptime()),
    timestamp: new Date().toISOString()
  };
};

// Outbound Telemetry Push to Central Hub
const pushHeartbeat = async () => {
  try {
    const metrics = await collectSystemMetrics();
    const payload = JSON.stringify(metrics);
    const signature = crypto.createHmac("sha256", AGENT_SECRET).update(payload).digest("hex");

    await fetch(`${HUB_URL}/api/v1/fleet/heartbeat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hub-signature": signature,
        "x-client-key": CLIENT_KEY
      },
      body: payload
    });
  } catch (err) {
    // Non-blocking telemetry
  }
};

// Poll and Heartbeat Interval (Every 60s)
setInterval(pushHeartbeat, 60000);
pushHeartbeat();

console.log(`🚀 [Sidecar Agent] Running for client [${CLIENT_KEY}]`);
```

---

## 🪣 5. Cloudflare R2 Database Backup Pipeline

Instead of storing backups only locally or on Google Drive with fragile tokens, backups are streamed directly to **Cloudflare R2 Object Storage**:

```
Client MongoDB ──► mongodump gzip ──► Cloudflare R2 Bucket (clienthub-backups)
                                      └── /backups/{clientKey}/{YYYY-MM-DD_HH-mm-ss}.sql.gz
```

### Backup Script (`scripts/backup-to-r2.sh`):
1. Runs `docker exec <mongo-container> mongodump --archive --gzip`.
2. Uses AWS-CLI / Rclone / Node.js S3 SDK using Cloudflare R2 Access Keys (`5f05...`).
3. Retains daily archives for 30 days in R2 with zero egress fees.

---

## 📅 6. Centralized Scheduling & Execution Flow

1. **Cloudflare Worker Cron Trigger (e.g. `0 3 * * *` at 3:00 AM UTC):**
   - Fires a scheduled cron event on Central Hub.
   - Pushes `BACKUP_DATABASE` tasks to the `remote_tasks` queue for all registered clients.
2. **Sidecar Agents pick up the task**, execute the backup script, upload to R2, and update status to `completed`.
3. **Central Dashboard reflects live status** and backup download links immediately.
