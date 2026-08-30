import { Request, Response, NextFunction } from "express";
import { queryD1 } from "../config/d1";

// Validates Bearer API key against client_secret_token in D1 clients table
export const requireApiKey = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"] as string | undefined;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Missing or invalid Authorization header. Use: Bearer <apiKey>" });
  }

  const token = authHeader.slice(7).trim();

  try {
    const rows = await queryD1(
      `SELECT client_key, brand_name FROM clients WHERE client_secret_token = ? LIMIT 1`,
      [token]
    );

    if (!rows || rows.length === 0) {
      return res.status(401).json({ success: false, error: "Invalid API key. Generate one from the ClientHub Admin Panel." });
    }

    (req as any).authenticatedClient = { clientKey: rows[0].client_key, brandName: rows[0].brand_name };
    next();
  } catch (err: any) {
    console.error("[Auth Middleware Error]:", err.message);
    res.status(500).json({ success: false, error: "Authentication check failed" });
  }
};