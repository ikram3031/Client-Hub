import { Schema, Document, Connection } from "mongoose";

export interface IProject extends Document {
  name: string;
  slug: string;
  description?: string;
  dbName: string;
  docsCategories: string[];
  logScopes: string[];
  createdAt: Date;
  updatedAt: Date;
}

export const ProjectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: "" },
    dbName: { type: String, required: true },
    docsCategories: {
      type: [String],
      default: ["Architecture", "Frontend", "Backend", "Dashboard"],
    },
    logScopes: {
      type: [String],
      default: ["frontend", "backend", "dashboard"],
    },
  },
  { timestamps: true }
);

export function getProjectModel(conn: Connection) {
  return conn.models.Project || conn.model<IProject>("Project", ProjectSchema);
}
