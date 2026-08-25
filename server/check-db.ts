import dotenv from "dotenv";
import { queryD1 } from "./config/d1";

dotenv.config();

const cleanFrontendCategory = async () => {
  try {
    console.log("Cleaning Frontend category and docs from D1...");
    await queryD1("DELETE FROM docs WHERE category = 'Frontend';");
    await queryD1(`
      UPDATE projects 
      SET docs_categories = '["Architecture","Backend","Dashboard"]',
          log_scopes = '["architecture","backend","dashboard"]'
      WHERE slug = 'docsnlogs';
    `);
    console.log("✅ D1 updated successfully!");
  } catch (err: any) {
    console.error("Error updating D1:", err.message);
  }
};

cleanFrontendCategory();
