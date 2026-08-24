import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { queryD1 } from "../server/config/d1";
import { randomUUID } from "crypto";

dotenv.config();

// Recursively discovers all markdown files in the DOCs directory
const getAllDocFiles = (dir: string): string[] => {
  let results: string[] = [];
  const list = fs.readdirSync(dir);

  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllDocFiles(fullPath));
    } else if (file.endsWith(".md")) {
      results.push(fullPath);
    }
  });

  return results;
};

// Synchronizes local markdown files with Cloudflare D1 database
const syncAllDocsToD1 = async () => {
  const projectSlug = "docsnlogs";
  console.log("🔄 [Docs Sync Engine] Scanning DOCs folder & synchronizing to Cloudflare D1...");

  const docsDir = path.join(process.cwd(), "DOCs");
  if (!fs.existsSync(docsDir)) {
    console.error("❌ Error: DOCs directory not found!");
    return;
  }

  const files = getAllDocFiles(docsDir);

  for (const filePath of files) {
    const relative = path.relative(docsDir, filePath);
    const content = fs.readFileSync(filePath, "utf-8");
    const filename = path.basename(filePath, ".md");

    // Derive category from parent directory or default to Architecture
    const parsedPath = path.parse(relative);
    const category = parsedPath.dir ? parsedPath.dir.split(path.sep)[0] : "Architecture";

    // Extract title from first markdown heading or filename
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].replace(/^[^\w\s]+/, "").trim() : filename;
    const slug = filename.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const exists = await queryD1("SELECT * FROM docs WHERE project_slug = ? AND slug = ?", [projectSlug, slug]);

    if (exists.length > 0) {
      await queryD1(
        "UPDATE docs SET category = ?, title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE project_slug = ? AND slug = ?",
        [category, title, content, projectSlug, slug]
      );
      console.log(`🔄 Updated in D1: [${category}] ${title} (slug: ${slug})`);
    } else {
      await queryD1(
        "INSERT INTO docs (id, project_slug, category, title, slug, content, tags, last_edited_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [randomUUID(), projectSlug, category, title, slug, content, JSON.stringify([category.toLowerCase()]), "AI Architect"]
      );
      console.log(`✨ Inserted into D1: [${category}] ${title} (slug: ${slug})`);
    }
  }

  console.log("🎉 All DOCs synchronized successfully with Cloudflare D1!");
};

syncAllDocsToD1().catch(console.error);
