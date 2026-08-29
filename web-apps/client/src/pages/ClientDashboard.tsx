import React, { useEffect, useState } from "react";
import { useClientStore } from "../store/useClientStore";
import { ReportIssueModal } from "../components/ReportIssueModal";
import {
  LifeBuoy,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  CreditCard,
  Server,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

export const ClientDashboard: React.FC = () => {
  const { clientKey, clientInfo, setClientKey, fetchClientStatus } = useClientStore();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchClientStatus();
  }, []);

  return (
    <div className="space-y-6">
      {/* ── Client Selector Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
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
        <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3 shadow-lg animate-in fade-in duration-300">
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
          className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-4 flex items-start gap-3 text-xs text-indigo-200 shadow-md"
        >
          <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-sm text-indigo-300">{alert.title}</h3>
            <p className="mt-1">{alert.message}</p>
          </div>
        </div>
      ))}

      {/* ── Infrastructure & Support Quick Action ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Support Card */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 flex flex-col justify-between shadow-lg">
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
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 flex flex-col justify-between shadow-lg">
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

      <ReportIssueModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};
