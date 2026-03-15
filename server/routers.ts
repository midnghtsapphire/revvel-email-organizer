import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { callOpenRouter, summarizeEmail, extractCommitments, draftReply, categorizeEmail } from "./services/openrouter";
import {
  getGmailAuthUrl, isGmailConfigured, refreshGmailToken, getGmailProfile,
  listMessages, getMessage, parseEmailHeaders, extractTextBody,
  listLabels, getOrCreateLabel, batchModifyMessages, batchDeleteMessages,
} from "./services/gmail";
import { organizeMailbox, heuristicCategorize, labelName, EMAIL_CATEGORIES, extractUnsubscribeLink } from "./services/emailOrganizer";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Gmail Integration ──────────────────────────────────────────
  gmail: router({
    isConfigured: publicProcedure.query(() => {
      return { configured: isGmailConfigured() };
    }),

    getAuthUrl: protectedProcedure
      .input(z.object({ origin: z.string() }))
      .mutation(({ input }) => {
        if (!isGmailConfigured()) {
          return { url: null, error: "Gmail is running in demo mode. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable real Gmail integration.", demoMode: true };
        }
        try {
          const url = getGmailAuthUrl(input.origin);
          return { url, demoMode: false };
        } catch (error: any) {
          return { url: null, error: error.message, demoMode: false };
        }
      }),

    listAccounts: protectedProcedure.query(async ({ ctx }) => {
      return db.getGmailAccounts(ctx.user.id);
    }),

    removeAccount: protectedProcedure
      .input(z.object({ accountId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteGmailAccount(input.accountId, ctx.user.id);
        return { success: true };
      }),

    getLabels: protectedProcedure
      .input(z.object({ accountId: z.number() }))
      .query(async ({ ctx, input }) => {
        const token = await getValidAccessToken(ctx.user.id, input.accountId);
        if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "Gmail account not found or token expired" });
        return listLabels(token);
      }),
  }),

  // ─── Email Sync & Organizing ────────────────────────────────────
  emails: router({
    /**
     * List cached emails from the local database (fast, no Gmail API call).
     */
    list: protectedProcedure
      .input(z.object({
        gmailAccountId: z.number().optional(),
        category: z.string().optional(),
        isRead: z.boolean().optional(),
        isStarred: z.boolean().optional(),
        isArchived: z.boolean().default(false),
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ ctx, input }) => {
        return db.getSyncedEmails(ctx.user.id, input);
      }),

    /**
     * Fetch a page of real emails from Gmail and cache them in the local DB.
     * Safe to call repeatedly; uses incremental sync (only new emails since last sync).
     */
    sync: protectedProcedure
      .input(z.object({
        accountId: z.number(),
        maxResults: z.number().min(1).max(500).default(100),
        q: z.string().optional(),
        forceFullSync: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const token = await getValidAccessToken(ctx.user.id, input.accountId);
        if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "Gmail account not found or token expired" });

        // Build incremental query: only emails since last sync unless forced
        let query = input.q;
        if (!input.forceFullSync && !query) {
          const lastSync = await db.getLastSyncTime(ctx.user.id, input.accountId);
          if (lastSync) {
            // Gmail date format: after:YYYY/MM/DD
            const d = lastSync;
            query = `after:${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
          }
        }

        const result = await listMessages(token, { maxResults: input.maxResults, q: query });
        const messages = result.messages ?? [];

        let synced = 0;
        const BATCH = 25;
        for (let i = 0; i < messages.length; i += BATCH) {
          const chunk = messages.slice(i, i + BATCH);
          await Promise.allSettled(chunk.map(async ({ id }) => {
            const msg = await getMessage(token, id);
            const headers = parseEmailHeaders(msg.payload.headers);
            const listUnsubHeader = msg.payload.headers
              .find(h => h.name.toLowerCase() === "list-unsubscribe")?.value ?? undefined;

            const { category, priority } = heuristicCategorize({
              from: headers.from,
              subject: headers.subject,
              snippet: msg.snippet,
              labelIds: msg.labelIds,
              listUnsubscribe: listUnsubHeader,
            });

            const unsubUrl = listUnsubHeader ? (extractUnsubscribeLink(listUnsubHeader) ?? undefined) : undefined;

            await db.upsertSyncedEmail({
              userId: ctx.user.id,
              gmailAccountId: input.accountId,
              messageId: msg.id,
              threadId: msg.threadId,
              from: headers.from,
              fromName: parseDisplayName(headers.from),
              fromEmail: (headers.from.match(/<([^>]+)>/) ?? [])[1] ?? headers.from,
              to: headers.to,
              subject: headers.subject,
              snippet: msg.snippet,
              labelIds: msg.labelIds,
              category,
              priority,
              isRead: !msg.labelIds.includes("UNREAD"),
              isStarred: msg.labelIds.includes("STARRED"),
              isArchived: !msg.labelIds.includes("INBOX"),
              isTrashed: msg.labelIds.includes("TRASH"),
              hasUnsubscribe: !!listUnsubHeader,
              unsubscribeUrl: unsubUrl,
              internalDate: msg.internalDate,
              receivedAt: msg.internalDate ? new Date(parseInt(msg.internalDate)) : undefined,
            });
            synced++;
          }));
        }

        return { synced, total: messages.length, nextPageToken: result.nextPageToken };
      }),

    /**
     * Start a background organize job.
     * Fetches ALL emails matching the query (paginated), categorizes them,
     * and applies Revvel/* Gmail labels.
     *
     * For mailboxes with hundreds of thousands of emails this runs async;
     * poll emails.jobStatus to track progress.
     */
    organizeAll: protectedProcedure
      .input(z.object({
        accountId: z.number(),
        q: z.string().optional(),
        labelIds: z.array(z.string()).default(["INBOX"]),
        limit: z.number().min(1).max(300000).optional(),
        useAiFallback: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const token = await getValidAccessToken(ctx.user.id, input.accountId);
        if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "Gmail account not found or token expired" });

        // Create a job record
        const jobResult = await db.createOrganizeJob({
          userId: ctx.user.id,
          gmailAccountId: input.accountId,
          status: "running",
          jobType: "organize",
          startedAt: new Date(),
        });

        // Run asynchronously (fire-and-forget) — the client polls jobStatus
        const insertResult = jobResult as { insertId?: number } | undefined;
        const jobId = insertResult?.insertId ?? 0;
        organizeMailbox({
          accessToken: token,
          q: input.q,
          labelIds: input.labelIds,
          limit: input.limit,
          useAiFallback: input.useAiFallback,
          onProgress: (progress) => {
            db.updateOrganizeJob(jobId, {
              processed: progress.processed,
              total: progress.total,
              errorCount: progress.errors,
              categoryCounts: progress.categoryCounts,
            }).catch(console.error);
          },
        })
          .then(async (finalProgress) => {
            await db.updateOrganizeJob(jobId, {
              status: "completed",
              processed: finalProgress.processed,
              total: finalProgress.total,
              errorCount: finalProgress.errors,
              categoryCounts: finalProgress.categoryCounts,
              completedAt: new Date(),
            });
          })
          .catch(async (err: Error) => {
            await db.updateOrganizeJob(jobId, {
              status: "failed",
              errorMessage: err.message,
              completedAt: new Date(),
            });
          });

        return { jobId };
      }),

    /** Poll the status of an organize job. */
    jobStatus: protectedProcedure
      .input(z.object({ jobId: z.number() }))
      .query(async ({ ctx, input }) => {
        const job = await db.getOrganizeJob(input.jobId);
        if (!job || job.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return job;
      }),

    /** List recent organize jobs for the current user. */
    listJobs: protectedProcedure.query(async ({ ctx }) => {
      return db.listOrganizeJobs(ctx.user.id);
    }),

    /**
     * Bulk action: archive / trash / label / mark-read a set of messages.
     * Applies changes in Gmail and updates the local cache.
     */
    bulkAction: protectedProcedure
      .input(z.object({
        accountId: z.number(),
        messageIds: z.array(z.string()).min(1).max(1000),
        action: z.enum(["archive", "trash", "star", "unstar", "markRead", "markUnread", "label"]),
        labelName: z.string().optional(), // required when action === "label"
      }))
      .mutation(async ({ ctx, input }) => {
        const token = await getValidAccessToken(ctx.user.id, input.accountId);
        if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "Gmail account not found or token expired" });

        switch (input.action) {
          case "archive":
            await batchModifyMessages(token, input.messageIds, [], ["INBOX"]);
            await db.markEmailsArchived(ctx.user.id, input.messageIds);
            break;
          case "trash":
            await batchModifyMessages(token, input.messageIds, ["TRASH"], ["INBOX"]);
            await db.markEmailsTrashed(ctx.user.id, input.messageIds);
            break;
          case "star":
            await batchModifyMessages(token, input.messageIds, ["STARRED"], []);
            break;
          case "unstar":
            await batchModifyMessages(token, input.messageIds, [], ["STARRED"]);
            break;
          case "markRead":
            await batchModifyMessages(token, input.messageIds, [], ["UNREAD"]);
            await db.markEmailsRead(ctx.user.id, input.messageIds, true);
            break;
          case "markUnread":
            await batchModifyMessages(token, input.messageIds, ["UNREAD"], []);
            await db.markEmailsRead(ctx.user.id, input.messageIds, false);
            break;
          case "label": {
            if (!input.labelName) throw new TRPCError({ code: "BAD_REQUEST", message: "labelName is required for label action" });
            const label = await getOrCreateLabel(token, input.labelName);
            await batchModifyMessages(token, input.messageIds, [label.id], []);
            break;
          }
        }

        return { success: true, affected: input.messageIds.length };
      }),

    /** Get category counts for the current user's synced inbox. */
    categoryCounts: protectedProcedure.query(async ({ ctx }) => {
      const counts: Record<string, number> = {};
      for (const cat of EMAIL_CATEGORIES) {
        counts[cat] = await db.countSyncedEmails(ctx.user.id, { category: cat });
      }
      const unread = await db.countSyncedEmails(ctx.user.id, { isRead: false });
      return { categories: counts, unread };
    }),
  }),

  // ─── Subscription / Billing ─────────────────────────────────────
  subscription: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const sub = await db.getSubscription(ctx.user.id);
      return sub || { plan: "free" as const, status: "active" as const };
    }),
  }),

  // ─── User Settings ──────────────────────────────────────────────
  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserSettings(ctx.user.id);
    }),

    update: protectedProcedure
      .input(z.object({
        ecoCode: z.boolean().optional(),
        neuroCode: z.boolean().optional(),
        dyslexicMode: z.boolean().optional(),
        decisionThreshold: z.number().min(5).max(100).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertUserSettings({
          userId: ctx.user.id,
          ecoCode: input.ecoCode,
          neuroCode: input.neuroCode,
          dyslexicMode: input.dyslexicMode,
          decisionThreshold: input.decisionThreshold,
        });
        return { success: true };
      }),
  }),

  // ─── Commitments (Commitment Tracker) ───────────────────────────
  commitments: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getCommitments(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        text: z.string().min(1),
        dueDate: z.string().optional(),
        source: z.string().optional(),
        emailId: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createCommitment({
          userId: ctx.user.id,
          text: input.text,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
          source: input.source,
          emailId: input.emailId,
        });
        return { success: true };
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "completed", "overdue"]),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateCommitmentStatus(input.id, ctx.user.id, input.status);
        return { success: true };
      }),
  }),

  // ─── Contacts (Relational Sonar) ────────────────────────────────
  contacts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getContacts(ctx.user.id);
    }),
  }),

  // ─── AI Features ────────────────────────────────────────────────
  ai: router({
    summarize: protectedProcedure
      .input(z.object({ emailContent: z.string().min(1) }))
      .mutation(async ({ input }) => {
        const summary = await summarizeEmail(input.emailContent);
        return { summary };
      }),

    extractCommitments: protectedProcedure
      .input(z.object({ emailContent: z.string().min(1) }))
      .mutation(async ({ input }) => {
        const commitmentsList = await extractCommitments(input.emailContent);
        return { commitments: commitmentsList };
      }),

    draftReply: protectedProcedure
      .input(z.object({
        emailContent: z.string().min(1),
        tone: z.enum(["professional", "casual", "brief"]).default("professional"),
      }))
      .mutation(async ({ input }) => {
        const draft = await draftReply(input.emailContent, input.tone);
        return { draft };
      }),

    categorize: protectedProcedure
      .input(z.object({
        subject: z.string(),
        snippet: z.string(),
        from: z.string(),
      }))
      .mutation(async ({ input }) => {
        const result = await categorizeEmail(input.subject, input.snippet, input.from);
        return result;
      }),

    attributions: protectedProcedure.query(async () => {
      return db.getAiAttributions(100);
    }),
  }),

  // ─── Compass Dashboard Data ─────────────────────────────────────
  compass: router({
    overview: protectedProcedure.query(async ({ ctx }) => {
      const [commitmentsList, contactsList, settings, emailCount, unreadCount] = await Promise.all([
        db.getCommitments(ctx.user.id),
        db.getContacts(ctx.user.id),
        db.getUserSettings(ctx.user.id),
        db.countSyncedEmails(ctx.user.id),
        db.countSyncedEmails(ctx.user.id, { isRead: false }),
      ]);

      const pendingCommitments = commitmentsList.filter(c => c.status === "pending").length;
      const overdueCommitments = commitmentsList.filter(c => c.status === "overdue").length;

      // Derive inbox weather from real email counts
      let weatherState: "sunny" | "cloudy" | "stormy" | "hurricane" = "sunny";
      if (unreadCount > 500) weatherState = "hurricane";
      else if (unreadCount > 100) weatherState = "stormy";
      else if (unreadCount > 20) weatherState = "cloudy";

      return {
        inboxWeather: {
          emailCount,
          urgentCount: unreadCount,
          state: weatherState,
        },
        commitments: {
          total: commitmentsList.length,
          pending: pendingCommitments,
          overdue: overdueCommitments,
          recent: commitmentsList.slice(0, 5),
        },
        contacts: {
          total: contactsList.length,
          needsAttention: contactsList.filter(c => {
            if (!c.lastContacted) return true;
            const daysSince = Math.floor((Date.now() - new Date(c.lastContacted).getTime()) / (1000 * 60 * 60 * 24));
            return daysSince > 14;
          }).length,
          recent: contactsList.slice(0, 5),
        },
        settings: settings || {
          ecoCode: false,
          neuroCode: false,
          dyslexicMode: false,
          totalActions: 0,
        },
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;

// ─── Helper: get a valid (refreshed if needed) access token ─────────────────

async function getValidAccessToken(userId: number, accountId: number): Promise<string | null> {
  const accounts = await db.getGmailAccounts(userId);
  const account = accounts.find(a => a.id === accountId);
  if (!account) return null;

  // Check if token is still valid (with 5-minute buffer)
  const now = Date.now();
  const expiry = account.tokenExpiry ? new Date(account.tokenExpiry).getTime() : 0;
  if (account.accessToken && expiry > now + 5 * 60 * 1000) {
    return account.accessToken;
  }

  // Attempt refresh
  if (!account.refreshToken) return account.accessToken;
  try {
    const tokens = await refreshGmailToken(account.refreshToken);
    await db.upsertGmailAccount({
      ...account,
      accessToken: tokens.access_token,
      tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
    });
    return tokens.access_token;
  } catch {
    return account.accessToken;
  }
}

/**
 * Extract the display name from an RFC 5322 "From" header value.
 * Strips the email address portion (anything inside `< >`) and any
 * surrounding quotes. Does NOT rely on regex backtracking over angle
 * brackets so there is no risk of incomplete sanitization.
 */
function parseDisplayName(fromHeader: string): string {
  // If the header contains a bare email with no display name, return empty string.
  if (!fromHeader.includes("<")) {
    return "";
  }
  // Everything before the first "<" is the display name portion.
  const displayPart = fromHeader.slice(0, fromHeader.indexOf("<")).trim();
  // Remove surrounding double-quotes if present.
  return displayPart.replace(/^"(.*)"$/, "$1").trim();
}
