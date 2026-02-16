import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 1,
    openId: "test-user-123",
    email: "test@revvel.app",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
}

function createAuthContext(user?: AuthenticatedUser): TrpcContext {
  return {
    user: user || createMockUser(),
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("auth.me", () => {
  it("returns null for unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user data for authenticated users", async () => {
    const user = createMockUser();
    const ctx = createAuthContext(user);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.email).toBe("test@revvel.app");
    expect(result?.name).toBe("Test User");
  });
});

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(ctx.res.clearCookie).toHaveBeenCalled();
  });
});

describe("gmail.isConfigured", () => {
  it("returns configuration status", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.gmail.isConfigured();
    expect(result).toHaveProperty("configured");
    expect(typeof result.configured).toBe("boolean");
  });
});

describe("gmail.getAuthUrl", () => {
  it("returns demo mode info when Google credentials are not set", async () => {
    const originalClientId = process.env.GOOGLE_CLIENT_ID;
    const originalClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    // Temporarily clear credentials
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.gmail.getAuthUrl({ origin: "http://localhost:3000" });
    
    expect(result.url).toBeNull();
    expect(result.demoMode).toBe(true);
    expect(result.error).toContain("demo mode");
    
    // Restore
    if (originalClientId) process.env.GOOGLE_CLIENT_ID = originalClientId;
    if (originalClientSecret) process.env.GOOGLE_CLIENT_SECRET = originalClientSecret;
  });
});

describe("subscription.get", () => {
  it("returns free plan for users without subscription", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.subscription.get();
    expect(result).toHaveProperty("plan");
    expect(result.plan).toBe("free");
  });
});

describe("compass.overview", () => {
  it("returns dashboard overview data for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.compass.overview();
    
    expect(result).toHaveProperty("inboxWeather");
    expect(result).toHaveProperty("commitments");
    expect(result).toHaveProperty("contacts");
    expect(result).toHaveProperty("settings");
    
    expect(result.inboxWeather).toHaveProperty("state");
    expect(result.commitments).toHaveProperty("total");
    expect(result.commitments).toHaveProperty("pending");
    expect(result.contacts).toHaveProperty("total");
  });
});
