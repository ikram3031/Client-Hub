import React, { useEffect, useState } from "react";
import { useFleetStore, SupportTicket } from "../store/useFleetStore";
import {
  LifeBuoy,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Filter,
  Check,
} from "lucide-react";
import { toast } from "sonner";

export const TicketsDesk: React.FC = () => {
  const { tickets, fetchTickets, updateTicketStatus } = useFleetStore();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [resolvingTicketId, setResolvingTicketId] = useState<number | null>(null);
  const [resolutionText, setResolutionText] = useState<string>("");

  useEffect(() => {
    fetchTickets();
  }, []);

  const filteredTickets = tickets.filter((t) => {
    if (filterStatus === "all") return true;
    return t.status === filterStatus;
  });

  const handleResolve = async (ticketId: number) => {
    try {
      await updateTicketStatus(ticketId, "resolved", resolutionText || "Issue resolved by Super-Admin");
      toast.success(`Ticket #${ticketId} marked as resolved!`);
      setResolvingTicketId(null);
      setResolutionText("");
    } catch (err: any) {
      toast.error(err.message || "Failed to update ticket");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <LifeBuoy className="w-7 h-7 text-indigo-400" />
            Client Support & Issue Tickets Desk
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Review and resolve reported client issues with auto-captured browser metadata and error logs.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          {["all", "open", "in_progress", "resolved"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                filterStatus === st
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket List */}
      {filteredTickets.length === 0 ? (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-12 text-center text-zinc-500">
          <CheckCircle2 className="w-10 h-10 mx-auto text-zinc-600 mb-3" />
          <p className="text-base font-medium text-zinc-300">No support tickets found</p>
          <p className="text-xs text-zinc-500 mt-1">Clients have not submitted any issues for this filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 transition hover:border-zinc-700"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded text-xs font-mono font-bold">
                      #{ticket.id}
                    </span>
                    <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded text-xs font-semibold uppercase">
                      {ticket.clientKey}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 text-xs font-semibold rounded ${
                        ticket.priority === "urgent"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      Priority: {ticket.priority}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 text-xs font-semibold rounded ${
                        ticket.status === "open"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}
                    >
                      Status: {ticket.status.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mt-1">{ticket.title}</h3>
                  <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {ticket.description}
                  </p>

                  {ticket.pageUrl && (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 pt-1">
                      <span className="text-zinc-500">Reported on Page:</span>
                      <a
                        href={ticket.pageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-400 hover:underline flex items-center gap-1 font-mono"
                      >
                        {ticket.pageUrl}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {ticket.browserInfo && (
                    <div className="text-[11px] text-zinc-500 font-mono">
                      Environment: {ticket.browserInfo}
                    </div>
                  )}

                  {ticket.resolutionNotes && (
                    <div className="mt-3 p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-lg text-xs text-emerald-300">
                      <span className="font-bold">Resolution Note:</span> {ticket.resolutionNotes}
                    </div>
                  )}
                </div>

                {/* Right Action */}
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs text-zinc-500 flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    {ticket.createdAt ? ticket.createdAt.slice(0, 16).replace("T", " ") : ""}
                  </span>

                  {ticket.status !== "resolved" && (
                    <button
                      onClick={() => setResolvingTicketId(ticket.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Resolve Ticket
                    </button>
                  )}
                </div>
              </div>

              {/* Resolve Dialog */}
              {resolvingTicketId === ticket.id && (
                <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
                  <textarea
                    placeholder="Enter resolution notes (e.g. fixed in commit abc123)..."
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                    rows={2}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setResolvingTicketId(null)}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleResolve(ticket.id)}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
                    >
                      Confirm Resolve
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
