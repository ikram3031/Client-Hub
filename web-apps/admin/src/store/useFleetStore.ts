import { create } from "zustand";
import axios from "axios";

export interface ClientFleet {
  clientKey: string;
  brandName: string;
  domain: string;
  vpsIp: string;
  apiUrl: string;
  dashboardUrl: string;
  storefrontUrl: string;
  appVersion: string;
  gitCommitHash: string;
  lastDeployedAt?: string;
  status: "healthy" | "degraded" | "offline";
  diskTotalGb: number;
  diskUsedGb: number;
  diskFreePct: number;
  memoryRssMb: number;
  cpuLoadPct: number;
  dbStatus: string;
  hostingPackage: string;
  hostingStartDate: string;
  hostingExpiryDate: string;
  hostingBillingCycle: "monthly" | "yearly";
  hostingStatus: "active" | "expiring_soon" | "expired" | "suspended";
  hostingPriceBdt: number;
  policies?: Record<string, any>;
  lastHeartbeatAt?: string;
}

export interface SupportTicket {
  id: number;
  clientKey: string;
  category: string;
  title: string;
  description: string;
  pageUrl?: string;
  browserInfo?: string;
  errorLogs?: string[];
  screenshotUrl?: string;
  priority: "low" | "normal" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  resolutionNotes?: string;
  createdAt: string;
}

export interface FleetSummary {
  total: number;
  healthy: number;
  degraded: number;
  offline: number;
  avgDiskUsagePct: number;
}

interface FleetStore {
  clients: ClientFleet[];
  summary: FleetSummary;
  tickets: SupportTicket[];
  loading: boolean;
  error: string | null;
  fetchFleet: () => Promise<void>;
  fetchTickets: () => Promise<void>;
  dispatchTask: (clientKey: string, actionType: string, payload?: any) => Promise<string>;
  updateTicketStatus: (ticketId: number, status: string, notes?: string) => Promise<void>;
  updateHosting: (clientKey: string, hostingData: any) => Promise<void>;
}

export const useFleetStore = create<FleetStore>((set, get) => ({
  clients: [],
  summary: { total: 0, healthy: 0, degraded: 0, offline: 0, avgDiskUsagePct: 0 },
  tickets: [],
  loading: false,
  error: null,

  fetchFleet: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axios.get("/api/fleet/clients");
      if (res.data.success) {
        set({ clients: res.data.data, summary: res.data.summary, loading: false });
      }
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchTickets: async () => {
    try {
      const res = await axios.get("/api/tickets");
      if (res.data.success) {
        set({ tickets: res.data.data });
      }
    } catch (err: any) {
      console.error("Fetch tickets error:", err);
    }
  },

  dispatchTask: async (clientKey: string, actionType: string, payload: any = {}) => {
    const res = await axios.post("/api/fleet/tasks", {
      clientKey,
      actionType,
      payload,
      requestedBy: "super_admin",
    });
    return res.data.taskId;
  },

  updateTicketStatus: async (ticketId: number, status: string, resolutionNotes?: string) => {
    await axios.patch(`/api/tickets/${ticketId}`, { status, resolutionNotes });
    get().fetchTickets();
  },

  updateHosting: async (clientKey: string, hostingData: any) => {
    await axios.post(`/api/billing/clients/${clientKey}`, hostingData);
    get().fetchFleet();
  },
}));
