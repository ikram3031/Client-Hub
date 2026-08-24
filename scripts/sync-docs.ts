import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { queryD1 } from "../server/config/d1";
import { randomUUID } from "crypto";

dotenv.config();

const overviewContent = `# 📖 docsNlogs: System Overview & Architecture Hub

## 🌟 Introduction
**docsNlogs** is a lightweight, edge-first developer portal and central AI documentation & action logs repository designed for multi-tenant and white-label development environments.

Powered by **Cloudflare D1 (Serverless SQLite at the Edge)**, it provides instant sync, zero-latency query response, and structured project governance.

---

## 🎯 Core Capabilities

### 1. Multi-Project Registry
- Track any number of projects (e.g. \`docsNlogs\`, \`client-erp\`, \`pos-system\`).
- Isolate documentation categories and action log streams per project.

### 2. Hierarchical Tree-View Navigation
- **Root**: Registered projects list.
- **DOCs Folder Tree**: Categorized folders (\`Architecture\`, \`Backend\`, \`Frontend\`, \`Dashboard\`) containing rich markdown pages.
- **Features & Task Tree**: Epics \`FEAT-X\` and Sub-tasks \`TASK-X-Y\`.
- **AI Action Logs Stream**: Real-time audit logs of code alterations, prompts, file changes, and git commit hashes.

### 3. Developer & AI Assistant SDK
- \`scripts/init-config.js\`: 1-minute interactive onboarding for any client repository.
- \`scripts/log.js\`: Automatic capture of changed files, git commit ID, prompts, and summaries directly to Cloudflare D1.

---

## 🛠️ Quick Commands

\`\`\`bash
# Start Frontend (3000) & Backend API (5000) concurrently
npm run dev

# Ingest AI action log from terminal
node scripts/log.js --scope frontend --feat FEAT-1 --task TASK-1-2 --summary "Implemented Tree-View Sidebar" --files "src/components/SidebarTree.tsx"
\`\`\`
`;

const d1archContent = `# ⚡ Cloudflare D1 Database Architecture

## 🗄️ Database Tables Overview
docsNlogs uses 5 core SQLite tables hosted on Cloudflare D1:

1. **\`projects\`**: Registry of all client and internal workspaces.
2. **\`docs\`**: Markdown documentation pages partitioned by \`project_slug\` and \`category\`.
3. **\`features\`**: High-level JIRA-style Epics and milestones (\`FEAT-1\`, \`FEAT-2\`).
4. **\`subtasks\`**: Granular tasks tied to features (\`TASK-1-1\`, \`TASK-1-2\`).
5. **\`logs\`**: AI action logs containing modified files, diff summaries, user prompts, and \`commit_id\`.

---

## 📊 SQL Schema

\`\`\`sql
CREATE TABLE IF NOT EXISTS logs (
  id TEXT PRIMARY KEY,
  project_slug TEXT NOT NULL,
  scope TEXT NOT NULL,
  feature_key TEXT,
  sub_task_key TEXT,
  action TEXT DEFAULT 'feature',
  summary TEXT NOT NULL,
  prompt_used TEXT DEFAULT '',
  changed_files TEXT DEFAULT '[]',
  diff_summary TEXT DEFAULT '',
  commit_id TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
\`\`\`
`;

const backendContent = `# 🚀 Backend REST API Reference

The backend operates on port \`5000\` using Express.js and the official Cloudflare D1 REST query driver.

---

## 📡 Endpoints

### 1. Projects
- \`GET /api/projects\` - List all registered projects.
- \`POST /api/projects\` - Register a new project.
- \`GET /api/projects/:slug\` - Get project details.

### 2. Documentation
- \`GET /api/projects/:slug/docs\` - List docs for a project.
- \`GET /api/projects/:slug/docs/:docSlug\` - Get single document.
- \`POST /api/projects/:slug/docs\` - Create new document.
- \`PUT /api/projects/:slug/docs/:docSlug\` - Update document content.
- \`DELETE /api/projects/:slug/docs/:docSlug\` - Delete document.

### 3. AI Action Logs
- \`GET /api/projects/:slug/logs?scope=frontend&featureKey=FEAT-1\` - Query filtered logs.
- \`POST /api/projects/:slug/logs\` - Ingest log with \`summary\`, \`scope\`, \`commitId\`, and \`changedFiles\`.

\`\`\`bash
# Ingest test log via cURL
curl -X POST http://localhost:5000/api/projects/docsnlogs/logs \\
  -H "Content-Type: application/json" \\
  -d '{"summary": "Created REST API Docs", "scope": "backend", "commitId": "87f0924"}'
\`\`\`
`;

const frontendContent = `# 🌲 Frontend UI & Tree Navigation Architecture

## 🧭 Navigation Hierarchy
The user interface is designed around a zero-clutter developer experience:

\`\`\`
[Root: Projects]
  └── docsNlogs
        ├── 📁 DOCs
        │     ├── 📁 Architecture
        │     │     ├── 📄 System Overview
        │     │     └── 📄 Cloudflare D1 Schema
        │     ├── 📁 Backend
        │     │     └── 📄 REST API Reference
        │     ├── 📁 Frontend
        │     │     └── 📄 Tree View Architecture
        │     └── 📁 Dashboard
        │           └── 📄 Multi-Project Management
        └── 📁 Features & Logs
              └── 🎯 FEAT-1: Core Hub Setup
                    └── 📝 Logs Stream
\`\`\`

---

## 📋 Direct Copy Code Blocks
All code snippets and CLI commands feature a 1-click direct copy button in the top-right corner of code blocks.
`;

const dashboardContent = `# 🏢 Multi-Project Workspace Governance

## 🎯 White-Label & Client Scenarios
\`docsNlogs\` allows developers to connect multiple remote or local projects into one central hub:

1. **Client ERP App**: \`client-erp\`
2. **White-label Mobile POS**: \`whitelabel-pos\`
3. **Internal Tools**: \`docsNlogs\`

---

## ⚡ Setup Workflow
In any client repo root:

\`\`\`bash
node scripts/init-config.js
\`\`\`

Follow the interactive prompts to automatically register and link the project to the centralized hub.
`;

const docsData = [
  {
    relPath: "Overview.md",
    category: "Architecture",
    title: "System Overview & Hub Architecture",
    slug: "system-overview",
    content: overviewContent,
  },
  {
    relPath: "Architecture/D1-Schema-Design.md",
    category: "Architecture",
    title: "Cloudflare D1 Schema & Edge Storage",
    slug: "d1-schema-design",
    content: d1archContent,
  },
  {
    relPath: "Backend/API-Reference.md",
    category: "Backend",
    title: "Express & D1 REST API Reference",
    slug: "api-reference",
    content: backendContent,
  },
  {
    relPath: "Frontend/Tree-View-Architecture.md",
    category: "Frontend",
    title: "Hierarchical Tree Navigation & Markdown Reader",
    slug: "tree-view-architecture",
    content: frontendContent,
  },
  {
    relPath: "Dashboard/Multi-Project-Management.md",
    category: "Dashboard",
    title: "Multi-Project & Client Workspace Governance",
    slug: "multi-project-management",
    content: dashboardContent,
  },
];

async function sync() {
  const projectSlug = "docsnlogs";
  console.log("🔄 Syncing DOCs folder & Cloudflare D1 database...");

  const existingProj = await queryD1("SELECT * FROM projects WHERE slug = ?", [projectSlug]);
  if (existingProj.length === 0) {
    await queryD1(
      "INSERT INTO projects (id, name, slug, description, docs_categories, log_scopes) VALUES (?, ?, ?, ?, ?, ?)",
      [
        randomUUID(),
        "docsNlogs",
        "docsnlogs",
        "Centralized AI Documentation and Action Logs Hub",
        JSON.stringify(["Architecture", "Backend", "Frontend", "Dashboard"]),
        JSON.stringify(["architecture", "backend", "frontend", "dashboard"]),
      ]
    );
  }

  for (const doc of docsData) {
    // 1. Write file to DOCs directory
    const fullPath = path.join(process.cwd(), "DOCs", doc.relPath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, doc.content, "utf-8");
    console.log("📁 Written to disk:", fullPath);

    // 2. Sync to Cloudflare D1
    const exists = await queryD1("SELECT * FROM docs WHERE project_slug = ? AND slug = ?", [projectSlug, doc.slug]);
    if (exists.length > 0) {
      await queryD1(
        "UPDATE docs SET category = ?, title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE project_slug = ? AND slug = ?",
        [doc.category, doc.title, doc.content, projectSlug, doc.slug]
      );
      console.log("🔄 Updated in D1:", doc.slug);
    } else {
      await queryD1(
        "INSERT INTO docs (id, project_slug, category, title, slug, content, tags, last_edited_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [randomUUID(), projectSlug, doc.category, doc.title, doc.slug, doc.content, JSON.stringify([doc.category.toLowerCase()]), "AI Architect"]
      );
      console.log("✨ Inserted into D1:", doc.slug);
    }
  }

  console.log("🎉 Docs sync complete!");
}

sync().catch(console.error);
