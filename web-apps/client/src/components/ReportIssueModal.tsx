import React, { useState } from "react";
import { useClientStore } from "../store/useClientStore";
import { LifeBuoy, X, Send, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ReportIssueModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { submitTicket, clientKey } = useClientStore();
  const [category, setCategory] = useState("ui_bug");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      toast.error("Please provide both title and description");
      return;
    }

    setSubmitting(true);
    try {
      await submitTicket({
        category,
        title,
        description,
        priority,
        pageUrl: window.location.href,
        browserInfo: `${navigator.userAgent} (${window.screen.width}x${window.screen.height})`,
        errorLogs: ["Client reported from in-app support widget"],
      });

      toast.success("Support ticket submitted! Our engineering team has been notified.");
      setTitle("");
      setDescription("");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <LifeBuoy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Report an Issue / Get Support</h2>
            <p className="text-xs text-zinc-400">Client: {clientKey.toUpperCase()}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Issue Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="ui_bug">UI / Visual Bug</option>
                <option value="order_flow">Order Processing Error</option>
                <option value="payment">Payment Gateway</option>
                <option value="stock">Stock / Inventory</option>
                <option value="other">Other Inquiry</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent / Blocking Sales</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Issue Summary</label>
            <input
              type="text"
              placeholder="e.g. Checkout button not working on mobile Safari"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Detailed Description</label>
            <textarea
              rows={3}
              placeholder="Explain what happened, steps to reproduce, or error messages seen..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-lg text-[11px] text-zinc-400 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              Diagnostic info (browser version, OS, current URL) will be automatically attached to help resolve your issue faster.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? "Submitting..." : "Submit Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
