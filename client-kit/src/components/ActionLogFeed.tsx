import React, { useState } from "react";
import { ActionLog } from "../types";

export interface ActionLogFeedProps {
  logs: ActionLog[];
  loading?: boolean;
  onRefresh?: () => void;
  onOpenWriter?: () => void;
}

export const ActionLogFeed: React.FC<ActionLogFeedProps> = ({ logs, loading, onRefresh, onOpenWriter }) => {
  const [search, setSearch] = useState("");
  const [selectedScope, setSelectedScope] = useState<string>("all");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const scopes = ["all", ...Array.from(new Set(logs.map((l) => l.scope || "backend")))];

  const filteredLogs = logs.filter((l) => {
    const matchesSearch =
      l.summary?.toLowerCase().includes(search.toLowerCase()) ||
      l.id?.toLowerCase().includes(search.toLowerCase()) ||
      l.commit_id?.toLowerCase().includes(search.toLowerCase());
    const matchesScope = selectedScope === "all" || l.scope?.toLowerCase() === selectedScope.toLowerCase();
    return matchesSearch && matchesScope;
  });

  return (
    <div style={{
      background: "#0f172a",
      borderRadius: "16px",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      padding: "24px",
      color: "#f8fafc",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      {/* Header Controls */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>📝 AI Action & Audit Logs</h3>
          <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#94a3b8" }}>
            Immutable changelog and architectural decisions
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          {onOpenWriter && (
            <button
              onClick={onOpenWriter}
              style={{
                background: "#3b82f6",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "8px 14px",
                fontSize: "13px",
                fontWeight: "500",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(59, 130, 246, 0.4)"
              }}
            >
              + Write Log
            </button>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                padding: "8px 12px",
                color: "#cbd5e1",
                fontSize: "13px",
                cursor: "pointer"
              }}
            >
              {loading ? "..." : "↻"}
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="Search by summary, #ID or commit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: "1 1 200px",
            background: "rgba(0, 0, 0, 0.3)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "8px",
            padding: "8px 14px",
            color: "#f8fafc",
            fontSize: "13px",
            outline: "none"
          }}
        />

        <div style={{ display: "flex", gap: "6px", overflowX: "auto" }}>
          {scopes.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedScope(s)}
              style={{
                background: selectedScope === s ? "rgba(59, 130, 246, 0.2)" : "rgba(255, 255, 255, 0.05)",
                color: selectedScope === s ? "#60a5fa" : "#94a3b8",
                border: selectedScope === s ? "1px solid #3b82f6" : "1px solid rgba(255, 255, 255, 0.05)",
                borderRadius: "6px",
                padding: "4px 10px",
                fontSize: "12px",
                cursor: "pointer",
                textTransform: "capitalize"
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Feed */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "500px", overflowY: "auto", paddingRight: "4px" }}>
        {filteredLogs.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "#64748b", fontSize: "14px" }}>
            {loading ? "Loading logs..." : "No action logs matched your filter."}
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            return (
              <div
                key={log.id}
                style={{
                  background: "rgba(30, 41, 59, 0.5)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                  borderRadius: "10px",
                  padding: "14px",
                  transition: "all 0.2s",
                  cursor: "pointer"
                }}
                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{
                      background: "rgba(59, 130, 246, 0.15)",
                      color: "#60a5fa",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "700",
                      fontFamily: "monospace"
                    }}>
                      #{log.id}
                    </span>
                    <span style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      color: "#94a3b8",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      textTransform: "uppercase"
                    }}>
                      {log.scope} / {log.action}
                    </span>
                    <span style={{ fontSize: "14px", fontWeight: "500", color: "#e2e8f0" }}>
                      {log.summary}
                    </span>
                  </div>

                  <div style={{ fontSize: "12px", color: "#64748b", whiteSpace: "nowrap" }}>
                    {new Date(log.created_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid rgba(255, 255, 255, 0.08)", fontSize: "13px", color: "#cbd5e1" }}>
                    {log.commit_id && (
                      <div style={{ marginBottom: "8px", fontSize: "12px", color: "#94a3b8" }}>
                        🔗 Commit: <code style={{ color: "#38bdf8", background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: "4px" }}>{log.commit_id}</code>
                      </div>
                    )}
                    {log.prompt_used && (
                      <div style={{ background: "rgba(0, 0, 0, 0.25)", padding: "12px", borderRadius: "8px", whiteSpace: "pre-wrap", lineHeight: "1.5", color: "#cbd5e1", fontSize: "12px" }}>
                        {log.prompt_used}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
