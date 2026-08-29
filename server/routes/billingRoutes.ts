import { Router } from "express";
import { queryD1 } from "../config/d1";

export const billingRouter = Router();

// 1. Get Hosting Status & Active Banners for a Client
billingRouter.get("/alerts/:clientKey", async (req, res) => {
  try {
    const { clientKey } = req.params;

    const clientRows = await queryD1(
      `SELECT client_key, brand_name, hosting_package, hosting_start_date, hosting_expiry_date, hosting_billing_cycle, hosting_status, hosting_price_bdt
       FROM clients WHERE client_key = ?`,
      [clientKey]
    );

    if (!clientRows || clientRows.length === 0) {
      return res.status(404).json({ success: false, error: "Client not found" });
    }

    const client = clientRows[0];

    // Compute remaining days
    let daysRemaining = null;
    let showWarningBanner = false;

    if (client.hosting_expiry_date) {
      const expiryTime = new Date(client.hosting_expiry_date).getTime();
      const nowTime = Date.now();
      const diffDays = Math.ceil((expiryTime - nowTime) / (1000 * 60 * 60 * 24));
      daysRemaining = diffDays;

      if (diffDays <= 14) {
        showWarningBanner = true;
      }
    }

    // Fetch custom broadcast banners
    const customAlerts = await queryD1(
      `SELECT * FROM billing_alerts WHERE client_key = ? AND is_active = 1`,
      [clientKey]
    );

    res.json({
      success: true,
      data: {
        clientKey: client.client_key,
        brandName: client.brand_name,
        hostingPackage: client.hosting_package,
        hostingStartDate: client.hosting_start_date,
        hostingExpiryDate: client.hosting_expiry_date,
        hostingBillingCycle: client.hosting_billing_cycle,
        hostingStatus: client.hosting_status,
        hostingPriceBdt: client.hosting_price_bdt,
        daysRemaining,
        showWarningBanner,
        warningMessage:
          daysRemaining !== null && daysRemaining <= 14
            ? `আপনার হোস্টিং সার্ভিসের মেয়াদ আর ${daysRemaining > 0 ? daysRemaining : 0} দিন পর শেষ হবে। নিরবচ্ছিন্ন সেবার জন্য অনুগ্রহ করে রিনিউ করুন।`
            : null,
        customAlerts,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Update Client Hosting Subscription Details (Super-Admin)
billingRouter.post("/clients/:clientKey", async (req, res) => {
  try {
    const { clientKey } = req.params;
    const {
      hostingPackage,
      hostingStartDate,
      hostingExpiryDate,
      hostingBillingCycle,
      hostingStatus,
      hostingPriceBdt,
    } = req.body;

    await queryD1(
      `UPDATE clients
       SET hosting_package = COALESCE(?, hosting_package),
           hosting_start_date = COALESCE(?, hosting_start_date),
           hosting_expiry_date = COALESCE(?, hosting_expiry_date),
           hosting_billing_cycle = COALESCE(?, hosting_billing_cycle),
           hosting_status = COALESCE(?, hosting_status),
           hosting_price_bdt = COALESCE(?, hosting_price_bdt),
           updated_at = CURRENT_TIMESTAMP
       WHERE client_key = ?`,
      [
        hostingPackage || null,
        hostingStartDate || null,
        hostingExpiryDate || null,
        hostingBillingCycle || null,
        hostingStatus || null,
        hostingPriceBdt || null,
        clientKey,
      ]
    );

    res.json({ success: true, message: `Hosting subscription updated for client [${clientKey}]` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Create or Toggle Custom Broadcast Alert Banner
billingRouter.post("/alerts", async (req, res) => {
  try {
    const { clientKey, title, message, bannerType, actionButtonText, actionButtonUrl, expiresAt } = req.body;

    if (!clientKey || !title || !message) {
      return res.status(422).json({ success: false, error: "clientKey, title, and message are required" });
    }

    await queryD1(
      `INSERT INTO billing_alerts (client_key, title, message, banner_type, action_button_text, action_button_url, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        clientKey,
        title,
        message,
        bannerType || "warning",
        actionButtonText || null,
        actionButtonUrl || null,
        expiresAt || null,
      ]
    );

    res.json({ success: true, message: "Alert banner broadcast created" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
