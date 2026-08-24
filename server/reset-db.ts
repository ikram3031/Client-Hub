import dotenv from "dotenv";
import { queryD1 } from "./config/d1";
import { randomUUID } from "crypto";

dotenv.config();

/**
 * Resets all Cloudflare D1 tables and provisions fresh "docsNlogs" project
 */
const resetAndSeedProject = async () => {
  console.log("🧹 [Cloudflare D1] Cleaning and resetting all tables...");

  try {
    // 1. Clear all existing records
    await queryD1("DELETE FROM logs;");
    await queryD1("DELETE FROM subtasks;");
    await queryD1("DELETE FROM features;");
    await queryD1("DELETE FROM docs;");
    await queryD1("DELETE FROM projects;");
    console.log("✅ All old records successfully cleared!");

    // 2. Create new Project: docsNlogs
    const projectName = "docsNlogs";
    const projectSlug = "docsnlogs";
    const projectId = randomUUID();
    const docsCategories = ["Architecture", "Backend", "Frontend"];
    const logScopes = ["frontend", "backend", "dashboard"];

    console.log(`📦 Creating fresh project: "${projectName}"...`);
    await queryD1(
      `INSERT INTO projects (id, name, slug, description, docs_categories, log_scopes) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        projectId,
        projectName,
        projectSlug,
        "Centralized AI Documentation & Action Logs Tracking Engine",
        JSON.stringify(docsCategories),
        JSON.stringify(logScopes),
      ]
    );

    // 3. Seed Docs for Architecture, Backend, Frontend
    const docTemplates: Record<string, string> = {
      Architecture: `# System Architecture & Flow: docsNlogs

## High-Level Overview
docsNlogs is a developer-centric, ultra-lightweight centralized documentation and AI action log management hub.

### Core Stack
- **Database Engine:** Cloudflare D1 (Serverless SQLite at Edge)
- **Backend API:** Node.js + Express with modular REST endpoints
- **Frontend App:** Modern React SPA with Shadcn components and dynamic HTML/CSS theming
- **Client SDK:** Zero-dependency CLI/API helper (\`ai-helper.js\`) for instant AI change logging

### Multi-Project Data Isolation
Projects are logically partitioned via \`project_slug\` with indexed queries across documentation, JIRA-style features/tasks, and AI action logs.
`,
      Backend: `# Backend API & Database Specifications

## Endpoints & Schemas
- \`GET /api/projects\` — Retrieve all onboarded projects
- \`POST /api/projects/onboard\` — Onboard project and seed default tables
- \`GET /api/projects/:slug/docs\` — Query project documentation
- \`GET /api/projects/:slug/features\` — JIRA-style nested feature/subtask tree
- \`POST /api/projects/:slug/logs\` — AI Ingestion endpoint for automated logging

## Cloudflare D1 Storage
- SQLite-powered edge database with sub-20ms latency and 5GB zero-cost capacity.
`,
      Frontend: `# Frontend Architecture & UI Guidelines

## Component & Styling Principles
- **Design System:** Lightweight Shadcn / Radix primitives
- **Theming:** CSS Variable-based Dark / Light mode switching
- **Hierarchy Tree:** Collapsible JIRA-style Epics -> Subtasks -> Action Log drawers
- **Markdown Rendering:** Interactive code blocks and markdown previews
`,
    };

    for (const cat of docsCategories) {
      const docId = randomUUID();
      const docSlug = `${cat.toLowerCase()}-overview`;
      const content = docTemplates[cat] || `# ${cat} Documentation for ${projectName}`;

      await queryD1(
        `INSERT INTO docs (id, project_slug, category, title, slug, content, tags, last_edited_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          docId,
          projectSlug,
          cat,
          `${cat} Documentation`,
          docSlug,
          content,
          JSON.stringify([cat.toLowerCase(), "core"]),
          "Architect",
        ]
      );
      console.log(`   - 📄 Created Doc: ${cat}`);
    }

    // 4. Seed Initial Feature & Subtask
    const featId = randomUUID();
    await queryD1(
      `INSERT INTO features (id, project_slug, key, scope, title, description, status, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        featId,
        projectSlug,
        "FEAT-1",
        "backend",
        "Cloudflare D1 Database & REST API Hub",
        "Setup Cloudflare D1 schema and Express API endpoints for docsNlogs",
        "done",
        "high",
      ]
    );

    const taskId = randomUUID();
    await queryD1(
      `INSERT INTO subtasks (id, project_slug, key, feature_key, title, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        taskId,
        projectSlug,
        "TASK-1-1",
        "FEAT-1",
        "Project seed and architecture documentation",
        "done",
        "Initial project configuration ready",
      ]
    );

    // 5. Initial Log
    const logId = randomUUID();
    await queryD1(
      `INSERT INTO logs (id, project_slug, scope, feature_key, sub_task_key, action, summary, prompt_used, changed_files) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        logId,
        projectSlug,
        "backend",
        "FEAT-1",
        "TASK-1-1",
        "config",
        "Initialized docsNlogs project with Architecture, Backend, and Frontend documentation",
        "Setup fresh project with Cloudflare D1",
        JSON.stringify(["server/config/d1.ts", "server/reset-db.ts"]),
      ]
    );

    console.log("\n🎉 docsNlogs project successfully created & seeded in Cloudflare D1!\n");
  } catch (error: any) {
    console.error("❌ Reset Error:", error.message);
    process.exit(1);
  }
};

resetAndSeedProject();
