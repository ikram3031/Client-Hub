import { useState, useEffect, useCallback } from "react";
import { VpsTelemetry } from "../types";

export interface UseTelemetryOptions {
  hubUrl: string;
  clientKey: string;
  apiKey?: string;
  pollIntervalMs?: number;
  autoFetch?: boolean;
}

export const useClientHubTelemetry = ({
  hubUrl,
  clientKey,
  apiKey,
  pollIntervalMs = 15000,
  autoFetch = true,
}: UseTelemetryOptions) => {
  const [telemetry, setTelemetry] = useState<VpsTelemetry | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTelemetry = useCallback(async () => {
    if (!hubUrl || !clientKey) return;
    try {
      setLoading(true);
      setError(null);
      const headers: Record<string, string> = {
        Accept: "application/json",
      };
      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
        headers["x-client-secret"] = apiKey;
      }

      const res = await fetch(`${hubUrl.replace(/\/$/, "")}/api/fleet/clients`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const clients: VpsTelemetry[] = Array.isArray(data) ? data : data.clients || [];
      const match = clients.find((c) => c.client_key.toLowerCase() === clientKey.toLowerCase());
      
      if (match) {
        setTelemetry(match);
      } else if (clients.length > 0) {
        setTelemetry(clients[0]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch VPS telemetry");
    } finally {
      setLoading(false);
    }
  }, [hubUrl, clientKey, apiKey]);

  useEffect(() => {
    if (!autoFetch) return;
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, pollIntervalMs);
    return () => clearInterval(interval);
  }, [autoFetch, fetchTelemetry, pollIntervalMs]);

  return { telemetry, loading, error, refetch: fetchTelemetry };
};
