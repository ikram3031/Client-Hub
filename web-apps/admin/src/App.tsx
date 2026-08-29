import React, { useState } from "react";
import { FleetOverview } from "./pages/FleetOverview";
import { TicketsDesk } from "./pages/TicketsDesk";
import { BillingManager } from "./pages/BillingManager";
import { Server, LifeBuoy, CreditCard, BookOpen, Shield } from "lucide-react";
import { Toaster } from "sonner";

export default function App() {
  const [activeTab, setActiveTab] = useState<"fleet" | "tickets" | "billing">("fleet");

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <Toaster position="top-right" richColors />

      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">PLEXIVIA</span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded">
                ClientHub Admin
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">Fleet Control Center</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <nav className="flex items-center gap-1 bg-zinc-900/90 border border-zinc-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("fleet")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "fleet"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            Fleet Overview
          </button>
          <button
            onClick={() => setActiveTab("tickets")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "tickets"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            Tickets Desk
          </button>
          <button
            onClick={() => setActiveTab("billing")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "billing"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            Billing & Hosting
          </button>
        </nav>

        {/* External Docs / Client Link */}
        <div className="flex items-center gap-2">
          <a
            href="http://localhost:5174"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-800 px-3 py-1.5 rounded-lg transition"
          >
            Client Portal ↗
          </a>
        </div>
      </header>

      {/* ── Main Workspace ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        {activeTab === "fleet" && <FleetOverview />}
        {activeTab === "tickets" && <TicketsDesk />}
        {activeTab === "billing" && <BillingManager />}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-900 py-4 px-6 text-center text-xs text-zinc-600">
        Plexivia ClientHub Fleet Engine • Powered by Cloudflare D1 & R2
      </footer>
    </div>
  );
}
