# 📖 docsNlogs: System Overview & Architecture Hub

## 🌟 Introduction
**docsNlogs** is a lightweight, edge-first developer portal and central AI documentation & action logs repository designed for multi-tenant and white-label development environments.

Powered by **Cloudflare D1 (Serverless SQLite at the Edge)**, it provides instant sync, zero-latency query response, and structured project governance.

---

## 🎯 Core Capabilities

### 1. Multi-Project Registry
- Track any number of projects (e.g. `docsNlogs`, `client-erp`, `pos-system`).
- Isolate documentation categories and action log streams per project.

### 2. Hierarchical Tree-View Navigation
- **Root**: Registered projects list.
- **DOCs Folder Tree**: Categorized folders (`Architecture`, `Backend`, `Frontend`, `Dashboard`) containing rich markdown pages.
- **Features & Task Tree**: Epics `FEAT-X` and Sub-tasks `TASK-X-Y`.
- **AI Action Logs Stream**: Real-time audit logs of code alterations, prompts, file changes, and git commit hashes.

### 3. Developer & AI Assistant SDK
- `scripts/init-config.js`: 1-minute interactive onboarding for any client repository.
- `scripts/log.js`: Automatic capture of changed files, git commit ID, prompts, and summaries directly to Cloudflare D1.

---

## 🛠️ Quick Commands

```bash
# Start Frontend (3000) & Backend API (5000) concurrently
npm run dev

# Ingest AI action log from terminal
node scripts/log.js --scope frontend --feat FEAT-1 --task TASK-1-2 --summary "Implemented Tree-View Sidebar" --files "src/components/SidebarTree.tsx"
```
