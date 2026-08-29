import React, { useEffect, useState } from "react";
import { useFleetStore } from "../store/useFleetStore";
import { CreditCard, Calendar, DollarSign, Send, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

export const BillingManager: React.FC = () => {
  const { clients, fetchFleet } = useFleetStore();
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [bannerTitle, setBannerTitle] = useState<string>("");
  const [bannerMessage, setBannerMessage] = useState<string>("");
  const [bannerType, setBannerType] = useState<string>("warning");
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchFleet();
  }, []);

  const handleBroadcastAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !bannerTitle || !bannerMessage) {
      toast.error("Please fill in client, title, and message");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post("/api/billing/alerts", {
        clientKey: selectedClient,
        title: bannerTitle,
        message: bannerMessage,
        bannerType,
      });
      toast.success(`Banner alert broadcasted to client [${selectedClient}] dashboard!`);
      setBannerTitle("");
      setBannerMessage("");
    } catch (err: any) {
      toast.error(err.message || "Failed to broadcast alert");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <CreditCard className="w-7 h-7 text-indigo-400" />
          Hosting Subscriptions & Billing Manager
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Track client hosting expiry dates, annual billing cycles, and broadcast renewal warning banners.
        </p>
      </div>

      {/* ── Subscriptions Table ── */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Client Hosting Matrix</h2>
          <span className="text-xs text-zinc-400 font-mono">{clients.length} Active Accounts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-950/60 text-zinc-400 uppercase text-[11px] font-semibold border-b border-zinc-800">
              <tr>
                <th className="py-3.5 px-4">Client Brand</th>
                <th className="py-3.5 px-4">Package</th>
                <th className="py-3.5 px-4">Cycle</th>
                <th className="py-3.5 px-4">Price (BDT)</th>
                <th className="py-3.5 px-4">Expiry Date</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {clients.map((c) => (
                <tr key={c.clientKey} className="hover:bg-zinc-800/30 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white">{c.brandName}</div>
                    <div className="text-xs text-zinc-500 font-mono">{c.domain || c.clientKey}</div>
                  </td>
                  <td className="py-3.5 px-4">{c.hostingPackage || "Standard VPS"}</td>
                  <td className="py-3.5 px-4 uppercase text-xs font-semibold">{c.hostingBillingCycle || "yearly"}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">
                    ৳{c.hostingPriceBdt?.toLocaleString() || "10,000"}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs">
                    {c.hostingExpiryDate ? c.hostingExpiryDate.slice(0, 10) : "2027-01-01"}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${
                        c.hostingStatus === "expiring_soon"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}
                    >
                      {c.hostingStatus === "expiring_soon" ? (
                        <>
                          <AlertTriangle className="w-3 h-3" />
                          Expiring Soon
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Broadcast Banner Form ── */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 shadow-lg max-w-2xl">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Send className="w-5 h-5 text-indigo-400" />
          Broadcast Dashboard Alert Banner
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Send real-time renewal notifications or maintenance alerts directly to a client's dashboard.
        </p>

        <form onSubmit={handleBroadcastAlert} className="space-y-4 mt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Select Target Client</label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Choose Client --</option>
                {clients.map((c) => (
                  <option key={c.clientKey} value={c.clientKey}>
                    {c.brandName} ({c.clientKey})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Banner Type</label>
              <select
                value={bannerType}
                onChange={(e) => setBannerType(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="warning">Warning (Yellow)</option>
                <option value="danger">Critical / Expired (Red)</option>
                <option value="info">Informational (Blue)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Banner Title</label>
            <input
              type="text"
              placeholder="e.g. হোস্টিং রিনিউয়াল নোটিফিকেশন"
              value={bannerTitle}
              onChange={(e) => setBannerTitle(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Banner Message</label>
            <textarea
              rows={3}
              placeholder="e.g. আপনার হোস্টিং সার্ভিসের মেয়াদ আর ৫ দিন পর শেষ হবে। নিরবচ্ছিন্ন সেবার জন্য রিনিউ করুন।"
              value={bannerMessage}
              onChange={(e) => setBannerMessage(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {submitting ? "Broadcasting..." : "Push Alert to Client Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
};
