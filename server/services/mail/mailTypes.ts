export interface ClientMailConfig {
  clientKey: string;
  enabled: boolean;
  brandName: string;
  accountEmail: string;
  imapHost?: string;
  imapPort?: number;
  imapUser?: string;
  imapPassword?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  secure?: boolean;
  maxAttachmentSizeMb?: number;
  lastSyncAt?: string;
}

export interface MailFolder {
  id: string;
  name: string;
  icon: string;
  totalCount: number;
  unreadCount: number;
}

export interface MailAttachment {
  filename: string;
  contentType: string;
  sizeBytes: number;
  url?: string;
}

export interface MailMessage {
  id: string;
  clientKey: string;
  folder: "INBOX" | "SENT" | "SPAM" | "TRASH" | "DRAFTS";
  fromName: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  snippet: string;
  bodyText: string;
  bodyHtml?: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  attachments?: MailAttachment[];
  customerOrder?: {
    orderId: string;
    totalAmount: string;
    status: string;
    phone: string;
  };
}

export interface SendMailPayload {
  clientKey: string;
  toEmail: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  inReplyToId?: string;
  attachments?: Array<{
    filename: string;
    contentType: string;
    contentBase64?: string;
    sizeBytes: number;
  }>;
}
