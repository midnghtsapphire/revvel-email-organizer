/**
 * Standalone Auth Routes — Google OAuth + Email/Password
 * Replaces Manus OAuth. Works on any hosting platform.
 */
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";
import { nanoid } from "nanoid";
import crypto from "crypto";

// ─── Password Hashing (no bcrypt dependency — uses Node.js built-in scrypt) ──
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, key] = hash.split(":");
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(key === derivedKey.toString("hex"));
    });
  });
}

// ─── Google OAuth Helpers ─────────────────────────────────────────
async function exchangeGoogleCode(code: string, redirectUri: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: ENV.googleClientId,
      client_secret: ENV.googleClientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Google token exchange failed: ${err}`);
  }
  return response.json();
}

async function getGoogleUserInfo(accessToken: string) {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error("Failed to get Google user info");
  return response.json();
}

// ─── Route Registration ───────────────────────────────────────────
export function registerOAuthRoutes(app: Express) {
  // ─── Google OAuth Callback ──────────────────────────────────────
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code = req.query.code as string;
    const state = req.query.state as string;

    if (!code) {
      res.status(400).json({ error: "Authorization code is required" });
      return;
    }

    try {
      // Decode redirect URI from state
      const redirectUri = state ? atob(state) : `${req.protocol}://${req.get("host")}/api/auth/google/callback`;

      const tokenData = await exchangeGoogleCode(code, redirectUri);
      const userInfo = await getGoogleUserInfo(tokenData.access_token);

      // Use Google ID as the openId
      const openId = `google_${userInfo.id}`;

      await db.upsertUser({
        openId,
        name: userInfo.name || null,
        email: userInfo.email || null,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error: any) {
      console.error("[Google OAuth] Callback failed:", error.message);
      res.redirect(302, "/login?error=google_auth_failed");
    }
  });

  // ─── Google OAuth Initiate ──────────────────────────────────────
  app.get("/api/auth/google", (req: Request, res: Response) => {
    const redirectUri = `${req.protocol}://${req.get("host")}/api/auth/google/callback`;
    const state = btoa(redirectUri);

    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", ENV.googleClientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("state", state);
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");

    res.redirect(302, url.toString());
  });

  // ─── Email/Password Register ────────────────────────────────────
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }

      if (password.length < 8) {
        res.status(400).json({ error: "Password must be at least 8 characters" });
        return;
      }

      // Check if user already exists with this email
      const existingUser = await db.getUserByEmail(email);
      if (existingUser) {
        res.status(409).json({ error: "An account with this email already exists. Try logging in instead." });
        return;
      }

      const passwordHash = await hashPassword(password);
      const openId = `email_${nanoid(21)}`;

      await db.upsertUser({
        openId,
        name: name || null,
        email,
        loginMethod: "email",
        lastSignedIn: new Date(),
      });

      // Store password hash
      await db.setPasswordHash(openId, passwordHash);

      const sessionToken = await sdk.createSessionToken(openId, {
        name: name || email,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({ success: true, user: { openId, name: name || email, email } });
    } catch (error: any) {
      console.error("[Register] Failed:", error.message);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // ─── Email/Password Login ──────────────────────────────────────
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }

      const user = await db.getUserByEmail(email);
      if (!user) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      const storedHash = await db.getPasswordHash(user.openId);
      if (!storedHash) {
        res.status(401).json({ error: "This account uses Google login. Please sign in with Google." });
        return;
      }

      const valid = await verifyPassword(password, storedHash);
      if (!valid) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      await db.upsertUser({
        openId: user.openId,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || user.email || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({ success: true, user: { openId: user.openId, name: user.name, email: user.email } });
    } catch (error: any) {
      console.error("[Login] Failed:", error.message);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // ─── Legacy Manus OAuth callback — redirect to login ────────────
  app.get("/api/oauth/callback", (_req: Request, res: Response) => {
    res.redirect(302, "/login?error=manus_oauth_deprecated");
  });
}
