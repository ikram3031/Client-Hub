# ☁️ ClientHub: Cloudflare Architecture & Centralization Blueprint (v2)

> **Document Version:** 2.0.0  
> **Target Scope:** Cloudflare Services (D1, R2, Workers, Cron, Email Routing, DNS) & Centralization Map  
> **Status:** Approved Architectural Blueprint

---

## 🎯 1. Cloudflare Infrastructure Blueprint

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                   CLOUDFLARE SUITE INTEGRATION (PLEXIVIA-WHITELABEL)                    │
│                                                                                        │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌────────────────────────────┐  │
│  │     Cloudflare D1     │  │     Cloudflare R2     │  │   Cloudflare Workers/Cron  │  │
│  │ (Serverless SQLite DB)│  │ (S3 Database Backups) │  │  (Scheduled Automations)   │  │
│  └───────────┬───────────┘  └───────────┬───────────┘  └─────────────┬──────────────┘  │
│              │                          │                            │                 │
│              ▼                          ▼                            ▼                 │
│  • Client Fleet Registry    • Daily mongodump .sql.gz   • Nightly DB Backup Triggers   │
│  • Telemetry Logs           • Media & Brand Assets      • 2-Min Fleet Health Probing   │
│  • Support Tickets & Tasks  • Zero Egress Bandwidth Fee • Hosting Expiry Checkers      │
│  • Hosting Billing Matrix                                                              │
└────────────────────────────────────────┬───────────────────────────────────────────────┘
                                         │
                 Encrypted API & Telemetry Channel (Zero Business Data)
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐
│     CLIENT VPS 1      │  │     CLIENT VPS 2      │  │     CLIENT VPS 3      │
│      (Decantre)       │  │      (Engulfic)       │  │      (Toyoland)       │
└───────────────────────┘  └───────────────────────┘  └───────────────────────┘
```

---

## ☁️ 2. Cloudflare Service Breakdown & Configuration

### 1. Cloudflare D1 (Serverless Database at the Edge)
- **Account:** `plexivia-whitelabel` (`fa0942a4bd8e442e22f78fdb6a2a605a`)
- **Database:** `clienthub-d1`
- **Role:** Primary persistent data store for all fleet metadata, client registry, support tickets, remote command queues, and time-series heartbeat records.
- **Why D1?** Globally distributed, zero operational maintenance, serverless scaling, instant REST query API, and 100% free/low-cost.

---

### 2. Cloudflare R2 (S3-Compatible Object Storage)
- **Bucket:** `clienthub-backups`
- **S3 Endpoint:** `https://fa0942a4bd8e442e22f78fdb6a2a605a.r2.cloudflarestorage.com`
- **Access Key ID:** `5f0500c118548702bac32a3d027bc355`
- **Secret Access Key:** `9d1693a66753deb308fff14315b34abcae11e16d12b5796457d92abb73259514`
- **Role:** Receives automated MongoDB database dump archives (`.sql.gz`) from all client VPSs.
- **Why R2?** 100% S3-compatible, ultra-fast uploads from VPS, zero egress bandwidth fees, and built-in lifecycle retention rules (auto-delete backups older than 30 days).

---

### 3. Cloudflare Workers & Cron Triggers
- **Cron Triggers:**
  - `*/2 * * * *` (Every 2 minutes): Audits client heartbeats, flags nodes with no heartbeat for $>5\text{ mins}$ as `degraded`/`offline`.
  - `0 3 * * *` (Daily at 3:00 AM UTC): Generates `BACKUP_DATABASE` tasks in D1 for all active client VPS agents.
  - `0 0 * * *` (Daily Midnight): Calculates hosting expiration countdowns and activates warning banners for subscriptions expiring in $\le 14\text{ days}$.

---

### 4. Cloudflare DNS & Email Routing Architecture
- **Inbound Support Email (Free Cloudflare Email Routing):**
  - Configured on client domains to forward `support@clientdomain.com` directly to client owner personal inboxes without requiring cPanel storage.
- **Outbound Transactional Email (Shared Hosting SMTP / API):**
  - **Gray Cloud (DNS Only)** rule for all email records (`MX`, `mail A record`, `SPF TXT`, `DKIM TXT`).
  - Strict prevention of Orange Cloud proxying on SMTP ports.

---

## 🗺️ 3. Centralized vs Client-Side Responsibility Matrix

| Subsystem / Feature | Managed Centrally (Cloudflare / ClientHub) | Managed Locally on Client VPS |
|---|---|---|
| **Fleet Registry & Status** | ✅ Stored in Cloudflare D1 | ❌ Reports metrics via Sidecar Agent |
| **Release Version Matrix** | ✅ Displays all client versions & git SHAs | ❌ Holds local git repository |
| **Database Backups** | ✅ Stored & archived in Cloudflare R2 | ❌ Executes local `mongodump` binary |
| **Cron Scheduling** | ✅ Cloudflare Cron Triggers | ❌ Zero cron overhead on client VPS |
| **Customer / Order Data** | ❌ ZERO customer/business data collected | ✅ Fully isolated in client's local MongoDB |
| **Support Tickets** | ✅ Central inbox for developer response | ❌ Submit modal in client dashboard |
| **Hosting Renewal Banners** | ✅ Configured in Central Billing Hub | ❌ Rendered in Client Dashboard UI |
| **eCommerce Processing** | ❌ None | ✅ Runs in Docker backend & React storefront |
