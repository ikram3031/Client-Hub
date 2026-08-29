import { create } from "zustand";
import axios from "axios";

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
  loading: boolean;
  setClientKey: (key: string) => void;
  fetchClientStatus: () => Promise<void>;
  submitTicket: (ticketData: any) => Promise<void>;
}

export const useClientStore = create<ClientStore>((set, get) => ({
  clientKey: "decantre", // Default client
  clientInfo: null,
  loading: false,

  setClientKey: (key: string) => {
    set({ clientKey: key });
    get().fetchClientStatus();
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

  submitTicket: async (ticketData: any) => {
    await axios.post("/api/tickets", {
      ...ticketData,
      clientKey: get().clientKey,
    });
  },
}));
