import React, { useState } from "react";
import { ClientHubConfig } from "../types";
import { useClientHubTelemetry } from "../hooks/useClientHubTelemetry";
import { useClientHubLogs } from "../hooks/useClientHubLogs";
import { VpsMonitor } from "./VpsMonitor";
import { ActionLogFeed } from "./ActionLogFeed";
import { LogWriterModal } from "./LogWriterModal";
import { SupportDeskWidget } from "./SupportDeskWidget";

export interface ClientHubPanelProps extends ClientHubConfig {
  className?: string;
  defaultTab?: "overview" | "logs" | "support";
}

export const ClientHubPanel: React.FC<ClientHubPanelProps> = ({
  hubUrl,
  clientKey,
  projectSlug = "wl-ecom",
  apiKey,
  pollIntervalMs = 15000,
  defaultTab = "overview",
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "logs" | "support">(defaultTab);
  const [isWriterOpen, setIsWriterOpen] = useState(false);

  const { telemetry, loading: telemetryLoading, refetch: refetchTelemetry } = useClientHubTelemetry({
    hubUrl,
    clientKey,
    apiKey,
    pollIntervalMs,
  });

  const { logs, loading: logsLoading, refetch: refetchLogs, addLog } = useClientHubLogs({
    hubUrl,
    projectSlug,
    apiKey,
  });

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "20px",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      {/* Navigation Tab Bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#0f172a",
        padding: "8px",
        borderRadius: "12px",
        border: "1px solid rgba(255, 255, 255, 0.08)"
      }}>
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            onClick={() => setActiveTab("overview")}
            style={{
              background: activeTab === "overview" ? "rgba(59, 130, 246, 0.2)" : "transparent",
              color: activeTab === "overview" ? "#60a5fa" : "#94a3b8",
              border: activeTab === "overview" ? "1px solid #3b82f6" : "1px solid transparent",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            📊 VPS Monitor
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            style={{
              background: activeTab === "logs" ? "rgba(59, 130, 246, 0.2)" : "transparent",
              color: activeTab === "logs" ? "#60a5fa" : "#94a3b8",
              border: activeTab === "logs" ? "1px solid #3b82f6" : "1px solid transparent",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            📝 Action Logs ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab("support")}
            style={{
              background: activeTab === "support" ? "rgba(59, 130, 246, 0.2)" : "transparent",
              color: activeTab === "support" ? "#60a5fa" : "#94a3b8",
              border: activeTab === "support" ? "1px solid #3b82f6" : "1px solid transparent",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            🛟 Support Desk
          </button>
        </div>

        <div>
          <button
            onClick={() => setIsWriterOpen(true)}
            style={{
              background: "#3b82f6",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "8px 14px",
              fontSize: "13px",
              fontWeight: "500",
              cursor: "pointer"
            }}
          >
            ✍️ Record Action
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <VpsMonitor telemetry={telemetry} loading={telemetryLoading} onRefresh={refetchTelemetry} />
          <ActionLogFeed
            logs={logs.slice(0, 5)}
            loading={logsLoading}
            onRefresh={refetchLogs}
            onOpenWriter={() => setIsWriterOpen(true)}
          />
        </div>
      )}

      {activeTab === "logs" && (
        <ActionLogFeed
          logs={logs}
          loading={logsLoading}
          onRefresh={refetchLogs}
          onOpenWriter={() => setIsWriterOpen(true)}
        />
      )}

      {activeTab === "support" && (
        <SupportDeskWidget hubUrl={hubUrl} clientKey={clientKey} apiKey={apiKey} />
      )}

      {/* Writer Modal */}
      <LogWriterModal
        isOpen={isWriterOpen}
        onClose={() => setIsWriterOpen(false)}
        onSubmit={addLog}
      />
    </div>
  );
};
