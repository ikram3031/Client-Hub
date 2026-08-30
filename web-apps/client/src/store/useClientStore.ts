import { create } from "zustand";
import axios from "axios";

export interface SupportTicket {
  id: number;
  clientKey: string;
  category: string;
  title: string;
  description: string;
  pageUrl?: string;
  browserInfo?: string;
  priority: "low" | "normal" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  resolutionNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

interface ClientInfo {
  clientKey: string;
  brandName: string;
  domain: string;
  status: string;
  appVersion: string;
  hostingPackage: string;
  hostingExpiryDate: string;
  daysRemaining: number | null;
  showWarningBanner: boolean;
  warningMessage: string | null;
  customAlerts: any[];
}

interface ClientStore {
  clientKey: string;
  clientInfo: ClientInfo | null;
  tickets: SupportTicket[];
  loading: boolean;
  setClientKey: (key: string) => void;
  fetchClientStatus: () => Promise<void>;
  fetchClientTickets: () => Promise<void>;
  submitTicket: (ticketData: any) => Promise<void>;
}

export const useClientStore = create<ClientStore>((set, get) => ({
  clientKey: "decantre",
  clientInfo: null,
  tickets: [],
  loading: false,

  setClientKey: (key: string) => {
    set({ clientKey: key });
    get().fetchClientStatus();
    get().fetchClientTickets();
  },

  fetchClientStatus: async () => {
    const key = get().clientKey;
    set({ loading: true });
    try {
      const res = await axios.get(`/api/billing/alerts/${key}`);
      if (res.data.success) {
        set({ clientInfo: res.data.data, loading: false });
      }
    } catch (err) {
      set({ loading: false });
    }
  },

  fetchClientTickets: async () => {
    const key = get().clientKey;
    try {
      const res = await axios.get(`/api/tickets?clientKey=${key}`);
      if (res.data.success) {
        set({ tickets: res.data.data || [] });
      }
    } catch (err) {
      console.error("Failed to fetch client tickets:", err);
    }
  },

  submitTicket: async (ticketData: any) => {
    const key = get().clientKey;
    await axios.post("/api/tickets", {
      ...ticketData,
      clientKey: key,
    });
    get().fetchClientTickets();
  },
}));
