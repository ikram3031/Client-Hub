# 📖 docsNlogs: Centralized AI Documentation & Action Logs Hub

Welcome to **docsNlogs**, a lightweight developer workspace and centralized AI documentation & action logging system powered by **Cloudflare D1 (Serverless SQLite at the Edge)**.

---

## ⚡ Quick Start (Running the Hub)

### 1. Run Standalone Backend & Web Viewer
To start the Hub on port **5000**:

```bash
npm run dev
# or
npm start
```

- 🌐 **Web Viewer UI:** [http://localhost:5000](http://localhost:5000)
- 🚀 **REST API Base:** [http://localhost:5000/api](http://localhost:5000/api)
- 🔍 **Health Check:** `http://localhost:5000/api/health`

---

## 🔌 Plug & Play in Any Client / White-Label Project

You can integrate `docsNlogs` into any of your external client projects, white-label apps, or ERPs:

### Step 1: Copy `client-kit/` to Target Project
Copy the `client-kit/` folder into your client project root and add it to `.gitignore`:

```gitignore
/client-kit/
/.config/
```

### Step 2: Initialize Configuration (Interactive Wizard)
Run the interactive setup wizard inside your client project:

```bash
node client-kit/init.js
```

The CLI will prompt you for:
1. **Project Name** (e.g. `Client ERP`, `Ecommerce Dashboard`)
2. **Project Slug** (e.g. `client-erp`)
3. **Description**
4. **Hub API URL** (Default: `http://localhost:5000` or your VPS URL)
5. **Initial Documentation Categories** (`Architecture, Backend, Frontend, Dashboard`)
6. **Action Log Scopes** (`frontend, backend, architecture, dashboard`)

---

### Step 3: Push AI Action Logs

Whenever you or your AI coding assistant make code changes, run:

```bash
# Automated: reads latest git commit, hash, and changed files
node client-kit/log.js

# Positional standard commit format
node client-kit/log.js "AB01(feat): added Stripe Webhook handler"

# Explicit CLI flags
node client-kit/log.js --scope backend --action feat --summary "Added Stripe Webhook handler" --files "src/api/webhook.ts"
```

#### CLI Flags:
| Flag | Description | Example |
|---|---|---|
| `--summary` | **(Required)** Brief summary of the change | `--summary "Added JWT auth"` |
| `--scope` | Target scope (`backend`, `frontend`, `architecture`) | `--scope backend` |
| `--action` | Action type (`feat`, `fix`, `refc`, `docs`, `config`) | `--action feat` |
| `--feat` | JIRA-style Feature ID / Epic key | `--feat FEAT-1` |
| `--task` | JIRA-style Subtask ID | `--task TASK-1-1` |
| `--files` | Comma-separated modified files | `--files "src/auth.ts,src/db.ts"` |
| `--prompt` | AI prompt or instructions used | `--prompt "Fix token expiry"` |

---

## 🗄️ Database Management Scripts

### 1. Check Database Health & Table Counts
Verify live Cloudflare D1 connection, table rows, and registered projects:

```bash
npm run check-db
```

### 2. Reset and Re-seed Hub Database
Wipe all tables and re-initialize the default `docsNlogs` project:

```bash
npm run reset-db
```

---

## 🤖 AI Assistant Rule (Copy to your client projects)
Add this prompt rule to your client projects or instruct your AI assistant to read `client-kit/AI_INSTRUCTIONS.md`:

> *"After making any architectural decisions, bug fixes, or completing new features, run `node client-kit/log.js` to keep our central docsNlogs hub synchronized."*
