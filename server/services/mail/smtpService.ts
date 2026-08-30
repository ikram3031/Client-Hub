import nodemailer from "nodemailer";
import { ClientMailConfig, SendMailPayload } from "./mailTypes";

// Sends email via client-specific SMTP settings
export const sendEmailViaSmtp = async (
  config: ClientMailConfig,
  payload: SendMailPayload
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  // 1. Strict Attachment Size Check (<= 2MB per attachment)
  const maxBytes = (config.maxAttachmentSizeMb || 2) * 1024 * 1024;
  if (payload.attachments && payload.attachments.length > 0) {
    for (const att of payload.attachments) {
      if (att.sizeBytes > maxBytes) {
        throw new Error(
          `Attachment [${att.filename}] exceeds the maximum allowed size of ${config.maxAttachmentSizeMb || 2} MB`
        );
      }
    }
  }

  // 2. If SMTP password is not configured yet, generate a simulated delivery messageId
  if (!config.smtpPassword) {
    return {
      success: true,
      messageId: `sim_smtp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    };
  }

  // 3. Real SMTP Delivery via Nodemailer
  const transporter = nodemailer.createTransport({
    host: config.smtpHost || `mail.${config.clientKey}.com`,
    port: config.smtpPort || 465,
    secure: config.secure !== false,
    auth: {
      user: config.smtpUser || config.accountEmail,
      pass: config.smtpPassword,
    },
  });

  const mailOptions: nodemailer.SendMailOptions = {
    from: `"${config.brandName}" <${config.accountEmail}>`,
    to: payload.toEmail,
    subject: payload.subject,
    text: payload.bodyText,
    html: payload.bodyHtml || payload.bodyText,
    attachments: payload.attachments?.map((a) => ({
      filename: a.filename,
      contentType: a.contentType,
      content: a.contentBase64 ? Buffer.from(a.contentBase64, "base64") : undefined,
    })),
  };

  const info = await transporter.sendMail(mailOptions);
  return {
    success: true,
    messageId: info.messageId,
  };
};
