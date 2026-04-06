/**
 * Gmail API OAuth integration service.
 * Handles OAuth flow, token management, and email operations.
 * 
 * AI Attribution: This module was architected by Claude Sonnet 4 via Manus agent.
 */
import axios from "axios";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_API_URL = "https://gmail.googleapis.com/gmail/v1";

/**
 * Check if Gmail OAuth is configured.
 */
export function isGmailConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.labels",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
].join(" ");

interface GmailTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body?: { data?: string };
    parts?: Array<{
      mimeType: string;
      body?: { data?: string };
    }>;
  };
  internalDate: string;
}

/**
 * Generate the Gmail OAuth authorization URL.
 */
export function getGmailAuthUrl(origin: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error(
      "GOOGLE_CLIENT_ID is not configured. The app is running in demo mode. " +
      "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable real Gmail integration."
    );
  }

  const redirectUri = `${origin}/api/gmail/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    state: Buffer.from(JSON.stringify({ origin })).toString("base64"),
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens.
 */
export async function exchangeGmailCode(code: string, origin: string): Promise<GmailTokens> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials not configured");
  }

  const redirectUri = `${origin}/api/gmail/callback`;
  const response = await axios.post<GmailTokens>(GOOGLE_TOKEN_URL, {
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  return response.data;
}

/**
 * Refresh an expired access token.
 */
export async function refreshGmailToken(refreshToken: string): Promise<GmailTokens> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials not configured");
  }

  const response = await axios.post<GmailTokens>(GOOGLE_TOKEN_URL, {
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
  });

  return response.data;
}

/**
 * Get user's Gmail profile.
 */
export async function getGmailProfile(accessToken: string) {
  const response = await axios.get(`${GMAIL_API_URL}/users/me/profile`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data as { emailAddress: string; messagesTotal: number; threadsTotal: number };
}

/**
 * List messages from Gmail inbox.
 */
export async function listMessages(
  accessToken: string,
  options: { maxResults?: number; q?: string; pageToken?: string; labelIds?: string[] } = {}
) {
  const params: Record<string, string> = {
    maxResults: String(options.maxResults || 20),
  };
  if (options.q) params.q = options.q;
  if (options.pageToken) params.pageToken = options.pageToken;
  if (options.labelIds) params.labelIds = options.labelIds.join(",");

  const response = await axios.get(`${GMAIL_API_URL}/users/me/messages`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    params,
  });

  return response.data as {
    messages: Array<{ id: string; threadId: string }>;
    nextPageToken?: string;
    resultSizeEstimate: number;
  };
}

/**
 * Get a single message by ID.
 */
export async function getMessage(accessToken: string, messageId: string): Promise<GmailMessage> {
  const response = await axios.get(`${GMAIL_API_URL}/users/me/messages/${messageId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: { format: "full" },
  });
  return response.data;
}

/**
 * Modify message labels (archive, star, etc.).
 */
export async function modifyMessage(
  accessToken: string,
  messageId: string,
  addLabels: string[] = [],
  removeLabels: string[] = []
) {
  const response = await axios.post(
    `${GMAIL_API_URL}/users/me/messages/${messageId}/modify`,
    { addLabelIds: addLabels, removeLabelIds: removeLabels },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return response.data;
}

/**
 * Trash a message.
 */
export async function trashMessage(accessToken: string, messageId: string) {
  const response = await axios.post(
    `${GMAIL_API_URL}/users/me/messages/${messageId}/trash`,
    {},
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return response.data;
}

/**
 * Send an email.
 */
export async function sendMessage(accessToken: string, rawMessage: string) {
  const response = await axios.post(
    `${GMAIL_API_URL}/users/me/messages/send`,
    { raw: rawMessage },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return response.data;
}

/**
 * Parse email headers into a friendly format.
 */
export function parseEmailHeaders(headers: Array<{ name: string; value: string }>) {
  const get = (name: string) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || "";
  return {
    from: get("From"),
    to: get("To"),
    subject: get("Subject"),
    date: get("Date"),
    messageId: get("Message-ID"),
    inReplyTo: get("In-Reply-To"),
  };
}

/**
 * Decode base64url encoded email body.
 */
export function decodeBody(data: string): string {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
}

/**
 * Extract plain text body from a Gmail message.
 */
export function extractTextBody(message: GmailMessage): string {
  if (message.payload.body?.data) {
    return decodeBody(message.payload.body.data);
  }
  if (message.payload.parts) {
    const textPart = message.payload.parts.find(p => p.mimeType === "text/plain");
    if (textPart?.body?.data) {
      return decodeBody(textPart.body.data);
    }
    const htmlPart = message.payload.parts.find(p => p.mimeType === "text/html");
    if (htmlPart?.body?.data) {
      return decodeBody(htmlPart.body.data).replace(/<[^>]*>/g, "");
    }
  }
  return message.snippet || "";
}

// ─── Label Management ───────────────────────────────────────────────────────

export interface GmailLabel {
  id: string;
  name: string;
  type: "system" | "user";
  messagesTotal?: number;
  messagesUnread?: number;
  threadsTotal?: number;
  threadsUnread?: number;
}

/**
 * List all Gmail labels for the authenticated user.
 */
export async function listLabels(accessToken: string): Promise<GmailLabel[]> {
  const response = await axios.get(`${GMAIL_API_URL}/users/me/labels`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return (response.data as { labels: GmailLabel[] }).labels || [];
}

/**
 * Get a single label by ID.
 */
export async function getLabel(accessToken: string, labelId: string): Promise<GmailLabel> {
  const response = await axios.get(`${GMAIL_API_URL}/users/me/labels/${labelId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data as GmailLabel;
}

/**
 * Create a new Gmail label.
 */
export async function createLabel(
  accessToken: string,
  name: string,
  options: { textColor?: string; backgroundColor?: string } = {}
): Promise<GmailLabel> {
  const body: Record<string, unknown> = { name };
  if (options.textColor || options.backgroundColor) {
    body.color = {
      textColor: options.textColor || "#ffffff",
      backgroundColor: options.backgroundColor || "#434343",
    };
  }
  const response = await axios.post(`${GMAIL_API_URL}/users/me/labels`, body, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.data as GmailLabel;
}

/**
 * Find a label by name, creating it if it does not exist.
 * Supports nested labels using "/" separator (e.g. "Revvel/Work").
 */
export async function getOrCreateLabel(
  accessToken: string,
  name: string,
  colorOptions?: { textColor?: string; backgroundColor?: string }
): Promise<GmailLabel> {
  const labels = await listLabels(accessToken);
  const existing = labels.find(l => l.name.toLowerCase() === name.toLowerCase());
  if (existing) return existing;
  return createLabel(accessToken, name, colorOptions);
}

/**
 * Batch-modify up to 1 000 messages in a single API call.
 * Adds and/or removes label IDs from all matching message IDs.
 */
export async function batchModifyMessages(
  accessToken: string,
  messageIds: string[],
  addLabelIds: string[] = [],
  removeLabelIds: string[] = []
): Promise<void> {
  if (messageIds.length === 0) return;
  // Gmail API allows a maximum of 1 000 ids per batchModify request
  const CHUNK = 1000;
  for (let i = 0; i < messageIds.length; i += CHUNK) {
    const chunk = messageIds.slice(i, i + CHUNK);
    await axios.post(
      `${GMAIL_API_URL}/users/me/messages/batchModify`,
      { ids: chunk, addLabelIds, removeLabelIds },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
  }
}

/**
 * Batch-delete (permanently) up to 1 000 messages in a single API call.
 */
export async function batchDeleteMessages(
  accessToken: string,
  messageIds: string[]
): Promise<void> {
  if (messageIds.length === 0) return;
  const CHUNK = 1000;
  for (let i = 0; i < messageIds.length; i += CHUNK) {
    const chunk = messageIds.slice(i, i + CHUNK);
    await axios.post(
      `${GMAIL_API_URL}/users/me/messages/batchDelete`,
      { ids: chunk },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
  }
}

/**
 * List messages with full metadata in one go, using pagination.
 * Yields pages of message IDs rather than fetching all at once,
 * so callers can process large mailboxes incrementally.
 */
export async function* streamMessages(
  accessToken: string,
  options: { q?: string; labelIds?: string[]; maxResults?: number } = {}
): AsyncGenerator<Array<{ id: string; threadId: string }>> {
  let pageToken: string | undefined;
  let fetched = 0;
  const limit = options.maxResults;
  const pageSize = limit !== undefined ? Math.min(500, limit) : 500;

  do {
    const data = await listMessages(accessToken, {
      maxResults: pageSize,
      q: options.q,
      pageToken,
      labelIds: options.labelIds,
    });
    const page = data.messages || [];
    if (page.length === 0) break;
    yield page;
    fetched += page.length;
    pageToken = data.nextPageToken;
    // Stop if we've reached the caller's requested limit
    if (limit !== undefined && fetched >= limit) break;
  } while (pageToken);
}
