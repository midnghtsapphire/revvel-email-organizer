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
