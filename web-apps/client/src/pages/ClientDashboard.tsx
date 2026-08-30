import React, { useEffect, useState } from "react";
import { useClientStore, SupportTicket } from "../store/useClientStore";
import { ReportIssueModal } from "../components/ReportIssueModal";
import {
  LifeBuoy,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  CreditCard,
  Server,
  ExternalLink,
  Clock,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

export const ClientDashboard: React.FC = () => {
  const { clientKey, clientInfo, tickets, setClientKey, fetchClientStatus, fetchClientTickets } = useClientStore();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchClientStatus();
    fetchClientTickets();
    const interval = setInterval(() => {
      fetchClientTickets();
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* ── Client Selector Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold font-mono">
            {clientKey.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">
              {clientInfo?.brandName || clientKey.toUpperCase()} Client Support Portal
            </h1>
            <p className="text-xs text-zinc-400 font-mono">{clientInfo?.domain || "yourdomain.com"}</p>
          </div>
        </div>

        {/* Switch Client Preview */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Switch Client View:</span>
          {["decantre", "engulfic", "toyoland"].map((k) => (
            <button
              key={k}
              onClick={() => setClientKey(k)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg uppercase tracking-wider transition ${
                clientKey === k
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {/* ── Hosting Renewal Warning Banner (If Expiring) ── */}
      {clientInfo?.showWarningBanner && (
        <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 shadow-lg animate-in fade-in duration-300">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs text-amber-200">
            <h3 className="font-bold text-sm text-amber-300">⚠️ হোস্টিং রিনিউয়াল রিমাইন্ডার</h3>
            <p className="mt-1 leading-relaxed">{clientInfo.warningMessage}</p>
            <div className="mt-2.5 flex items-center gap-3">
              <span className="font-mono bg-amber-500/20 px-2 py-0.5 rounded text-amber-300 font-semibold">
                মেয়াদ শেষ: {clientInfo.hostingExpiryDate ? clientInfo.hostingExpiryDate.slice(0, 10) : "N/A"}
              </span>
              <span className="text-zinc-400 font-mono">প্যাকেজ: {clientInfo.hostingPackage}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Broadcast Custom Banners ── */}
      {clientInfo?.customAlerts?.map((alert: any) => (
        <div
          key={alert.id}
          className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-4 flex items-start gap-3 text-xs text-indigo-200 shadow-md"
        >
          <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-sm text-indigo-300">{alert.title}</h3>
            <p className="mt-1">{alert.message}</p>
          </div>
        </div>
      ))}

      {/* ── Support & System Health Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Support Action Card */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg">
          <div>
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Need Engineering Support?</h2>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Encountering a bug, payment gateway discrepancy, or inventory mismatch? Report directly to our engineering hub with 1-click diagnostic logs.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition shadow-md flex items-center justify-center gap-2"
          >
            <LifeBuoy className="w-4 h-4" />
            Report an Issue / Bug
          </button>
        </div>

        {/* System Health Card */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg">
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <Server className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Store Infrastructure Health</h2>
            <div className="mt-4 space-y-2.5 text-xs text-zinc-300">
              <div className="flex items-center justify-between p-2.5 bg-zinc-950/60 border border-zinc-800/60 rounded-lg">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  E-Commerce Storefront API
                </span>
                <span className="text-emerald-400 font-semibold">Operational (99.9%)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-950/60 border border-zinc-800/60 rounded-lg">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Database & Cloudflare R2 Backups
                </span>
                <span className="text-emerald-400 font-semibold">Active & Synced</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-zinc-950/60 border border-zinc-800/60 rounded-lg">
                <span className="flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
                  Hosting Subscription
                </span>
                <span className="text-zinc-200 font-mono font-medium">
                  {clientInfo?.daysRemaining !== null ? `${clientInfo?.daysRemaining} Days Left` : "Active"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500 font-mono">
            <span>Powered by Plexivia Fleet Engine</span>
            <span className="text-emerald-400 font-semibold">SSL 256-bit Encrypted</span>
          </div>
        </div>
      </div>

      {/* ── My Support Requests & Status List ── */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">My Support Tickets & History</h2>
          </div>
          <button
            onClick={() => fetchClientTickets()}
            className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 transition font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {tickets.length === 0 ? (
          <div className="py-8 text-center text-zinc-500 text-xs">
            No support tickets submitted yet. If you encounter any issues, click "Report an Issue" above.
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700/80 rounded-xl p-4 transition text-xs space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-zinc-400">#{t.id}</span>
                    <h3 className="font-bold text-white text-sm">{t.title}</h3>
                    <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-[11px] uppercase font-semibold">
                      {t.category.replace("_", " ")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase flex items-center gap-1 ${
                        t.status === "resolved"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : t.status === "in_progress"
                          ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {t.status === "resolved" ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      )}
                      {t.status.replace("_", " ")}
                    </span>
                    <span className="text-zinc-500 font-mono text-[11px] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {t.createdAt ? t.createdAt.slice(0, 10) : ""}
                    </span>
                  </div>
                </div>

                <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">{t.description}</p>

                {t.resolutionNotes && (
                  <div className="mt-2 p-2.5 bg-emerald-950/30 border border-emerald-800/40 rounded-lg text-emerald-300">
                    <span className="font-bold text-emerald-200">Engineer Response / Resolution:</span>{" "}
                    {t.resolutionNotes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ReportIssueModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};
