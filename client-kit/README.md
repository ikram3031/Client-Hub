# 📦 @plexivia-dev/clienthub-kit

> **All-in-one Embedded SDK, Rich AI Action Logger CLI, and VPS Telemetry Agent for ClientHub.**

Seamlessly integrate live VPS telemetry monitoring, AI action audit logs, and direct engineering support into your React dashboards and Node.js applications.

---

## 🚀 1. Installation

```bash
# In your client project repository:
npm install @plexivia-dev/clienthub-kit --save-dev
```

---

## 📊 2. Embedded React SDK (Dashboard Integration)

Embed the full ClientHub suite into any React / Next.js / Vite dashboard with just 2 lines of code:

```tsx
import React from "react";
import { ClientHubPanel } from "@plexivia-dev/clienthub-kit/react";

export const SystemToolsPage = () => {
  return (
    <div className="p-6">
      <ClientHubPanel
        hubUrl="http://144.79.218.241:5000"
        clientKey="decantre"
        projectSlug="wl-ecom"
        pollIntervalMs={15000}
      />
    </div>
  );
};
```

### Standalone React Components Available:
- `<VpsMonitor telemetry={data} onRefresh={refetch} />` — Live gauges for CPU, RAM RSS, Disk Usage, Uptime, and DB health.
- `<ActionLogFeed logs={logs} onOpenWriter={openModal} />` — Searchable, filterable changelog timeline.
- `<LogWriterModal isOpen={isOpen} onClose={close} onSubmit={addLog} />` — Interactive dialog to record actions directly from UI.
- `<SupportDeskWidget hubUrl={url} clientKey={key} />` — In-app issue ticket creator & status tracker.

### Custom React Hooks:
```tsx
import { useClientHubTelemetry, useClientHubLogs } from "@plexivia-dev/clienthub-kit/react";

const { telemetry, loading, refetch } = useClientHubTelemetry({
  hubUrl: "http://144.79.218.241:5000",
  clientKey: "decantre",
});

const { logs, addLog } = useClientHubLogs({
  hubUrl: "http://144.79.218.241:5000",
  projectSlug: "wl-ecom",
});
```

---

## 📝 3. AI Action Logger CLI (`clienthub-log`)

AI coding agents and developers can record structured audit logs directly to the central hub:

```bash
npx clienthub-log "AB01(feat): Add MongoDB multi-tenant index" \
  --reqs "- Improve order query performance on high concurrency" \
  --changes "- OrderModel.js: Added compound index on tenantId and createdAt" \
  --notes "Tested on staging. Latency dropped from 120ms to 6ms."
```

---

## 🤖 4. VPS Telemetry Daemon (`clienthub-agent`)

Run a lightweight background daemon on your VPS to automatically stream CPU, RAM, and Disk metrics to the central Fleet Hub:

```bash
# Start the background daemon
npx clienthub-agent start

# Or test telemetry collection once
npx clienthub-agent test
```

---

## 📄 License
MIT © Plexivia
