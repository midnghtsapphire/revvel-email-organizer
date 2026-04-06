/**
 * Revvel Email Organizer — core organizing engine.
 *
 * Supports both heuristic (fast, no AI cost) and AI-assisted categorization.
 * Designed to handle large mailboxes (300 000+ emails) by processing in batches
 * and applying changes directly in Gmail via label operations.
 *
 * Fyxer-style label names: short, human-readable, nested under "Revvel/".
 */

import { getMessage, getOrCreateLabel, batchModifyMessages, parseEmailHeaders, streamMessages } from "./gmail";
import { categorizeEmail } from "./openrouter";

// ─── Category definitions ────────────────────────────────────────────────────

export const EMAIL_CATEGORIES = [
  "Work",
  "Personal",
  "Newsletters",
  "Notifications",
  "Receipts",
  "Social",
  "Promotions",
  "Finance",
  "Travel",
  "Health",
] as const;

export type EmailCategory = (typeof EMAIL_CATEGORIES)[number];

/** Fyxer-style Gmail label names: nested under "Revvel/" prefix. */
export function labelName(category: EmailCategory): string {
  return `Revvel/${category}`;
}

/** Category color palette — earthy tones matching Revvel design system. */
const CATEGORY_COLORS: Record<EmailCategory, { textColor: string; backgroundColor: string }> = {
  Work:          { textColor: "#ffffff", backgroundColor: "#4a3728" },
  Personal:      { textColor: "#ffffff", backgroundColor: "#2d4a2e" },
  Newsletters:   { textColor: "#ffffff", backgroundColor: "#5c4a1e" },
  Notifications: { textColor: "#ffffff", backgroundColor: "#3a3a3a" },
  Receipts:      { textColor: "#ffffff", backgroundColor: "#2e3d4a" },
  Social:        { textColor: "#ffffff", backgroundColor: "#4a2e3d" },
  Promotions:    { textColor: "#ffffff", backgroundColor: "#4a3728" },
  Finance:       { textColor: "#ffffff", backgroundColor: "#1e3d2d" },
  Travel:        { textColor: "#ffffff", backgroundColor: "#2d3a4a" },
  Health:        { textColor: "#ffffff", backgroundColor: "#3d4a2e" },
};

// ─── Heuristic categorization ────────────────────────────────────────────────

/** Known newsletter / bulk-mail sender domains. */
const NEWSLETTER_DOMAINS = new Set([
  "substack.com", "mailchimp.com", "constantcontact.com", "sendgrid.net",
  "campaignmonitor.com", "klaviyo.com", "convertkit.com", "beehiiv.com",
  "ghost.org", "buttondown.email", "revue.co", "tinyletter.com",
]);

/** Known notification senders. */
const NOTIFICATION_SENDERS = new Set([
  "github.com", "gitlab.com", "jira.atlassian.com", "asana.com",
  "trello.com", "notion.so", "slack.com", "discord.com",
  "zoom.us", "calendly.com", "dropbox.com", "google.com",
  "apple.com", "microsoft.com", "amazonaws.com",
]);

/** Known receipt / transactional senders. */
const RECEIPT_KEYWORDS = ["receipt", "order confirmation", "invoice", "your order", "payment confirmation", "transaction"];

/** Known social platform senders. */
const SOCIAL_DOMAINS = new Set([
  "facebook.com", "facebookmail.com", "twitter.com", "x.com",
  "instagram.com", "linkedin.com", "pinterest.com", "tiktok.com",
  "reddit.com", "snapchat.com", "youtube.com",
]);

/** Finance-related sender keywords. */
const FINANCE_KEYWORDS = ["bank", "paypal", "venmo", "cashapp", "robinhood", "coinbase", "stripe", "statement", "balance"];

/** Travel-related subject keywords. */
const TRAVEL_KEYWORDS = ["flight", "booking", "hotel", "airbnb", "reservation", "itinerary", "boarding pass", "check-in"];

/** Health-related keywords. */
const HEALTH_KEYWORDS = ["appointment", "prescription", "insurance", "health", "medical", "clinic", "pharmacy", "lab result"];

function extractDomain(email: string): string {
  const match = email.match(/@([\w.-]+)/);
  return match ? match[1].toLowerCase() : "";
}

function containsAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

export interface HeuristicEmailInput {
  from: string;
  subject: string;
  snippet: string;
  labelIds?: string[];
  /** Raw List-Unsubscribe header value if present */
  listUnsubscribe?: string;
}

/**
 * Fast, rule-based email categorization — zero AI calls.
 * Returns a category and a confidence score (0–1).
 */
export function heuristicCategorize(email: HeuristicEmailInput): {
  category: EmailCategory;
  confidence: number;
  priority: "high" | "medium" | "low";
} {
  const domain = extractDomain(email.from);
  const subjectLower = email.subject.toLowerCase();
  const snippetLower = email.snippet.toLowerCase();
  const combined = `${subjectLower} ${snippetLower}`;
  const hasUnsubscribe = !!email.listUnsubscribe || combined.includes("unsubscribe");

  // Social
  if (SOCIAL_DOMAINS.has(domain) || email.labelIds?.includes("CATEGORY_SOCIAL")) {
    return { category: "Social", confidence: 0.95, priority: "low" };
  }

  // Newsletters (explicit List-Unsubscribe header or known newsletter domains)
  if (email.listUnsubscribe || NEWSLETTER_DOMAINS.has(domain) || email.labelIds?.includes("CATEGORY_UPDATES")) {
    return { category: "Newsletters", confidence: 0.9, priority: "low" };
  }

  // Promotions (Gmail promotions tab or generic unsubscribe)
  if (email.labelIds?.includes("CATEGORY_PROMOTIONS") || (hasUnsubscribe && !email.listUnsubscribe)) {
    return { category: "Promotions", confidence: 0.85, priority: "low" };
  }

  // Receipts
  if (containsAny(subjectLower, RECEIPT_KEYWORDS) || email.labelIds?.includes("CATEGORY_PURCHASES")) {
    return { category: "Receipts", confidence: 0.9, priority: "low" };
  }

  // Finance
  if (containsAny(combined, FINANCE_KEYWORDS)) {
    return { category: "Finance", confidence: 0.8, priority: "medium" };
  }

  // Travel
  if (containsAny(subjectLower, TRAVEL_KEYWORDS)) {
    return { category: "Travel", confidence: 0.85, priority: "medium" };
  }

  // Health
  if (containsAny(combined, HEALTH_KEYWORDS)) {
    return { category: "Health", confidence: 0.8, priority: "medium" };
  }

  // Notifications
  if (NOTIFICATION_SENDERS.has(domain) || email.labelIds?.includes("CATEGORY_FORUMS")) {
    return { category: "Notifications", confidence: 0.88, priority: "low" };
  }

  // Default: Work vs Personal based on label
  if (email.labelIds?.includes("INBOX")) {
    return { category: "Work", confidence: 0.5, priority: "medium" };
  }

  return { category: "Personal", confidence: 0.4, priority: "low" };
}

// ─── Label cache ─────────────────────────────────────────────────────────────

/** Cached label ID map per access token (in-memory for the process lifetime). */
const labelCache = new Map<string, Map<EmailCategory, string>>();

async function getLabelId(accessToken: string, category: EmailCategory): Promise<string> {
  let tokenCache = labelCache.get(accessToken);
  if (!tokenCache) {
    tokenCache = new Map();
    labelCache.set(accessToken, tokenCache);
  }
  const cached = tokenCache.get(category);
  if (cached) return cached;

  const label = await getOrCreateLabel(accessToken, labelName(category), CATEGORY_COLORS[category]);
  tokenCache.set(category, label.id);
  return label.id;
}

// ─── Batch organize ──────────────────────────────────────────────────────────

export interface OrganizeProgress {
  processed: number;
  total: number;
  currentBatch: number;
  categoryCounts: Record<string, number>;
  errors: number;
}

export type ProgressCallback = (progress: OrganizeProgress) => void;

export interface OrganizeBatchOptions {
  /** Gmail access token for the account to organize. */
  accessToken: string;
  /** Restrict to these Gmail label IDs (default: INBOX). */
  labelIds?: string[];
  /** Gmail search query to narrow which emails to organize. */
  q?: string;
  /** Maximum number of emails to organize per run (default: unlimited). */
  limit?: number;
  /**
   * When true, low-confidence heuristic results are re-classified by AI.
   * More accurate but slower and costs API tokens.
   */
  useAiFallback?: boolean;
  /** Confidence threshold below which AI re-classification is triggered (0–1, default 0.65). */
  aiConfidenceThreshold?: number;
  /** Called after each batch is applied to Gmail. */
  onProgress?: ProgressCallback;
}

/**
 * Organize a Gmail mailbox in streaming batches.
 *
 * For each page of messages (≤ 500):
 *   1. Fetch snippet + headers (parallel, up to 50 at a time).
 *   2. Heuristic-categorize every message.
 *   3. If useAiFallback, AI-classify the low-confidence ones.
 *   4. Group by category and apply Gmail labels via batchModify.
 *
 * Returns the final progress object.
 */
export async function organizeMailbox(opts: OrganizeBatchOptions): Promise<OrganizeProgress> {
  const {
    accessToken,
    labelIds = ["INBOX"],
    q,
    limit,
    useAiFallback = false,
    aiConfidenceThreshold = 0.65,
    onProgress,
  } = opts;

  const progress: OrganizeProgress = {
    processed: 0,
    total: 0,
    currentBatch: 0,
    categoryCounts: {},
    errors: 0,
  };

  for await (const page of streamMessages(accessToken, { q, labelIds, maxResults: limit })) {
    progress.currentBatch++;
    const categoryGroups = new Map<EmailCategory, string[]>();

    // Fetch message details in parallel (50 at a time)
    const FETCH_CONCURRENCY = 50;
    const messages: Array<{ id: string; category: EmailCategory } | null> = [];

    for (let i = 0; i < page.length; i += FETCH_CONCURRENCY) {
      const chunk = page.slice(i, i + FETCH_CONCURRENCY);
      const results = await Promise.allSettled(
        chunk.map(async ({ id }) => {
          const msg = await getMessage(accessToken, id);
          const headers = parseEmailHeaders(msg.payload.headers);
          const listUnsubscribeHeader = msg.payload.headers
            .find(h => h.name.toLowerCase() === "list-unsubscribe")?.value;

          let { category, confidence } = heuristicCategorize({
            from: headers.from,
            subject: headers.subject,
            snippet: msg.snippet,
            labelIds: msg.labelIds,
            listUnsubscribe: listUnsubscribeHeader,
          });

          if (useAiFallback && confidence < aiConfidenceThreshold) {
            try {
              const aiResult = await categorizeEmail(headers.subject, msg.snippet, headers.from);
              category = aiResult.category as EmailCategory;
            } catch {
              // Keep heuristic result on AI failure
            }
          }

          return { id, category };
        })
      );

      for (const result of results) {
        if (result.status === "fulfilled") {
          messages.push(result.value);
        } else {
          progress.errors++;
          messages.push(null);
        }
      }
    }

    // Group message IDs by category
    for (const item of messages) {
      if (!item) continue;
      const group = categoryGroups.get(item.category) ?? [];
      group.push(item.id);
      categoryGroups.set(item.category, group);
      progress.categoryCounts[item.category] = (progress.categoryCounts[item.category] ?? 0) + 1;
    }

    // Apply Gmail labels for this batch
    for (const [category, ids] of Array.from(categoryGroups.entries())) {
      try {
        const labelId = await getLabelId(accessToken, category);
        await batchModifyMessages(accessToken, ids, [labelId], []);
      } catch (err) {
        console.error(`[EmailOrganizer] Failed to apply label for ${category}:`, err);
        progress.errors += ids.length;
      }
    }

    progress.processed += page.length;
    progress.total = Math.max(progress.total, progress.processed);
    onProgress?.(progress);
  }

  return progress;
}

// ─── Single-email classify ────────────────────────────────────────────────────

export interface ClassifyResult {
  category: EmailCategory;
  confidence: number;
  priority: "high" | "medium" | "low";
  sentiment?: "positive" | "neutral" | "negative";
}

/**
 * Classify a single email, with optional AI fallback.
 * Used for per-email classification in the Inbox view.
 */
export async function classifyEmail(
  accessToken: string,
  messageId: string,
  useAi = false
): Promise<ClassifyResult> {
  const msg = await getMessage(accessToken, messageId);
  const headers = parseEmailHeaders(msg.payload.headers);
  const listUnsubscribe = msg.payload.headers
    .find(h => h.name.toLowerCase() === "list-unsubscribe")?.value;

  const heuristic = heuristicCategorize({
    from: headers.from,
    subject: headers.subject,
    snippet: msg.snippet,
    labelIds: msg.labelIds,
    listUnsubscribe,
  });

  if (!useAi || heuristic.confidence >= 0.75) {
    return { ...heuristic, sentiment: "neutral" };
  }

  try {
    const ai = await categorizeEmail(headers.subject, msg.snippet, headers.from);
    return {
      category: ai.category as EmailCategory,
      confidence: 0.9,
      priority: ai.priority,
      sentiment: ai.sentiment,
    };
  } catch {
    return { ...heuristic, sentiment: "neutral" };
  }
}

// ─── Unsubscribe helpers ──────────────────────────────────────────────────────

/**
 * Returns the unsubscribe URL or mailto from a List-Unsubscribe header,
 * or null if not present.
 */
export function extractUnsubscribeLink(listUnsubscribeHeader: string): string | null {
  // Format: <https://...>, <mailto:...>
  const httpMatch = listUnsubscribeHeader.match(/<(https?:\/\/[^>]+)>/);
  if (httpMatch) return httpMatch[1];
  const mailtoMatch = listUnsubscribeHeader.match(/<(mailto:[^>]+)>/);
  if (mailtoMatch) return mailtoMatch[1];
  return null;
}
