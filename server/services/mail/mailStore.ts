import { MailFolder, MailMessage } from "./mailTypes";

// Initial seed messages partitioned by client
const mockMessages: MailMessage[] = [
  {
    id: "msg_dec_01",
    clientKey: "decantre",
    folder: "INBOX",
    fromName: "Tanvir Rahman",
    fromEmail: "tanvir.r@gmail.com",
    toEmail: "support@decantrebd.com",
    subject: "Inquiry regarding Baccarat Rouge 540 Extrait batch availability",
    snippet: "Hello Decantre team, do you currently have the 2024 batch of BR540 in 10ml decants?",
    bodyText: "Hello Decantre team,\n\nDo you currently have the 2024 batch of Maison Francis Kurkdjian Baccarat Rouge 540 Extrait in 10ml decants available for delivery to Dhanmondi?\n\nThanks,\nTanvir Rahman",
    date: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    isRead: false,
    isStarred: true,
    hasAttachments: false,
    customerOrder: {
      orderId: "ORD-9482",
      totalAmount: "৳4,850",
      status: "Delivered",
      phone: "+8801711223344",
    },
  },
  {
    id: "msg_dec_02",
    clientKey: "decantre",
    folder: "INBOX",
    fromName: "Nusrat Jahan",
    fromEmail: "nusrat.jahan@yahoo.com",
    toEmail: "support@decantrebd.com",
    subject: "bKash payment confirmation for Order #ORD-9510",
    snippet: "I have sent the bKash payment for my Creed Aventus decant order...",
    bodyText: "Dear Support,\n\nI have sent the bKash advance of ৳1,020 for Order #ORD-9510 from TrxID 9K3L8MN2PQ. Please confirm and dispatch today.\n\nWarm regards,\nNusrat Jahan",
    date: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    isRead: true,
    isStarred: false,
    hasAttachments: false,
    customerOrder: {
      orderId: "ORD-9510",
      totalAmount: "৳6,200",
      status: "Processing",
      phone: "+8801819556677",
    },
  },
  {
    id: "msg_dec_03",
    clientKey: "decantre",
    folder: "SENT",
    fromName: "Decantre Support",
    fromEmail: "support@decantrebd.com",
    toEmail: "siam.ahmed@gmail.com",
    subject: "Re: Order #ORD-9470 tracking update",
    snippet: "Your parcel has been handed over to Steadfast Courier with Tracking Code...",
    bodyText: "Dear Siam,\n\nYour order has been handed over to Steadfast Courier. You can track your parcel using code STDF-984321.\n\nThank you for choosing Decantre!",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    isRead: true,
    isStarred: false,
    hasAttachments: false,
  },
  {
    id: "msg_eng_01",
    clientKey: "engulfic",
    folder: "INBOX",
    fromName: "Kazi Farhan",
    fromEmail: "farhan.kazi@gmail.com",
    toEmail: "support@engulfic.com",
    subject: "Bulk order quote for corporate apparel",
    snippet: "We need 150 pieces of custom embroidered hoodies for our tech team...",
    bodyText: "Hi Engulfic,\n\nWe need 150 pieces of custom embroidered heavyweight hoodies for our tech team. Can you provide a price quote and delivery estimate?\n\nRegards,\nFarhan",
    date: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    isRead: false,
    isStarred: true,
    hasAttachments: false,
  },
];

let messagesStore: MailMessage[] = [...mockMessages];

// Aggregates folder counts for a specific client
export const getClientFolders = (clientKey: string): MailFolder[] => {
  const normalizedKey = clientKey.toLowerCase().trim();
  const clientMsgs = messagesStore.filter((m) => m.clientKey === normalizedKey);

  const inboxTotal = clientMsgs.filter((m) => m.folder === "INBOX").length;
  const inboxUnread = clientMsgs.filter((m) => m.folder === "INBOX" && !m.isRead).length;

  const sentTotal = clientMsgs.filter((m) => m.folder === "SENT").length;
  const draftsTotal = clientMsgs.filter((m) => m.folder === "DRAFTS").length;
  const trashTotal = clientMsgs.filter((m) => m.folder === "TRASH").length;
  const spamTotal = clientMsgs.filter((m) => m.folder === "SPAM").length;

  return [
    { id: "INBOX", name: "Inbox", icon: "Inbox", totalCount: inboxTotal, unreadCount: inboxUnread },
    { id: "SENT", name: "Sent", icon: "Send", totalCount: sentTotal, unreadCount: 0 },
    { id: "DRAFTS", name: "Drafts", icon: "FileText", totalCount: draftsTotal, unreadCount: 0 },
    { id: "SPAM", name: "Spam", icon: "AlertOctagon", totalCount: spamTotal, unreadCount: 0 },
    { id: "TRASH", name: "Trash", icon: "Trash2", totalCount: trashTotal, unreadCount: 0 },
  ];
};

// Gets messages for a client folder
export const getClientMessages = (
  clientKey: string,
  folder: string = "INBOX",
  search?: string
): MailMessage[] => {
  const normalizedKey = clientKey.toLowerCase().trim();
  let msgs = messagesStore.filter(
    (m) => m.clientKey === normalizedKey && m.folder.toUpperCase() === folder.toUpperCase()
  );

  if (search) {
    const q = search.toLowerCase();
    msgs = msgs.filter(
      (m) =>
        m.subject.toLowerCase().includes(q) ||
        m.fromName.toLowerCase().includes(q) ||
        m.fromEmail.toLowerCase().includes(q) ||
        m.snippet.toLowerCase().includes(q)
    );
  }

  return msgs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Gets a single message by ID
export const getMessageById = (id: string, clientKey: string): MailMessage | null => {
  const normalizedKey = clientKey.toLowerCase().trim();
  return messagesStore.find((m) => m.id === id && m.clientKey === normalizedKey) || null;
};

// Updates message status (read, starred, folder movement)
export const updateMessageStatus = (
  id: string,
  clientKey: string,
  updates: { isRead?: boolean; isStarred?: boolean; folder?: "INBOX" | "SENT" | "SPAM" | "TRASH" | "DRAFTS" }
): MailMessage | null => {
  const normalizedKey = clientKey.toLowerCase().trim();
  const idx = messagesStore.findIndex((m) => m.id === id && m.clientKey === normalizedKey);
  if (idx !== -1) {
    messagesStore[idx] = {
      ...messagesStore[idx],
      ...updates,
    };
    return messagesStore[idx];
  }
  return null;
};

// Saves a newly sent message to Sent folder
export const saveSentMessage = (
  clientKey: string,
  fromEmail: string,
  toEmail: string,
  subject: string,
  bodyText: string,
  bodyHtml?: string
): MailMessage => {
  const newMsg: MailMessage = {
    id: `msg_sent_${Date.now()}`,
    clientKey: clientKey.toLowerCase().trim(),
    folder: "SENT",
    fromName: "Store Support",
    fromEmail,
    toEmail,
    subject,
    snippet: bodyText.slice(0, 120),
    bodyText,
    bodyHtml,
    date: new Date().toISOString(),
    isRead: true,
    isStarred: false,
    hasAttachments: false,
  };

  messagesStore.unshift(newMsg);
  return newMsg;
};

// Ingests an inquiry from storefront contact form
export const ingestStorefrontInquiry = (
  clientKey: string,
  name: string,
  email: string,
  subject: string,
  message: string,
  phone?: string
): MailMessage => {
  const newMsg: MailMessage = {
    id: `inq_${Date.now()}`,
    clientKey: clientKey.toLowerCase().trim(),
    folder: "INBOX",
    fromName: name,
    fromEmail: email,
    toEmail: `support@${clientKey}.com`,
    subject: subject || "Storefront Customer Inquiry",
    snippet: message.slice(0, 120),
    bodyText: `Customer Name: ${name}\nEmail: ${email}\nPhone: ${phone || "N/A"}\n\nMessage:\n${message}`,
    date: new Date().toISOString(),
    isRead: false,
    isStarred: false,
    hasAttachments: false,
    customerOrder: phone
      ? {
          orderId: "Inquiry",
          totalAmount: "N/A",
          status: "Customer Lead",
          phone,
        }
      : undefined,
  };

  messagesStore.unshift(newMsg);
  return newMsg;
};
