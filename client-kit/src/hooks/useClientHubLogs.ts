import { useState, useEffect, useCallback } from "react";
import { ActionLog } from "../types";

export interface UseLogsOptions {
  hubUrl: string;
  projectSlug: string;
  apiKey?: string;
  scope?: string;
  limit?: number;
  autoFetch?: boolean;
}

export const useClientHubLogs = ({
  hubUrl,
  projectSlug,
  apiKey,
  scope,
  limit = 50,
  autoFetch = true,
}: UseLogsOptions) => {
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!hubUrl || !projectSlug) return;
    try {
      setLoading(true);
      setError(null);
      const headers: Record<string, string> = {
        Accept: "application/json",
      };
      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      let url = `${hubUrl.replace(/\/$/, "")}/api/projects/${projectSlug}/logs?limit=${limit}`;
      if (scope) url += `&scope=${encodeURIComponent(scope)}`;

      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: ActionLog[] = Array.isArray(data) ? data : data.logs || [];
      setLogs(list);
    } catch (err: any) {
      setError(err.message || "Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  }, [hubUrl, projectSlug, apiKey, scope, limit]);

  const addLog = async (payload: {
    id?: string;
    scope: string;
    action: string;
    summary: string;
    prompt_used?: string;
    changed_files?: string[];
  }) => {
    if (!hubUrl || !projectSlug) throw new Error("Missing Hub URL or project slug");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
      headers["x-client-secret"] = apiKey;
    }

    const res = await fetch(`${hubUrl.replace(/\/$/, "")}/api/projects/${projectSlug}/logs`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to submit log (HTTP ${res.status})`);
    }

    await fetchLogs();
    return res.json();
  };

  useEffect(() => {
    if (!autoFetch) return;
    fetchLogs();
  }, [autoFetch, fetchLogs]);

  return { logs, loading, error, refetch: fetchLogs, addLog };
};
