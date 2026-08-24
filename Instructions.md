# 📖 docsNlogs: Centralized AI Documentation & Action Logs Hub

Welcome to **docsNlogs**, a lightweight developer workspace and central documentation/AI action logging system powered by **Cloudflare D1 (Serverless SQLite at Edge)**.

---

## ⚡ Quick Start (Running the Hub)

### 1. Run Frontend & Backend Concurrently
To start both the **Next.js Frontend (Port 3000)** and **Express API Backend (Port 5000)** with one command:

```bash
npm run dev
```

- 🌐 **Frontend Dashboard:** [http://localhost:3000](http://localhost:3000)
- 🚀 **Backend API:** [http://localhost:5000](http://localhost:5000)
- 🔍 **Health Check:** `http://localhost:5000/api/health`

---

## 🔌 Plug & Play in Any Client / White-Label Project

You can integrate `docsNlogs` into any of your external client projects, white-label apps, or ERPs in 2 simple steps:

### Step 1: Initialize Configuration (Interactive Wizard)
Run the interactive setup wizard from the project root:

```bash
node scripts/init-config.js
```

The CLI will prompt you for:
1. **Project Name** (e.g. `Client ERP`, `Ecommerce Dashboard`)
2. **Project Slug** (e.g. `client-erp`)
3. **Description**
4. **Hub API URL** (Default: `http://localhost:5000` or your VPS URL)
5. **Initial Documentation Categories** (`Architecture, Backend, Frontend, Dashboard`)
6. **Action Log Scopes** (`frontend, backend, dashboard`)

> ✨ This automatically creates `.config/config.json` and registers/onboards the project into Cloudflare D1.

---

### Step 2: Push AI Action Logs
Whenever you or your AI coding assistant make code changes, run:

```bash
node scripts/log.js --scope backend --feat FEAT-1 --task TASK-1-1 --summary "Added Stripe Webhook handler" --files "src/api/webhook.ts"
```

#### Minimal Usage:
```bash
node scripts/log.js --summary "Fixed navigation bar padding bug"
```

#### CLI Flags:
| Flag | Description | Example |
|---|---|---|
| `--summary` | **(Required)** Brief summary of the change | `--summary "Added JWT auth"` |
| `--scope` | Target scope (`backend`, `frontend`, `dashboard`) | `--scope backend` |
| `--feat` | JIRA-style Feature ID / Epic key | `--feat FEAT-1` |
| `--task` | JIRA-style Subtask ID | `--task TASK-1-1` |
| `--action` | Action type (`feature`, `bugfix`, `refactor`, `config`) | `--action bugfix` |
| `--files` | Comma-separated modified files | `--files "src/auth.ts,src/db.ts"` |
| `--prompt` | AI prompt or instructions used | `--prompt "Fix token expiry"` |

---

## 🗄️ Database Management & Diagnostic Scripts

### 1. Check Database Health & Table Counts
Verify live Cloudflare D1 connection, table rows, and registered projects:

```bash
npx tsx server/check-db.ts
```

### 2. Reset and Re-seed Hub Database
Wipe all tables and re-initialize the default `docsNlogs` project with Architecture, Backend, and Frontend docs:

```bash
npx tsx server/reset-db.ts
```

---

## 🏗️ Architecture & Hierarchy (JIRA Style)

```
Project (e.g. "docsNlogs", "client-erp")
│
├── 📚 Docs (Categories: Architecture, Backend, Frontend, Dashboard)
│     └── Markdown Content & Code Snippets
│
└── 📝 JIRA-Style Features & Tasks
      └── Epic / Feature (e.g. FEAT-101: "Auth System")
            └── Sub-topic / Task (e.g. TASK-101-1: "JWT Middleware")
                  └── AI Action Logs (Summary, Diff, Files, Prompts)
```

---

## 🤖 AI Assistant Rule (Copy to your client projects)
Add this prompt rule to your client projects so your AI assistant logs changes automatically:

> *"After making any architectural decisions, bug fixes, or completing new features, run `node scripts/log.js --summary '<Short description>' --scope <frontend|backend> --files '<comma_separated_files>'` to keep our central docsNlogs hub synchronized."*
