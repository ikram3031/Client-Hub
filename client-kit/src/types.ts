export interface ClientHubConfig {
  hubUrl: string;
  clientKey: string;
  projectSlug?: string;
  apiKey?: string;
  pollIntervalMs?: number;
  theme?: "dark" | "light" | "auto";
}

export interface VpsTelemetry {
  client_key: string;
  brand_name?: string;
  brandName?: string;
  domain?: string;
  vps_ip?: string;
  app_version?: string;
  git_commit_hash?: string;
  last_deployed_at?: string;
  status: "healthy" | "degraded" | "critical" | "unknown";
  disk_total_gb: number;
  disk_used_gb: number;
  disk_free_pct: number;
  memory_rss_mb: number;
  cpu_load_pct: number;
  db_status: string;
  uptime_seconds?: number;
  last_heartbeat_at?: string;
}

export interface ActionLog {
  id: string;
  project_slug: string;
  scope: string;
  action: string;
  summary: string;
  prompt_used?: string;
  changed_files?: string[] | string;
  diff_summary?: string;
  commit_id?: string;
  created_at: string;
}

export interface SupportTicket {
  id: number;
  client_key: string;
  category: string;
  title: string;
  description: string;
  priority: "low" | "normal" | "urgent";
  status: "open" | "in_progress" | "resolved";
  resolution_notes?: string;
  created_at: string;
  resolved_at?: string;
}
