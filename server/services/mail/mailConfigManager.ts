import { ClientMailConfig } from "./mailTypes";
import { queryD1 } from "../../config/d1";

// Default in-memory tenant mail configurations
const defaultClientConfigs: Record<string, ClientMailConfig> = {
  decantre: {
    clientKey: "decantre",
    enabled: true,
    brandName: "Decantre Perfumery",
    accountEmail: "support@decantrebd.com",
    imapHost: "mail.decantrebd.com",
    imapPort: 993,
    imapUser: "support@decantrebd.com",
    smtpHost: "mail.decantrebd.com",
    smtpPort: 465,
    smtpUser: "support@decantrebd.com",
    secure: true,
    maxAttachmentSizeMb: 2,
  },
  engulfic: {
    clientKey: "engulfic",
    enabled: true,
    brandName: "Engulfic Official",
    accountEmail: "support@engulfic.com",
    imapHost: "mail.engulfic.com",
    imapPort: 993,
    imapUser: "support@engulfic.com",
    smtpHost: "mail.engulfic.com",
    smtpPort: 465,
    smtpUser: "support@engulfic.com",
    secure: true,
    maxAttachmentSizeMb: 2,
  },
  toyoland: {
    clientKey: "toyoland",
    enabled: true,
    brandName: "Toyoland",
    accountEmail: "support@toyoland.shop",
    imapHost: "mail.toyoland.shop",
    imapPort: 993,
    imapUser: "support@toyoland.shop",
    smtpHost: "mail.toyoland.shop",
    smtpPort: 465,
    smtpUser: "support@toyoland.shop",
    secure: true,
    maxAttachmentSizeMb: 2,
  },
};

// Gets mail config for a specific client
export const getClientMailConfig = (clientKey: string): ClientMailConfig | null => {
  const normalizedKey = clientKey.toLowerCase().trim();
  return defaultClientConfigs[normalizedKey] || null;
};

// Checks if webmail service is enabled for a given client
export const isMailServiceEnabled = (clientKey: string): boolean => {
  const config = getClientMailConfig(clientKey);
  return config?.enabled === true;
};

// Toggles the mail service on or off for a client
export const toggleMailService = (clientKey: string, enabled: boolean): ClientMailConfig | null => {
  const normalizedKey = clientKey.toLowerCase().trim();
  if (defaultClientConfigs[normalizedKey]) {
    defaultClientConfigs[normalizedKey].enabled = enabled;
    return defaultClientConfigs[normalizedKey];
  }
  return null;
};

// Updates mail credentials for a client
export const updateClientMailConfig = (
  clientKey: string,
  updates: Partial<ClientMailConfig>
): ClientMailConfig => {
  const normalizedKey = clientKey.toLowerCase().trim();
  if (!defaultClientConfigs[normalizedKey]) {
    defaultClientConfigs[normalizedKey] = {
      clientKey: normalizedKey,
      enabled: true,
      brandName: updates.brandName || normalizedKey,
      accountEmail: updates.accountEmail || `support@${normalizedKey}.com`,
      maxAttachmentSizeMb: 2,
      ...updates,
    };
  } else {
    defaultClientConfigs[normalizedKey] = {
      ...defaultClientConfigs[normalizedKey],
      ...updates,
    };
  }
  return defaultClientConfigs[normalizedKey];
};
