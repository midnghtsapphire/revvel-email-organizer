import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { callOpenRouter, summarizeEmail, extractCommitments, draftReply, categorizeEmail } from "./services/openrouter";
import { getGmailAuthUrl, isGmailConfigured } from "./services/gmail";

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
      const [commitmentsList, contactsList, settings] = await Promise.all([
        db.getCommitments(ctx.user.id),
        db.getContacts(ctx.user.id),
        db.getUserSettings(ctx.user.id),
      ]);

      const pendingCommitments = commitmentsList.filter(c => c.status === "pending").length;
      const overdueCommitments = commitmentsList.filter(c => c.status === "overdue").length;

      return {
        inboxWeather: {
          emailCount: 0,
          urgentCount: 0,
          state: "calm" as const,
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
