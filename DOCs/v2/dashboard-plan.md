# 🖥️ ClientHub: Dashboard & Frontend Monorepo Plan (v2)

> **Document Version:** 2.0.0  
> **Target Scope:** Modular Monorepo Architecture, Shared UI Components, and Independent Sub-Applications  
> **Status:** Approved Architectural Blueprint

---

## 🎯 1. Monorepo Architecture & Package Design

To maintain **high modularity, zero code duplication, and strict security boundaries**, the frontend codebase is partitioned into **1 Central Shared Library** and **3 Isolated Applications**, each having its own `package.json` and build pipeline:

```
F:\Client-Hub
│
├── shared/                         # 🌟 Shared Reusable UI & Utility Library
│   ├── components/                 # Atomic UI (Button, Modal, Card, Table, Input, Badge, etc.)
│   ├── hooks/                      # useTheme, useApi, useDebounce, useToast
│   ├── utils/                      # formatters, dateUtils, apiFetchClient
│   └── types/                      # TypeScript schemas (Client, Ticket, Log, Metric)
│
└── apps/
    ├── central-dashboard/          # 👑 Master Super-Admin Fleet Control Center
    │   ├── package.json
    │   ├── vite.config.ts          # Configured with `@shared/*` path aliases
    │   └── src/
    │       ├── pages/              # FleetMatrix, VersionGrid, TicketBoard, TaskManager, BillingHub
    │       └── components/         # MetricCards, DeployModal, TelemetryChart, TicketDetail
    │
    ├── client-portal/              # 🤝 Client Self-Service & Support Portal
    │   ├── package.json
    │   ├── vite.config.ts
    │   └── src/
    │       ├── pages/              # Overview, IssueReporter, HostingStatus, Invoices
    │       └── components/         # TicketCreateModal, ExpiryBanner, HealthBadge
    │
    └── docs-logs/                  # 📖 AI Documentation & Action Logs Hub
        ├── package.json
        ├── vite.config.ts
        └── src/
            ├── pages/              # DocsPage, EditDocPage, LogsTimeline
            └── components/         # DocReader, CodeBlock, AIAssistantDrawer
```

---

## 💎 2. Central Shared Library (`shared/`)

The `shared/` package contains production-ready, dark-mode-first components built on top of **Tailwind CSS v4** and **Radix / Base UI** primitives.

### Directory Structure & Responsibilities:

| Directory | Contained Modules | Key Features |
|---|---|---|
| `shared/components/ui/` | `Button.tsx`, `Modal.tsx`, `Card.tsx`, `Input.tsx`, `Table.tsx`, `Badge.tsx`, `Tooltip.tsx` | Accessible, polymorphic, Tailwind-styled, zero runtime overhead. |
| `shared/components/theme/` | `ThemeProvider.tsx`, `ThemeToggle.tsx` | Seamless dark/light theme switching with `next-themes` and CSS variables. |
| `shared/hooks/` | `useApi.ts`, `useTheme.ts`, `usePolling.ts` | Type-safe REST fetching with auto-retry and real-time polling timers. |
| `shared/utils/` | `apiClient.ts`, `cn.ts`, `dateFormat.ts` | Unified `clsx` + `tailwind-merge` class helper, ISO date formatters. |
| `shared/types/` | `fleet.types.ts`, `ticket.types.ts`, `log.types.ts` | Single source of truth for all JSON contracts and D1 database responses. |

### Tailwind CSS Class Sharing Config:
To ensure Tailwind v4 extracts utility classes used inside `shared/`, every app includes `../../shared` in its content scanner:

```javascript
// apps/*/vite.config.ts or Tailwind CSS v4 source scanning
@import "tailwindcss";
@source "../../shared/**/*.{js,ts,jsx,tsx}";
```

---

## 👑 3. App 1: `central-dashboard` (Super-Admin Fleet Command Center)

The central command dashboard gives you complete oversight of all deployed clients across your VPS fleet.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        PLEXIVIA CLIENTHUB MASTER FLEET DASHBOARD                       │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [Summary Bar] Total: 4 Clients | 3 Healthy | 1 Degraded | Overall Storage: 54% Used   │
├─────────────┬───────────┬──────────────┬──────────────┬──────────────┬─────────────────┤
│ Client Name │ Version   │ VPS Storage  │ DB Health    │ Hosting Exp  │ Actions         │
├─────────────┼───────────┼──────────────┼──────────────┼──────────────┼─────────────────┤
│ Decantre    │ v2.4.1    │ [||||  ] 42% │ Connected    │ 120 Days     │ [Deploy] [Dump] │
│ Engulfic    │ v2.3.0 ⚠️ │ [||||||] 78% │ Connected    │ 14 Days ⚠️   │ [Deploy] [Dump] │
│ Toyoland    │ v2.4.1    │ [||||||] 86% │ Connected    │ 280 Days     │ [Deploy] [Dump] │
└─────────────┴───────────┴──────────────┴──────────────┴──────────────┴─────────────────┘
```

### Core Features:
1. **Fleet Health & Telemetry Grid:**
   - Real-time disk storage bar (Total / Used / Free %), RAM usage (MB), CPU load, and MongoDB uptime.
2. **Version & Release Matrix:**
   - Highlights clients running outdated releases and shows git commit SHAs.
3. **One-Click Remote Task Dispatcher:**
   - `[Deploy Latest]` triggers a signed `DEPLOY_LATEST` task on the client's VPS.
   - `[Trigger Backup]` triggers an instant mongodump and streams it to Cloudflare R2.
4. **Support Ticket Command Desk:**
   - View, assign, and resolve incoming client support tickets with attached error traces and device logs.
5. **Hosting Billing & Renewal Manager:**
   - Configure renewal dates, pricing, and broadcast custom renewal warning banners to the client's dashboard.

---

## 🤝 4. App 2: `client-portal` (Client Self-Service & Issue Hub)

A lightweight, white-labelable web portal for your clients to track their store infrastructure and report issues.

### Core Features:
1. **1-Click Issue / Bug Reporting Modal:**
   - Client selects issue category (UI Glitch, Order Mismatch, Gateway Issue, Stock Error).
   - Automatically attaches:
     - Current page URL and route
     - Browser and OS metadata
     - Last 5 console errors and failed API endpoints
     - Screenshot drag-and-drop
2. **Hosting Renewal & Expiry Alert Widget:**
   - Shows remaining hosting subscription days.
   - Displays clear renewal invoices and payment instructions before expiry.
3. **Storefront Health Overview:**
   - Simple green/yellow/red status indicators for Storefront API, Database, and Background Queues (Zero technical jargon).

---

## 📖 5. App 3: `docs-logs` (AI Documentation & Action Logs Hub)

The standalone evolution of the existing docs and action logs repository:
1. **Interactive Markdown Doc Reader:** Clean navigation by project categories (`Architecture`, `Backend`, `Frontend`, `Dashboard`).
2. **AI Action Logs Timeline:** Visual log feed grouped by Scope (`AB-`, `AD-`, `DEP-`), Action Type (`feat`, `fix`, `refc`), and Git Commit SHA.
3. **Gemini AI Doc Assistant:** In-app doc writer and refactoring assistant powered by `@google/genai`.

---

## 🚀 6. Independent Build & Deployment Strategy

Each sub-application can be deployed independently without interfering with others:

| Application | Build Command | Production Output | Recommended Hosting |
|---|---|---|---|
| `central-dashboard` | `cd apps/central-dashboard && npm run build` | `dist/` | Cloudflare Pages with Zero Trust Access |
| `client-portal` | `cd apps/client-portal && npm run build` | `dist/` | Cloudflare Pages / Client Subdomain (`portal.*`) |
| `docs-logs` | `cd apps/docs-logs && npm run build` | `dist/` | Central VPS Express or Cloudflare Pages |
