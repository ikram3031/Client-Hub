# 📖 docsNlogs: Centralized AI Documentation & Action Logs Hub

A lightweight developer workspace, centralized documentation repository, and AI action logging system powered by **Cloudflare D1 (Serverless SQLite at the Edge)**.

---

## ⚡ Quick Start

### 1. Start the Central Hub Server & Viewer UI
```bash
npm run dev
# or
npm start
```

- 🌐 **Web Viewer UI:** [http://localhost:5000](http://localhost:5000)
- 🚀 **REST API Base:** [http://localhost:5000/api](http://localhost:5000/api)
- 🔍 **Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 📦 Drop-in Client Kit (`client-kit/`)

You can integrate `docsNlogs` into any of your external client projects, white-label apps, or ERPs in 3 simple steps:

### Step 1: Copy `client-kit/` to Target Project
Copy the `client-kit/` folder into your client project root and add it to `.gitignore`:

```gitignore
/client-kit/
/.config/
```

### Step 2: Initialize Project Configuration
Run the setup wizard inside your project:

```bash
node client-kit/init.js
```

### Step 3: Tell Your AI Assistant (Antigravity, Gemini, Claude, Cursor)
Ask your AI assistant to follow [`client-kit/AI_INSTRUCTIONS.md`](./client-kit/AI_INSTRUCTIONS.md):

> *"After making code changes or committing to git, execute `node client-kit/log.js` to log your changes and commit tags to our central docsNlogs hub."*

---

## 🏷️ Commit Standard & Log IDs

| Tag Prefix | Scope | Examples |
|---|---|---|
| **#AB** | `backend` (APIs, Database, Controllers, Middleware) | `AB01`, `AB02` |
| **#AD** | `frontend` (UI, Views, Styling, Components) | `AD01`, `AD02` |
| **#AA** | `architecture` (Infra, Docs, Schemas, Core Setup) | `AA01`, `AA02` |

---

## 🛠️ CLI Logger Commands

```bash
# Auto-detect latest git commit, hash, and modified files
node client-kit/log.js

# Custom commit message format
node client-kit/log.js "AB01(feat): add JWT authentication middleware"

# Explicit CLI flags
node client-kit/log.js --scope backend --action feat --summary "Add webhook handler" --files "src/webhook.ts"
```
