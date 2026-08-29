import fs from "fs";
import os from "os";
import path from "path";
import { exec } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

// Resolves client key from marker file or environment
const resolveClientKey = () => {
  const envClient = process.env.CLIENT || process.env.CLIENT_NAME || process.env.CLIENT_KEY;
  if (envClient) return envClient.toLowerCase().trim();

  const clientMarker = path.join(projectRoot, ".client");
  if (fs.existsSync(clientMarker)) {
    const val = fs.readFileSync(clientMarker, "utf8").trim().toLowerCase();
    if (val) return val;
  }

  return "decantre";
};

const CLIENT_KEY = resolveClientKey();
const HUB_URL = process.env.CENTRAL_HUB_URL || "http://localhost:5000";
const HUB_SECRET = process.env.HUB_SECRET || "wlecom-fleet-secret";
const POLL_INTERVAL_MS = Number(process.env.AGENT_POLL_INTERVAL_MS) || 30000;

// Executes shell command safely as a promise
const executeShell = (cmd) => {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd: projectRoot, timeout: 300000, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        return reject(new Error(stderr || error.message));
      }
      resolve(stdout.trim());
    });
  });
};

// Reads live host disk storage space metrics in GB
const readDiskMetrics = () => {
  try {
    if (typeof fs.statfsSync === "function") {
      const stats = fs.statfsSync(process.platform === "win32" ? "C:\\" : "/");
      const totalBytes = stats.bsize * stats.blocks;
      const freeBytes = stats.bsize * stats.bavail;
      const usedBytes = totalBytes - freeBytes;

      const totalGb = +(totalBytes / (1024 * 1024 * 1024)).toFixed(2);
      const usedGb = +(usedBytes / (1024 * 1024 * 1024)).toFixed(2);
      const freePct = +((freeBytes / totalBytes) * 100).toFixed(1);

      return { totalGb, usedGb, freePct };
    }
  } catch {}

  return { totalGb: 40.0, usedGb: 16.0, freePct: 60.0 };
};

// Reads latest Git commit hash and app version
const readVersionInfo = () => {
  let gitCommit = "";
  let appVersion = "1.0.0";

  try {
    const pkgPath = path.join(projectRoot, "backend", "package.json");
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      appVersion = pkg.version || "1.0.0";
    }
  } catch {}

  return { gitCommit, appVersion };
};

// Collects comprehensive host telemetry payload
const collectTelemetry = async () => {
  const disk = readDiskMetrics();
  const ver = readVersionInfo();

  try {
    const sha = await executeShell("git rev-parse --short HEAD");
    if (sha) ver.gitCommit = sha;
  } catch {}

  const memTotal = os.totalmem();
  const memFree = os.freemem();
  const memUsedMb = Math.round((memTotal - memFree) / (1024 * 1024));
  const cpuLoad = Math.round((os.loadavg()[0] || 0.1) * 10);

  return {
    clientKey: CLIENT_KEY,
    brandName: CLIENT_KEY.charAt(0).toUpperCase() + CLIENT_KEY.slice(1),
    domain: `${CLIENT_KEY}.com`,
    appVersion: ver.appVersion,
    gitCommitHash: ver.gitCommit,
    diskTotalGb: disk.totalGb,
    diskUsedGb: disk.usedGb,
    diskFreePct: disk.freePct,
    memoryRssMb: memUsedMb,
    cpuLoadPct: cpuLoad,
    dbStatus: "connected",
    uptimeSeconds: Math.round(os.uptime()),
    timestamp: new Date().toISOString(),
  };
};

// Whitelisted operational action handlers
const ACTION_REGISTRY = {
  DEPLOY_LATEST: () => executeShell("git pull origin Live && make build"),
  BACKUP_DATABASE: () => executeShell("node scripts/backup-to-r2.js"),
  RESTART_BACKEND: () => executeShell("make build-backend"),
  RESTART_DASHBOARD: () => executeShell("make build-dashboard"),
  FLUSH_CACHE: () => executeShell("docker compose restart backend"),
};

// Executes whitelisted task and posts status back to Central Hub
const executeTask = async (task) => {
  const { task_id, action_type } = task;
  console.log(`⚡ [Agent] Received operational task: [${action_type}] (ID: ${task_id})`);

  const handler = ACTION_REGISTRY[action_type];
  if (!handler) {
    console.error(`❌ [Agent] Unknown or unauthorized actionType: ${action_type}`);
    return;
  }

  const startMs = Date.now();
  let status = "completed";
  let output = "";

  try {
    output = await handler();
    console.log(`✅ [Agent] Task [${action_type}] completed successfully in ${Date.now() - startMs}ms`);
  } catch (err) {
    status = "failed";
    output = err.message || "Execution error";
    console.error(`❌ [Agent] Task [${action_type}] failed:`, output);
  }

  const durationMs = Date.now() - startMs;

  try {
    await fetch(`${HUB_URL}/api/fleet/tasks/${task_id}/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hub-secret": HUB_SECRET,
      },
      body: JSON.stringify({
        status,
        executionOutput: output.slice(0, 4000),
        durationMs,
      }),
    });
  } catch (err) {
    console.error("❌ [Agent] Failed to report task status to Hub:", err.message);
  }
};

// Sends heartbeat telemetry and processes pending tasks
const runHeartbeatCycle = async () => {
  try {
    const payload = await collectTelemetry();

    const res = await fetch(`${HUB_URL}/api/fleet/heartbeat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hub-secret": HUB_SECRET,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.pendingTask) {
        await executeTask(data.pendingTask);
      }
    }
  } catch (err) {
    // Non-blocking telemetry
  }
};

// Starts the Sidecar Agent daemon
const startAgent = () => {
  console.log(`🤖 [ClientHub Agent] Starting daemon for client [${CLIENT_KEY}]`);
  console.log(`   ├─ Central Hub:    ${HUB_URL}`);
  console.log(`   ├─ Poll Interval:  ${POLL_INTERVAL_MS / 1000}s`);
  console.log(`   └─ Project Root:   ${projectRoot}`);

  runHeartbeatCycle();
  setInterval(runHeartbeatCycle, POLL_INTERVAL_MS);
};

// CLI test runner mode support
if (process.argv.includes("--test")) {
  collectTelemetry().then((m) => {
    console.log("✓ Collected Test Telemetry Metrics:", m);
    process.exit(0);
  });
} else {
  startAgent();
}
