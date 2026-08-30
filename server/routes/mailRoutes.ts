import { Router, Request, Response, NextFunction } from "express";
import {
  getClientMailConfig,
  isMailServiceEnabled,
  toggleMailService,
  updateClientMailConfig,
} from "../services/mail/mailConfigManager";
import {
  getClientFolders,
  getClientMessages,
  getMessageById,
  updateMessageStatus,
  saveSentMessage,
  ingestStorefrontInquiry,
} from "../services/mail/mailStore";
import { sendEmailViaSmtp } from "../services/mail/smtpService";

export const mailRouter = Router();

// Middleware: Guard checking if Mail Service is enabled for the requested client
const checkMailServiceEnabled = (req: Request, res: Response, next: NextFunction) => {
  const clientKey = (req.query.clientKey || req.body.clientKey || "decantre") as string;

  if (!isMailServiceEnabled(clientKey)) {
    return res.status(403).json({
      success: false,
      serviceEnabled: false,
      error: `Webmail service is disabled for client [${clientKey}]. Please enable it in client config.`,
    });
  }
  next();
};

// 1. Get Webmail Service Status & Settings for a client
mailRouter.get("/status", (req: Request, res: Response) => {
  try {
    const clientKey = (req.query.clientKey || "decantre") as string;
    const config = getClientMailConfig(clientKey);

    if (!config) {
      return res.json({
        success: true,
        serviceEnabled: false,
        message: `No mail service configuration found for client [${clientKey}]`,
      });
    }

    res.json({
      success: true,
      serviceEnabled: config.enabled,
      data: {
        clientKey: config.clientKey,
        enabled: config.enabled,
        brandName: config.brandName,
        accountEmail: config.accountEmail,
        maxAttachmentSizeMb: config.maxAttachmentSizeMb || 2,
        imapHost: config.imapHost,
        smtpHost: config.smtpHost,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Toggle Webmail Service on/off for a client (Admin Control)
mailRouter.post("/toggle-service", (req: Request, res: Response) => {
  try {
    const { clientKey, enabled } = req.body;
    if (!clientKey || enabled === undefined) {
      return res.status(422).json({ success: false, error: "clientKey and enabled (boolean) are required" });
    }

    const updated = toggleMailService(clientKey, Boolean(enabled));
    if (!updated) {
      return res.status(404).json({ success: false, error: `Client [${clientKey}] not found` });
    }

    res.json({
      success: true,
      message: `Webmail service ${enabled ? "enabled" : "disabled"} for client [${clientKey}]`,
      data: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Get Mail Folders & Unread Counts (Inbox, Sent, Drafts, Spam, Trash)
mailRouter.get("/folders", checkMailServiceEnabled, (req: Request, res: Response) => {
  try {
    const clientKey = (req.query.clientKey || "decantre") as string;
    const folders = getClientFolders(clientKey);
    res.json({ success: true, data: folders });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Get Message Thread List for a folder
mailRouter.get("/messages", checkMailServiceEnabled, (req: Request, res: Response) => {
  try {
    const clientKey = (req.query.clientKey || "decantre") as string;
    const folder = (req.query.folder || "INBOX") as string;
    const search = req.query.search as string;

    const messages = getClientMessages(clientKey, folder, search);
    res.json({ success: true, count: messages.length, data: messages });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Get Single Message Details
mailRouter.get("/messages/:id", checkMailServiceEnabled, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const clientKey = (req.query.clientKey || "decantre") as string;

    const message = getMessageById(id, clientKey);
    if (!message) {
      return res.status(404).json({ success: false, error: "Message not found" });
    }

    // Auto mark as read on view
    updateMessageStatus(id, clientKey, { isRead: true });

    res.json({ success: true, data: message });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Send / Reply to an Email via SMTP (Strict 2MB Attachment Limit)
mailRouter.post("/send", checkMailServiceEnabled, async (req: Request, res: Response) => {
  try {
    const { clientKey = "decantre", toEmail, subject, bodyText, bodyHtml, attachments } = req.body;

    if (!toEmail || !subject || !bodyText) {
      return res.status(422).json({
        success: false,
        error: "toEmail, subject, and bodyText are required",
      });
    }

    const config = getClientMailConfig(clientKey);
    if (!config) {
      return res.status(404).json({ success: false, error: "Client mail configuration not found" });
    }

    // Send via SMTP engine with 2MB limit validation
    const result = await sendEmailViaSmtp(config, {
      clientKey,
      toEmail,
      subject,
      bodyText,
      bodyHtml,
      attachments,
    });

    // Save to sent folder
    const sentMsg = saveSentMessage(
      clientKey,
      config.accountEmail,
      toEmail,
      subject,
      bodyText,
      bodyHtml
    );

    res.json({
      success: true,
      message: `Email sent to [${toEmail}] successfully`,
      messageId: result.messageId,
      sentMessage: sentMsg,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Update Message Status (Mark Read, Star, Move to Trash)
mailRouter.patch("/messages/:id", checkMailServiceEnabled, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { clientKey = "decantre", isRead, isStarred, folder } = req.body;

    const updated = updateMessageStatus(id, clientKey, { isRead, isStarred, folder });
    if (!updated) {
      return res.status(404).json({ success: false, error: "Message not found" });
    }

    res.json({ success: true, message: "Message updated", data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Ingest Storefront Contact Form Inquiry (Public Store API)
mailRouter.post("/ingest", (req: Request, res: Response) => {
  try {
    const { clientKey = "decantre", name, email, subject, message, phone } = req.body;

    if (!name || !email || !message) {
      return res.status(422).json({
        success: false,
        error: "name, email, and message are required fields",
      });
    }

    const newInquiry = ingestStorefrontInquiry(clientKey, name, email, subject, message, phone);

    res.json({
      success: true,
      message: "Inquiry received and synced to client inbox",
      inquiryId: newInquiry.id,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Manual Sync Trigger (Simulates IMAP IDLE fetch)
mailRouter.post("/sync", checkMailServiceEnabled, (req: Request, res: Response) => {
  try {
    const clientKey = (req.query.clientKey || req.body.clientKey || "decantre") as string;
    res.json({
      success: true,
      message: `IMAP sync completed for client [${clientKey}]`,
      syncedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
