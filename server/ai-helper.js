#!/usr/bin/env node

/**
 * 🤖 AI / Developer Logging & Onboarding Utility SDK
 * Drop this file into any client project (or run it via CLI/AI rules).
 * 
 * Usage:
 *   1. Onboard Project:
 *      node ai-helper.js onboard --name "client-erp" --desc "White-label ERP"
 * 
 *   2. Push AI Log:
 *      node ai-helper.js log --project "client-erp" --scope backend --feat FEAT-1 --task TASK-1-1 --summary "Fixed DB auth" --files "src/db.ts,src/auth.ts"
 */

const http = require("http");
const https = require("https");

const HUB_API_URL = process.env.HUB_API_URL || "http://localhost:5000";

/**
 * Parses CLI command line flags into key-value pairs
 * @returns {{ command: string, params: Record<string, any> }}
 */
const parseArgs = () => {
  const args = process.argv.slice(2);
  const command = args[0];
  const params = {};

  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].replace(/^--/, "");
      const val = args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : true;
      params[key] = val;
    }
  }

  return { command, params };
};

/**
 * Makes an HTTP/HTTPS request to the Hub backend API
 * @param {string} endpoint - API endpoint route
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {any} data - Request payload data
 * @returns {Promise<any>}
 */
const request = (endpoint, method, data) => {
  return new Promise((resolve, reject) => {
    const url = new URL(`${HUB_API_URL}${endpoint}`);
    const client = url.protocol === "https:" ? https : http;

    const payload = data ? JSON.stringify(data) : "";

    const req = client.request(
      url,
      {
        method,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve(body);
          }
        });
      }
    );

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
};

/**
 * Main SDK CLI entrypoint runner
 */
const main = async () => {
  const { command, params } = parseArgs();

  if (command === "onboard") {
    if (!params.name) {
      console.error("❌ Error: --name is required for onboarding.");
      process.exit(1);
    }

    console.log(`📡 Onboarding project "${params.name}" to Hub...`);
    const res = await request("/api/projects/onboard", "POST", {
      name: params.name,
      slug: params.slug || params.name.toLowerCase().replace(/[^a-z0-9_-]/g, "-"),
      description: params.desc || "",
    });

    console.log("✅ Result:", res);
  } else if (command === "log") {
    if (!params.project || !params.summary) {
      console.error("❌ Error: --project and --summary are required for logging.");
      process.exit(1);
    }

    const payload = {
      scope: params.scope || "backend",
      featureKey: params.feat || null,
      subTaskKey: params.task || null,
      action: params.action || "feature",
      summary: params.summary,
      promptUsed: params.prompt || "",
      changedFiles: params.files ? params.files.split(",").map((f) => f.trim()) : [],
    };

    console.log(`📝 Pushing AI Log to ${params.project}...`);
    const res = await request(`/api/projects/${params.project}/logs`, "POST", payload);
    console.log("✅ Log Stored:", res);
  } else {
    console.log(`
📚 Hub Client AI Helper SDK
Commands:
  node ai-helper.js onboard --name <ProjectName> [--desc <Description>]
  node ai-helper.js log --project <Slug> --scope <frontend|backend|dashboard> --summary <Summary> [--feat <FEAT-1>] [--task <TASK-1-1>] [--files "file1,file2"] [--prompt "prompt used"]
    `);
  }
};

main().catch((err) => {
  console.error("❌ Network or Execution Error:", err.message);
});
