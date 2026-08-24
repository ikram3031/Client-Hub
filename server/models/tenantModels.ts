import { Schema, Document, Connection } from "mongoose";

// --- 1. DOCS SCHEMA (Wiki / Architecture / Specs) ---
export interface IDoc extends Document {
  category: string; // e.g. "Architecture", "Frontend", "Backend", "Dashboard"
  title: string;
  slug: string;
  content: string; // Markdown / Code snippets
  tags: string[];
  lastEditedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export const DocSchema = new Schema<IDoc>(
  {
    category: { type: String, required: true, index: true },
    title: { type: String, required: true },
    slug: { type: String, required: true, index: true },
    content: { type: String, default: "" },
    tags: { type: [String], default: [] },
    lastEditedBy: { type: String, default: "AI Assistant" },
  },
  { timestamps: true }
);

// --- 2. JIRA-STYLE FEATURE / EPIC SCHEMA ---
export interface IFeature extends Document {
  key: string; // e.g. "FEAT-101"
  scope: string; // e.g. "frontend", "backend", "dashboard"
  title: string;
  description: string;
  status: "todo" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  createdAt: Date;
  updatedAt: Date;
}

export const FeatureSchema = new Schema<IFeature>(
  {
    key: { type: String, required: true, unique: true, index: true },
    scope: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["todo", "in_progress", "review", "done"],
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
  },
  { timestamps: true }
);

// --- 3. SUBTASK / SUB-TOPIC SCHEMA ---
export interface ISubTask extends Document {
  key: string; // e.g. "TASK-101-1"
  featureKey: string; // reference to "FEAT-101"
  title: string;
  status: "todo" | "in_progress" | "review" | "done";
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export const SubTaskSchema = new Schema<ISubTask>(
  {
    key: { type: String, required: true, unique: true, index: true },
    featureKey: { type: String, required: true, index: true },
    title: { type: String, required: true },
    status: {
      type: String,
      enum: ["todo", "in_progress", "review", "done"],
      default: "todo",
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

// --- 4. ACTION / AI LOG SCHEMA ---
export interface ILogEntry extends Document {
  scope: string; // "frontend" | "backend" | "dashboard"
  featureKey?: string; // e.g. "FEAT-101"
  subTaskKey?: string; // e.g. "TASK-101-1"
  action: string; // "feature" | "bugfix" | "refactor" | "ai_prompt" | "config"
  summary: string;
  promptUsed?: string;
  changedFiles: string[];
  diffSummary?: string;
  createdAt: Date;
}

export const LogEntrySchema = new Schema<ILogEntry>(
  {
    scope: { type: String, required: true, index: true },
    featureKey: { type: String, default: null, index: true },
    subTaskKey: { type: String, default: null, index: true },
    action: { type: String, default: "feature" },
    summary: { type: String, required: true },
    promptUsed: { type: String, default: "" },
    changedFiles: { type: [String], default: [] },
    diffSummary: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Helper methods to bind models with tenant project connections
export function getTenantModels(conn: Connection) {
  return {
    Doc: conn.models.Doc || conn.model<IDoc>("Doc", DocSchema),
    Feature: conn.models.Feature || conn.model<IFeature>("Feature", FeatureSchema),
    SubTask: conn.models.SubTask || conn.model<ISubTask>("SubTask", SubTaskSchema),
    LogEntry: conn.models.LogEntry || conn.model<ILogEntry>("LogEntry", LogEntrySchema),
  };
}
