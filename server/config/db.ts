import mongoose, { Connection } from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const MASTER_DB_NAME = process.env.MASTER_DB_NAME || "hub_master";

// Connection pool cache for tenant databases
const connectionCache: Map<string, Connection> = new Map();

let masterConnection: Connection | null = null;

/**
 * Connects to the Master database (Project catalog / metadata)
 */
export async function getMasterConnection(): Promise<Connection> {
  if (masterConnection && masterConnection.readyState === 1) {
    return masterConnection;
  }

  masterConnection = await mongoose.createConnection(`${MONGO_URI}/${MASTER_DB_NAME}`).asPromise();
  console.log(`[Database] Connected to Master Registry DB: ${MASTER_DB_NAME}`);
  return masterConnection;
}

/**
 * Dynamically resolves or creates a database connection for a specific project
 * @param projectSlug e.g. "client-erp", "white-label-pos"
 */
export async function getProjectConnection(projectSlug: string): Promise<Connection> {
  const sanitizedSlug = projectSlug.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  const dbName = `hub_proj_${sanitizedSlug}`;

  if (connectionCache.has(dbName)) {
    const conn = connectionCache.get(dbName)!;
    if (conn.readyState === 1) {
      return conn;
    }
  }

  const conn = await mongoose.createConnection(`${MONGO_URI}/${dbName}`).asPromise();
  connectionCache.set(dbName, conn);
  console.log(`[Database] Switched/Connected to Project Database: ${dbName}`);
  return conn;
}
