#!/usr/bin/env node

/**
 * CLI Launcher for clienthub-agent
 */

const { start, collectTelemetry, loadAgentConfig } = require("./daemon");

const cmd = process.argv[2] || "start";

if (cmd === "test") {
  const config = loadAgentConfig();
  console.log("Testing telemetry collection for:", config.clientKey);
  collectTelemetry(config).then((data) => {
    console.log("Telemetry Output:\n", JSON.stringify(data, null, 2));
    process.exit(0);
  });
} else if (cmd === "status") {
  const config = loadAgentConfig();
  console.log("ClientHub Agent Config:");
  console.log("   Client Key:", config.clientKey);
  console.log("   Hub URL:   ", config.hubUrl);
  console.log("   Poll Rate: ", config.pollInterval + "ms");
} else {
  start();
}
