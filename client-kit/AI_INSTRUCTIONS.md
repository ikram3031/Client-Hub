# 🤖 AI Assistant Instructions: Commit & Action Logging Rule

> **FOR AI CODING ASSISTANTS (Antigravity, Gemini, Claude, Cursor, Copilot, ChatGPT):**
> Read this document carefully before making changes or committing code in this repository.

---

## 📌 1. Central Logging Objective
This repository is connected to a centralized **docsNlogs Hub** (`http://localhost:5000` or server VPS URL). Every architectural decision, code change, bugfix, or feature commit must be automatically ingested into the central hub using the local helper script `client-kit/log.js`.

---

## 🏷️ 2. Git Commit & Tagging Standard

Always format git commits and action log messages using the standard format:

```
<LogID>(<type>): <short description>
```

### Log ID Prefix by Scope:
| Prefix | Scope | Description | Examples |
|---|---|---|---|
| **#AB** | `backend` | API routes, database queries, controllers, middleware, server config | `AB01`, `AB02`, `AB85` |
| **#AD** | `frontend` / `dashboard` | UI components, React/Vue views, CSS/styling, state stores | `AD01`, `AD02`, `AD76` |
| **#AA** | `architecture` | Project setup, folder structure, system design, schema definitions | `AA01`, `AA02`, `AA10` |

### Action Types (`<type>`):
- `feat`: New feature or capability
- `fix`: Bugfix or error resolution
- `refc`: Refactoring without functional changes
- `docs`: Documentation addition or modification
- `perf`: Performance optimization
- `config`: Configuration or environment changes
- `test`: Unit, integration, or E2E tests

---

## 🚀 3. How to Execute the Logger

Whenever you complete a task or commit changes to Git, execute the logger script from the project root:

### Option A: Fully Automated (Zero Flags)
If you already made a git commit, run:
```bash
node client-kit/log.js
```
*✨ The script will automatically extract the commit hash, commit message, modified files, and compute the next sequential LogID!*

### Option B: Positional Message Format
```bash
node client-kit/log.js "AB01(feat): add JWT authentication middleware"
```

### Option C: Explicit CLI Flags
```bash
node client-kit/log.js --scope backend --action feat --summary "Add user registration endpoint" --files "src/routes/auth.ts" --prompt "Create auth endpoint"
```

---

## ⚙️ 4. Project Configuration (`config.json`)
The client kit reads its configuration from `client-kit/config.json`:
- `hubApiUrl`: Base URL of the central docsNlogs hub (e.g. `http://localhost:5000` or your production server URL).
- `project.slug`: Unique identifier for this project on the central hub.

---

## 🛡️ 5. Git Isolation Rule
Ensure the `client-kit/` directory is listed in `.gitignore` of this repository so local helper scripts and configurations do not pollute the client repository's version control.
