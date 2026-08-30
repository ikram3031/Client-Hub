import React from "react";
import { VpsTelemetry } from "../types";

export interface VpsMonitorProps {
  telemetry: VpsTelemetry | null;
  loading?: boolean;
  onRefresh?: () => void;
}

export const VpsMonitor: React.FC<VpsMonitorProps> = ({ telemetry, loading, onRefresh }) => {
  if (!telemetry) {
    return (
      <div style={{ padding: "24px", background: "rgba(30, 41, 59, 0.5)", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.1)", textAlign: "center", color: "#94a3b8" }}>
        {loading ? "📡 Connecting to Host Telemetry..." : "⚠️ No telemetry data available for this host."}
      </div>
    );
  }

  const isHealthy = telemetry.status === "healthy" || telemetry.cpu_load_pct < 80;
  const statusColor = isHealthy ? "#10b981" : "#ef4444";

  return (
    <div style={{
      background: "linear-gradient(145deg, #0f172a 0%, #1e293b 100%)",
      borderRadius: "16px",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      padding: "24px",
      color: "#f8fafc",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: statusColor, boxShadow: `0 0 10px ${statusColor}` }} />
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600", letterSpacing: "-0.01em" }}>
            {telemetry.brandName || telemetry.client_key} Host Engine
          </h3>
          <span style={{ fontSize: "12px", background: "rgba(255, 255, 255, 0.1)", padding: "2px 8px", borderRadius: "20px", color: "#94a3b8" }}>
            v{telemetry.app_version || "1.0.0"}
          </span>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              padding: "6px 12px",
              color: "#cbd5e1",
              fontSize: "12px",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>
        )}
      </div>

      {/* Grid of Gauges */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "16px", marginBottom: "20px" }}>
        {/* CPU */}
        <div style={{ background: "rgba(0, 0, 0, 0.2)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
          <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "6px" }}>⚡ CPU Load</div>
          <div style={{ fontSize: "22px", fontWeight: "700", color: telemetry.cpu_load_pct > 75 ? "#f59e0b" : "#38bdf8" }}>
            {telemetry.cpu_load_pct}%
          </div>
          <div style={{ width: "100%", height: "4px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "2px", marginTop: "8px", overflow: "hidden" }}>
            <div style={{ width: `${Math.min(telemetry.cpu_load_pct, 100)}%`, height: "100%", background: telemetry.cpu_load_pct > 75 ? "#f59e0b" : "#38bdf8" }} />
          </div>
        </div>

        {/* Memory */}
        <div style={{ background: "rgba(0, 0, 0, 0.2)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
          <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "6px" }}>🧠 Memory RSS</div>
          <div style={{ fontSize: "22px", fontWeight: "700", color: "#a855f7" }}>
            {telemetry.memory_rss_mb} <span style={{ fontSize: "12px", fontWeight: "400", color: "#94a3b8" }}>MB</span>
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>Active Resident</div>
        </div>

        {/* Disk */}
        <div style={{ background: "rgba(0, 0, 0, 0.2)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
          <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "6px" }}>💾 Disk Used</div>
          <div style={{ fontSize: "22px", fontWeight: "700", color: "#ec4899" }}>
            {telemetry.disk_used_gb} <span style={{ fontSize: "12px", fontWeight: "400", color: "#94a3b8" }}>/ {telemetry.disk_total_gb} GB</span>
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>{telemetry.disk_free_pct}% Free</div>
        </div>

        {/* Database */}
        <div style={{ background: "rgba(0, 0, 0, 0.2)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
          <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "6px" }}>🗄️ Database</div>
          <div style={{ fontSize: "18px", fontWeight: "700", color: "#10b981", textTransform: "capitalize" }}>
            {telemetry.db_status || "Connected"}
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>Healthy & Syncing</div>
        </div>
      </div>

      {/* Footer Info Bar */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#64748b", borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: "12px" }}>
        <div>
          {telemetry.vps_ip && <span>IP: <code style={{ color: "#cbd5e1" }}>{telemetry.vps_ip}</code> &nbsp;•&nbsp; </span>}
          {telemetry.git_commit_hash && <span>Commit: <code style={{ color: "#38bdf8" }}>{telemetry.git_commit_hash.slice(0, 7)}</code></span>}
        </div>
        <div>
          Last heartbeat: {telemetry.last_heartbeat_at ? new Date(telemetry.last_heartbeat_at).toLocaleTimeString() : "Just now"}
        </div>
      </div>
    </div>
  );
};
