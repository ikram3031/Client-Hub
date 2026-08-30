import React, { useState } from "react";

export interface LogWriterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    id?: string;
    scope: string;
    action: string;
    summary: string;
    prompt_used?: string;
    changed_files?: string[];
  }) => Promise<any>;
  scopes?: string[];
}

export const LogWriterModal: React.FC<LogWriterModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  scopes = ["backend", "dashboard", "frontend", "architecture", "deployment"],
}) => {
  const [scope, setScope] = useState(scopes[0] || "backend");
  const [action, setAction] = useState("feat");
  const [summary, setSummary] = useState("");
  const [reqs, setReqs] = useState("");
  const [changes, setChanges] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) {
      setError("Summary is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const promptSections = [];
      if (reqs.trim()) promptSections.push(`### 📋 Requirements & Problem Statement\n${reqs}`);
      if (changes.trim()) promptSections.push(`### 🛠️ Key Implementation Changes\n${changes}`);
      if (notes.trim()) promptSections.push(`### 📝 Notes & Remarks\n${notes}`);

      await onSubmit({
        scope,
        action,
        summary,
        prompt_used: promptSections.join("\n\n"),
      });

      setSummary("");
      setReqs("");
      setChanges("");
      setNotes("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to submit log");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0, 0, 0, 0.75)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      padding: "16px",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <div style={{
        background: "#0f172a",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "16px",
        width: "100%",
        maxWidth: "540px",
        padding: "24px",
        color: "#f8fafc",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        maxHeight: "90vh",
        overflowY: "auto"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>✍️ Record AI Action Log</h3>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: "#94a3b8", fontSize: "20px", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", borderRadius: "8px", padding: "10px", color: "#fca5a5", fontSize: "13px", marginBottom: "16px" }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>Scope</label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(0, 0, 0, 0.3)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  padding: "8px 10px",
                  color: "#f8fafc",
                  fontSize: "13px",
                  outline: "none"
                }}
              >
                {scopes.map((s) => (
                  <option key={s} value={s} style={{ background: "#1e293b", color: "#fff" }}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>Action Type</label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(0, 0, 0, 0.3)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  padding: "8px 10px",
                  color: "#f8fafc",
                  fontSize: "13px",
                  outline: "none"
                }}
              >
                <option value="feat" style={{ background: "#1e293b" }}>feat (New capability)</option>
                <option value="fix" style={{ background: "#1e293b" }}>fix (Bug fix)</option>
                <option value="refc" style={{ background: "#1e293b" }}>refc (Refactor)</option>
                <option value="perf" style={{ background: "#1e293b" }}>perf (Performance)</option>
                <option value="styl" style={{ background: "#1e293b" }}>styl (Theme UI)</option>
                <option value="test" style={{ background: "#1e293b" }}>test (Testing)</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>Summary *</label>
            <input
              type="text"
              placeholder="e.g. Integrate multi-tenant webhook handler"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              style={{
                width: "100%",
                background: "rgba(0, 0, 0, 0.3)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                padding: "8px 12px",
                color: "#f8fafc",
                fontSize: "13px",
                boxSizing: "border-box",
                outline: "none"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>Requirements & Context</label>
            <textarea
              rows={2}
              placeholder="- Business problem being addressed..."
              value={reqs}
              onChange={(e) => setReqs(e.target.value)}
              style={{
                width: "100%",
                background: "rgba(0, 0, 0, 0.3)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                padding: "8px 12px",
                color: "#f8fafc",
                fontSize: "12px",
                boxSizing: "border-box",
                outline: "none"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>Key Changes</label>
            <textarea
              rows={2}
              placeholder="- Modified src/routes/... to validate tokens"
              value={changes}
              onChange={(e) => setChanges(e.target.value)}
              style={{
                width: "100%",
                background: "rgba(0, 0, 0, 0.3)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                padding: "8px 12px",
                color: "#f8fafc",
                fontSize: "12px",
                boxSizing: "border-box",
                outline: "none"
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                padding: "8px 16px",
                color: "#cbd5e1",
                fontSize: "13px",
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                background: "#3b82f6",
                border: "none",
                borderRadius: "8px",
                padding: "8px 18px",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: "500",
                cursor: "pointer"
              }}
            >
              {isSubmitting ? "Submitting..." : "Submit Log"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
