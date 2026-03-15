import { eq, desc, and, lte, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  gmailAccounts, InsertGmailAccount,
  subscriptions, InsertSubscription,
  userSettings, InsertUserSettings,
  commitments, InsertCommitment,
  contacts, InsertContact,
  aiAttribution, InsertAiAttribution,
  emailCategories,
  passwordHashes,
  syncedEmails, InsertSyncedEmail,
  organizeJobs, InsertOrganizeJob,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Email Lookup (for standalone auth) ─────────────────────────

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Password Hash Storage ──────────────────────────────────────

export async function setPasswordHash(openId: string, hash: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(passwordHashes).values({ openId, hash }).onDuplicateKeyUpdate({
    set: { hash },
  });
}

export async function getPasswordHash(openId: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(passwordHashes).where(eq(passwordHashes.openId, openId)).limit(1);
  return result.length > 0 ? result[0].hash : null;
}

// ─── Gmail Accounts ─────────────────────────────────────────────

export async function getGmailAccounts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(gmailAccounts).where(eq(gmailAccounts.userId, userId));
}

export async function upsertGmailAccount(account: InsertGmailAccount) {
  const db = await getDb();
  if (!db) return;
  await db.insert(gmailAccounts).values(account).onDuplicateKeyUpdate({
    set: {
      accessToken: account.accessToken,
      refreshToken: account.refreshToken,
      tokenExpiry: account.tokenExpiry,
      isActive: account.isActive,
    },
  });
}

export async function deleteGmailAccount(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(gmailAccounts).where(and(eq(gmailAccounts.id, id), eq(gmailAccounts.userId, userId)));
}

// ─── Subscriptions ──────────────────────────────────────────────

export async function getSubscription(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertSubscription(sub: InsertSubscription) {
  const db = await getDb();
  if (!db) return;
  await db.insert(subscriptions).values(sub).onDuplicateKeyUpdate({
    set: {
      stripeCustomerId: sub.stripeCustomerId,
      stripeSubscriptionId: sub.stripeSubscriptionId,
      plan: sub.plan,
      status: sub.status,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
    },
  });
}

// ─── User Settings ──────────────────────────────────────────────

export async function getUserSettings(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertUserSettings(settings: InsertUserSettings) {
  const db = await getDb();
  if (!db) return;
  await db.insert(userSettings).values(settings).onDuplicateKeyUpdate({
    set: {
      ecoCode: settings.ecoCode,
      neuroCode: settings.neuroCode,
      dyslexicMode: settings.dyslexicMode,
      decisionThreshold: settings.decisionThreshold,
      totalActions: settings.totalActions,
    },
  });
}

// ─── Commitments ────────────────────────────────────────────────

export async function getCommitments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(commitments)
    .where(eq(commitments.userId, userId))
    .orderBy(desc(commitments.createdAt));
}

export async function createCommitment(commitment: InsertCommitment) {
  const db = await getDb();
  if (!db) return;
  await db.insert(commitments).values(commitment);
}

export async function updateCommitmentStatus(id: number, userId: number, status: "pending" | "completed" | "overdue") {
  const db = await getDb();
  if (!db) return;
  await db.update(commitments)
    .set({ status })
    .where(and(eq(commitments.id, id), eq(commitments.userId, userId)));
}

// ─── Contacts (Relational Sonar) ────────────────────────────────

export async function getContacts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contacts)
    .where(eq(contacts.userId, userId))
    .orderBy(desc(contacts.updatedAt));
}

export async function upsertContact(contact: InsertContact) {
  const db = await getDb();
  if (!db) return;
  await db.insert(contacts).values(contact).onDuplicateKeyUpdate({
    set: {
      name: contact.name,
      lastContacted: contact.lastContacted,
      relationshipScore: contact.relationshipScore,
      emailCount: contact.emailCount,
    },
  });
}

// ─── AI Attribution ─────────────────────────────────────────────

export async function logAiAttribution(entry: InsertAiAttribution) {
  const db = await getDb();
  if (!db) return;
  await db.insert(aiAttribution).values(entry);
}

export async function getAiAttributions(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiAttribution).orderBy(desc(aiAttribution.createdAt)).limit(limit);
}

// ─── Email Categories ───────────────────────────────────────────

export async function getEmailCategories(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emailCategories).where(eq(emailCategories.userId, userId));
}

// ─── Synced Emails ──────────────────────────────────────────────

export async function upsertSyncedEmail(email: InsertSyncedEmail) {
  const db = await getDb();
  if (!db) return;
  await db.insert(syncedEmails).values(email).onDuplicateKeyUpdate({
    set: {
      subject: email.subject,
      snippet: email.snippet,
      labelIds: email.labelIds,
      category: email.category,
      priority: email.priority,
      sentiment: email.sentiment,
      isRead: email.isRead,
      isStarred: email.isStarred,
      isArchived: email.isArchived,
      isTrashed: email.isTrashed,
      hasUnsubscribe: email.hasUnsubscribe,
      unsubscribeUrl: email.unsubscribeUrl,
      syncedAt: new Date(),
    },
  });
}

export async function getSyncedEmails(
  userId: number,
  opts: {
    gmailAccountId?: number;
    category?: string;
    isRead?: boolean;
    isStarred?: boolean;
    isArchived?: boolean;
    limit?: number;
    offset?: number;
  } = {}
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(syncedEmails.userId, userId)];
  if (opts.gmailAccountId !== undefined) conditions.push(eq(syncedEmails.gmailAccountId, opts.gmailAccountId));
  if (opts.category !== undefined) conditions.push(eq(syncedEmails.category, opts.category));
  if (opts.isRead !== undefined) conditions.push(eq(syncedEmails.isRead, opts.isRead));
  if (opts.isStarred !== undefined) conditions.push(eq(syncedEmails.isStarred, opts.isStarred));
  if (opts.isArchived !== undefined) conditions.push(eq(syncedEmails.isArchived, opts.isArchived));

  const query = db.select().from(syncedEmails)
    .where(and(...conditions))
    .orderBy(desc(syncedEmails.receivedAt))
    .limit(opts.limit ?? 50)
    .offset(opts.offset ?? 0);

  return query;
}

export async function countSyncedEmails(userId: number, opts: { isRead?: boolean; category?: string } = {}) {
  const db = await getDb();
  if (!db) return 0;

  const conditions = [eq(syncedEmails.userId, userId)];
  if (opts.isRead !== undefined) conditions.push(eq(syncedEmails.isRead, opts.isRead));
  if (opts.category !== undefined) conditions.push(eq(syncedEmails.category, opts.category));

  const result = await db.select({ count: sql<number>`count(*)` })
    .from(syncedEmails)
    .where(and(...conditions));

  return Number(result[0]?.count ?? 0);
}

export async function markEmailRead(userId: number, messageId: string, isRead: boolean) {
  const db = await getDb();
  if (!db) return;
  await db.update(syncedEmails)
    .set({ isRead })
    .where(and(eq(syncedEmails.userId, userId), eq(syncedEmails.messageId, messageId)));
}

export async function markEmailsRead(userId: number, messageIds: string[], isRead: boolean) {
  const db = await getDb();
  if (!db || messageIds.length === 0) return;
  await db.update(syncedEmails)
    .set({ isRead })
    .where(and(eq(syncedEmails.userId, userId), inArray(syncedEmails.messageId, messageIds)));
}

export async function markEmailsArchived(userId: number, messageIds: string[]) {
  const db = await getDb();
  if (!db || messageIds.length === 0) return;
  await db.update(syncedEmails)
    .set({ isArchived: true })
    .where(and(eq(syncedEmails.userId, userId), inArray(syncedEmails.messageId, messageIds)));
}

export async function markEmailsTrashed(userId: number, messageIds: string[]) {
  const db = await getDb();
  if (!db || messageIds.length === 0) return;
  await db.update(syncedEmails)
    .set({ isTrashed: true })
    .where(and(eq(syncedEmails.userId, userId), inArray(syncedEmails.messageId, messageIds)));
}

export async function getLastSyncTime(userId: number, gmailAccountId: number): Promise<Date | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select({ syncedAt: syncedEmails.syncedAt })
    .from(syncedEmails)
    .where(and(eq(syncedEmails.userId, userId), eq(syncedEmails.gmailAccountId, gmailAccountId)))
    .orderBy(desc(syncedEmails.syncedAt))
    .limit(1);
  return result[0]?.syncedAt ?? null;
}

// ─── Organize Jobs ──────────────────────────────────────────────

export async function createOrganizeJob(job: InsertOrganizeJob) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(organizeJobs).values(job);
  return result;
}

export async function getOrganizeJob(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(organizeJobs).where(eq(organizeJobs.id, id)).limit(1);
  return result[0] ?? null;
}

export async function updateOrganizeJob(
  id: number,
  update: Partial<Pick<InsertOrganizeJob, "status" | "processed" | "total" | "errorCount" | "categoryCounts" | "errorMessage" | "startedAt" | "completedAt">>
) {
  const db = await getDb();
  if (!db) return;
  await db.update(organizeJobs).set(update).where(eq(organizeJobs.id, id));
}

export async function listOrganizeJobs(userId: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(organizeJobs)
    .where(eq(organizeJobs.userId, userId))
    .orderBy(desc(organizeJobs.createdAt))
    .limit(limit);
}
