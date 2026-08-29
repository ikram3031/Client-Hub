import React, { useEffect, useState } from "react";
import { useFleetStore, ClientFleet } from "../store/useFleetStore";
import {
  Server,
  HardDrive,
  Cpu,
  Database,
  ExternalLink,
  RefreshCw,
  Rocket,
  Archive,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Tag,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

export const FleetOverview: React.FC = () => {
  const { clients, summary, loading, fetchFleet, dispatchTask } = useFleetStore();
  const [activeTaskClient, setActiveTaskClient] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchFleet();
    const interval = setInterval(fetchFleet, 15000); // 15s auto refresh
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (clientKey: string, actionType: string) => {
    setActionLoading(`${clientKey}-${actionType}`);
    try {
      const taskId = await dispatchTask(clientKey, actionType);
      toast.success(`Task [${actionType}] queued successfully! (ID: ${taskId})`);
    } catch (err: any) {
      toast.error(err.message || "Failed to dispatch task");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* ── Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Server className="w-7 h-7 text-indigo-400" />
            White-Label Fleet Overview
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Real-time VPS telemetry, release version matrix, and remote management.
          </p>
        </div>
        <button
          onClick={() => fetchFleet()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-sm font-medium text-zinc-200 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-400" : ""}`} />
          Refresh Fleet
        </button>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400 text-sm">
            <span>Total Clients</span>
            <Server className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-bold text-white mt-2">{summary.total}</div>
          <div className="text-xs text-zinc-500 mt-1">Active White-Label Tenants</div>
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-emerald-400 text-sm">
            <span>Healthy Nodes</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-400 mt-2">{summary.healthy}</div>
          <div className="text-xs text-zinc-500 mt-1">Responding to Heartbeat</div>
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-amber-400 text-sm">
            <span>Degraded / Offline</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-amber-400 mt-2">{summary.degraded + summary.offline}</div>
          <div className="text-xs text-zinc-500 mt-1">Requires Attention</div>
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400 text-sm">
            <span>Avg Storage Used</span>
            <HardDrive className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-bold text-white mt-2">{summary.avgDiskUsagePct}%</div>
          <div className="text-xs text-zinc-500 mt-1">Fleet Disk Utilization</div>
        </div>
      </div>

      {/* ── Client Cards Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {clients.map((client) => {
          const usedPct = 100 - (client.diskFreePct || 100);
          const isExpiring = client.hostingStatus === "expiring_soon";

          return (
            <div
              key={client.clientKey}
              className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 rounded-xl p-6 flex flex-col justify-between transition shadow-lg relative overflow-hidden"
            >
              {/* Top Bar */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">{client.brandName}</h3>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${
                          client.status === "healthy"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : client.status === "degraded"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        {client.status.toUpperCase()}
                      </span>
                    </div>
                    <a
                      href={client.dashboardUrl || `https://${client.domain}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-zinc-400 hover:text-indigo-400 transition flex items-center gap-1 mt-1 font-mono"
                    >
                      {client.domain || "no-domain.com"}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Version Pill */}
                  <div className="flex flex-col items-end">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-md text-xs font-mono font-medium">
                      <Tag className="w-3 h-3" />
                      v{client.appVersion}
                    </span>
                    {client.gitCommitHash && (
                      <span className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        SHA: {client.gitCommitHash}
                      </span>
                    )}
                  </div>
                </div>

                {/* Disk Space Meter */}
                <div className="mt-5 space-y-1.5 bg-zinc-950/60 border border-zinc-800/60 rounded-lg p-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
                      VPS Storage
                    </span>
                    <span className="text-zinc-200 font-medium">
                      {client.diskUsedGb || 0} GB / {client.diskTotalGb || 40} GB ({client.diskFreePct}% Free)
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        usedPct > 85 ? "bg-rose-500" : usedPct > 70 ? "bg-amber-500" : "bg-indigo-500"
                      }`}
                      style={{ width: `${usedPct}%` }}
                    />
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="bg-zinc-950/40 border border-zinc-800/40 rounded-lg p-2">
                    <div className="text-[10px] text-zinc-500 uppercase font-semibold">Memory RSS</div>
                    <div className="text-xs font-semibold text-zinc-200 mt-0.5">{client.memoryRssMb || 0} MB</div>
                  </div>
                  <div className="bg-zinc-950/40 border border-zinc-800/40 rounded-lg p-2">
                    <div className="text-[10px] text-zinc-500 uppercase font-semibold">CPU Load</div>
                    <div className="text-xs font-semibold text-zinc-200 mt-0.5">{client.cpuLoadPct || 0}%</div>
                  </div>
                  <div className="bg-zinc-950/40 border border-zinc-800/40 rounded-lg p-2">
                    <div className="text-[10px] text-zinc-500 uppercase font-semibold">Database</div>
                    <div className="text-xs font-semibold text-emerald-400 mt-0.5 flex items-center justify-center gap-1">
                      <Database className="w-3 h-3" />
                      {client.dbStatus === "connected" ? "Online" : "Down"}
                    </div>
                  </div>
                </div>

                {/* Hosting Status Bar */}
                <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-zinc-800/60">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    Hosting Renewal:
                  </span>
                  <span
                    className={`font-medium ${
                      isExpiring ? "text-amber-400 font-bold flex items-center gap-1" : "text-zinc-300"
                    }`}
                  >
                    {isExpiring && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                    {client.hostingExpiryDate ? client.hostingExpiryDate.slice(0, 10) : "2027-01-01"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-6 pt-4 border-t border-zinc-800">
                <button
                  onClick={() => handleAction(client.clientKey, "DEPLOY_LATEST")}
                  disabled={actionLoading === `${client.clientKey}-DEPLOY_LATEST`}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                >
                  <Rocket className="w-3.5 h-3.5" />
                  {actionLoading === `${client.clientKey}-DEPLOY_LATEST` ? "Deploying..." : "Deploy Latest"}
                </button>
                <button
                  onClick={() => handleAction(client.clientKey, "BACKUP_DATABASE")}
                  disabled={actionLoading === `${client.clientKey}-BACKUP_DATABASE`}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                >
                  <Archive className="w-3.5 h-3.5" />
                  {actionLoading === `${client.clientKey}-BACKUP_DATABASE` ? "Backing up..." : "Backup to R2"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
