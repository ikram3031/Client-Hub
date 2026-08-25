import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { queryD1, initD1Schema } from "./config/d1";
import { randomUUID } from "crypto";

dotenv.config();

const AFULL_DIR = "F:\\AFull";
const PROJECT_SLUG = "wl-ecom";
const PROJECT_NAME = "WL-Ecom";

async function run() {
  console.log("=================================================");
  console.log(`🚀 Onboarding '${PROJECT_NAME}' (${PROJECT_SLUG}) into Cloudflare D1`);
  console.log("=================================================\n");

  await initD1Schema();

  const logScopes = ["backend", "dashboard", "decantre", "engulfic", "toyoland", "architecture", "deployment"];
  const docsCategories = ["Architecture", "Backend", "Dashboard", "Deployment", "Decantre", "Engulfic", "Toyoland", "Pipeline"];

  const existingProject = await queryD1(`SELECT * FROM projects WHERE slug = ?`, [PROJECT_SLUG]);
  if (existingProject.length === 0) {
    console.log(`📦 Registering Project '${PROJECT_NAME}' (slug: ${PROJECT_SLUG})...`);
    await queryD1(
      `INSERT INTO projects (id, name, slug, description, docs_categories, log_scopes) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        PROJECT_NAME,
        PROJECT_SLUG,
        "White-Label Multi-Tenant E-Commerce & Inventory Management Platform (Decantre, Engulfic, Toyoland)",
        JSON.stringify(docsCategories),
        JSON.stringify(logScopes),
      ]
    );
  } else {
    console.log(`ℹ️ Project '${PROJECT_NAME}' already registered. Updating scopes...`);
    await queryD1(
      `UPDATE projects SET name = ?, docs_categories = ?, log_scopes = ? WHERE slug = ?`,
      [PROJECT_NAME, JSON.stringify(docsCategories), JSON.stringify(logScopes), PROJECT_SLUG]
    );
  }

  // Ingest Core Architecture Doc
  const archFile = path.join(AFULL_DIR, "Docs", "00_Architecture.md");
  if (fs.existsSync(archFile)) {
    const content = fs.readFileSync(archFile, "utf-8");
    const docSlug = "system-architecture";
    await queryD1(`DELETE FROM docs WHERE project_slug = ? AND slug = ?`, [PROJECT_SLUG, docSlug]);
    await queryD1(
      `INSERT INTO docs (id, project_slug, category, title, slug, content, tags, last_edited_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        PROJECT_SLUG,
        "Architecture",
        "WL-Ecom System Architecture & Multi-Tenant Blueprint",
        docSlug,
        content,
        JSON.stringify(["architecture", "multi-tenant", "backend", "dashboard"]),
        "Lead Architect",
      ]
    );
    console.log(`✅ [Doc Ingested] WL-Ecom System Architecture`);
  }

  // Ingest Deployments Doc
  const deployFile = path.join(AFULL_DIR, "Docs", "04_Deployments.md");
  if (fs.existsSync(deployFile)) {
    const content = fs.readFileSync(deployFile, "utf-8");
    const docSlug = "deployment-guide";
    await queryD1(`DELETE FROM docs WHERE project_slug = ? AND slug = ?`, [PROJECT_SLUG, docSlug]);
    await queryD1(
      `INSERT INTO docs (id, project_slug, category, title, slug, content, tags, last_edited_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        PROJECT_SLUG,
        "Deployment",
        "WL-Ecom Multi-Tenant Production Deployment Guide",
        docSlug,
        content,
        JSON.stringify(["deployment", "docker", "nginx", "ssl"]),
        "DevOps Lead",
      ]
    );
    console.log(`✅ [Doc Ingested] WL-Ecom Deployment Guide`);
  }

  console.log(`\n🎉 '${PROJECT_NAME}' Onboarding Complete!`);
}

run().catch(console.error);
