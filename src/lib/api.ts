export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  docs_categories: string[];
  log_scopes: string[];
  created_at: string;
  updated_at: string;
}

export interface DocItem {
  id: string;
  project_slug: string;
  category: string;
  title: string;
  slug: string;
  content: string;
  tags: string[];
  last_edited_by: string;
  created_at: string;
  updated_at: string;
}

export interface Feature {
  id: string;
  project_slug: string;
  key: string;
  scope: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  subtasks: SubTask[];
  created_at: string;
}

export interface SubTask {
  id: string;
  project_slug: string;
  key: string;
  feature_key: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  notes: string;
}

export interface ActionLog {
  id: string;
  project_slug: string;
  scope: string;
  feature_key?: string;
  sub_task_key?: string;
  action: "feature" | "bugfix" | "refactor" | "config" | string;
  summary: string;
  prompt_used?: string;
  changed_files: string[];
  changedFiles?: string[];
  diff_summary?: string;
  commit_id?: string;
  created_at: string;
}

const API_BASE = "http://localhost:5000/api";

// Fetches all registered projects from central registry
export const fetchProjects = async (): Promise<Project[]> => {
  const res = await fetch(`${API_BASE}/projects`);
  const data = await res.json();
  return (data.projects || []).map((p: any) => ({
    ...p,
    docs_categories: typeof p.docs_categories === "string" ? JSON.parse(p.docs_categories || "[]") : (p.docs_categories || []),
    log_scopes: typeof p.log_scopes === "string" ? JSON.parse(p.log_scopes || "[]") : (p.log_scopes || []),
  }));
};

// Onboards a new project to Cloudflare D1 hub
export const createProject = async (payload: {
  name: string;
  slug: string;
  description?: string;
  docsCategories?: string[];
  logScopes?: string[];
}) => {
  const res = await fetch(`${API_BASE}/projects/onboard`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
};

// Retrieves documents for a specific project and optional category
export const fetchDocs = async (projectSlug: string, category?: string): Promise<DocItem[]> => {
  const url = category
    ? `${API_BASE}/projects/${projectSlug}/docs?category=${encodeURIComponent(category)}`
    : `${API_BASE}/projects/${projectSlug}/docs`;
  const res = await fetch(url);
  const data = await res.json();
  return (data.docs || []).map((d: any) => ({
    ...d,
    tags: typeof d.tags === "string" ? JSON.parse(d.tags || "[]") : (d.tags || []),
  }));
};

// Retrieves a single document by project and doc slug
export const fetchDocBySlug = async (projectSlug: string, docSlug: string): Promise<DocItem | null> => {
  const res = await fetch(`${API_BASE}/projects/${projectSlug}/docs/${docSlug}`);
  const data = await res.json();
  if (!data.success) return null;
  return {
    ...data.doc,
    tags: typeof data.doc.tags === "string" ? JSON.parse(data.doc.tags || "[]") : (data.doc.tags || []),
  };
};

// Creates a new document under project category
export const saveDoc = async (projectSlug: string, doc: {
  category: string;
  title: string;
  slug: string;
  content: string;
  tags?: string[];
  lastEditedBy?: string;
}) => {
  const res = await fetch(`${API_BASE}/projects/${projectSlug}/docs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(doc),
  });
  return res.json();
};

// Updates an existing document in project
export const updateDoc = async (projectSlug: string, docSlug: string, updates: Partial<DocItem>) => {
  const res = await fetch(`${API_BASE}/projects/${projectSlug}/docs/${docSlug}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  return res.json();
};

// Deletes a document from project
export const deleteDoc = async (projectSlug: string, docSlug: string) => {
  const res = await fetch(`${API_BASE}/projects/${projectSlug}/docs/${docSlug}`, {
    method: "DELETE",
  });
  return res.json();
};

// Fetches JIRA-style features and nested subtasks
export const fetchFeatures = async (projectSlug: string): Promise<Feature[]> => {
  const res = await fetch(`${API_BASE}/projects/${projectSlug}/features`);
  const data = await res.json();
  return data.features || [];
};

// Fetches AI action logs stream with filters
export const fetchLogs = async (projectSlug: string, filters?: { scope?: string; featureKey?: string; limit?: number }): Promise<ActionLog[]> => {
  const query = new URLSearchParams();
  if (filters?.scope && filters.scope !== "all") query.set("scope", filters.scope);
  if (filters?.featureKey) query.set("featureKey", filters.featureKey);
  if (filters?.limit) query.set("limit", filters.limit.toString());

  const res = await fetch(`${API_BASE}/projects/${projectSlug}/logs?${query.toString()}`);
  const data = await res.json();
  return (data.logs || []).map((l: any) => ({
    ...l,
    changed_files: Array.isArray(l.changedFiles) ? l.changedFiles : (typeof l.changed_files === "string" ? JSON.parse(l.changed_files || "[]") : []),
  }));
};

// Posts an AI action log to project
export const postLog = async (projectSlug: string, logData: {
  scope: string;
  featureKey?: string;
  subTaskKey?: string;
  action?: string;
  summary: string;
  promptUsed?: string;
  changedFiles?: string[];
  diffSummary?: string;
  commitId?: string;
}) => {
  const res = await fetch(`${API_BASE}/projects/${projectSlug}/logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(logData),
  });
  return res.json();
};
