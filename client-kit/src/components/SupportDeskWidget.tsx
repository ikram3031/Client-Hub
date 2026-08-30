import React, { useState, useEffect, useCallback } from "react";
import { SupportTicket } from "../types";

export interface SupportDeskWidgetProps {
  hubUrl: string;
  clientKey: string;
  apiKey?: string;
}

export const SupportDeskWidget: React.FC<SupportDeskWidgetProps> = ({ hubUrl, clientKey, apiKey }) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Bug");
  const [priority, setPriority] = useState("normal");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = useCallback(async () => {
    if (!hubUrl || !clientKey) return;
    try {
      setLoading(true);
      const res = await fetch(`${hubUrl.replace(/\/$/, "")}/api/tickets?client=${encodeURIComponent(clientKey)}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(Array.isArray(data) ? data : data.tickets || []);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }, [hubUrl, clientKey]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch(`${hubUrl.replace(/\/$/, "")}/api/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_key: clientKey,
          category,
          title,
          description,
          priority,
          page_url: typeof window !== "undefined" ? window.location.href : "",
          browser_info: typeof navigator !== "undefined" ? navigator.userAgent : "",
        }),
      });

      if (res.ok) {
        setTitle("");
        setDescription("");
        setShowNewModal(false);
        fetchTickets();
      }
    } catch (e) {
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      background: "#0f172a",
      borderRadius: "16px",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      padding: "24px",
      color: "#f8fafc",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>🛟 Support & Issue Desk</h3>
          <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#94a3b8" }}>
            Direct engineering assistance & ticket status
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          style={{
            background: "#10b981",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            padding: "8px 14px",
            fontSize: "13px",
            fontWeight: "500",
            cursor: "pointer"
          }}
        >
          + Open Ticket
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "400px", overflowY: "auto" }}>
        {tickets.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
            {loading ? "Loading support tickets..." : "No open tickets. Everything running smoothly! 🎉"}
          </div>
        ) : (
          tickets.map((t) => (
            <div
              key={t.id}
              style={{
                background: "rgba(30, 41, 59, 0.5)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                borderRadius: "10px",
                padding: "14px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    padding: "2px 8px",
                    borderRadius: "20px",
                    background: t.status === "resolved" ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                    color: t.status === "resolved" ? "#34d399" : "#fbbf24",
                    textTransform: "uppercase"
                  }}>
                    {t.status}
                  </span>
                  <span style={{ fontSize: "14px", fontWeight: "600", color: "#e2e8f0" }}>{t.title}</span>
                </div>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  {new Date(t.created_at).toLocaleDateString()}
                </span>
              </div>
              <p style={{ margin: "4px 0", fontSize: "13px", color: "#94a3b8" }}>{t.description}</p>
              {t.resolution_notes && (
                <div style={{ marginTop: "8px", padding: "8px 12px", background: "rgba(16, 185, 129, 0.1)", borderRadius: "6px", fontSize: "12px", color: "#6ee7b7" }}>
                  💡 <strong>Resolution:</strong> {t.resolution_notes}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showNewModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "16px"
        }}>
          <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "24px", maxWidth: "480px", width: "100%" }}>
            <h4 style={{ margin: "0 0 16px 0", fontSize: "16px" }}>Report an Issue</h4>
            <form onSubmit={handleCreateTicket} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input
                placeholder="Issue title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "8px 12px", color: "#fff", outline: "none" }}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "8px", color: "#fff" }}
                >
                  <option value="Bug">Bug Report</option>
                  <option value="Billing">Billing & Hosting</option>
                  <option value="Feature">Feature Request</option>
                  <option value="Other">General Support</option>
                </select>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "8px", color: "#fff" }}
                >
                  <option value="low">Low Priority</option>
                  <option value="normal">Normal Priority</option>
                  <option value="urgent">Urgent Priority</option>
                </select>
              </div>
              <textarea
                placeholder="Describe the issue in detail..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "8px 12px", color: "#fff", outline: "none" }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button type="button" onClick={() => setShowNewModal(false)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#cbd5e1", padding: "6px 14px", borderRadius: "6px", cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ background: "#10b981", border: "none", color: "#fff", padding: "6px 16px", borderRadius: "6px", cursor: "pointer" }}>{submitting ? "Submitting..." : "Submit"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
