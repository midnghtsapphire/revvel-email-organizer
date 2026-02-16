import { describe, expect, it } from "vitest";
import { isGmailConfigured, getGmailAuthUrl, parseEmailHeaders, decodeBody, extractTextBody } from "./gmail";

describe("isGmailConfigured", () => {
  it("returns false when credentials are not set", () => {
    const origId = process.env.GOOGLE_CLIENT_ID;
    const origSecret = process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;

    expect(isGmailConfigured()).toBe(false);

    if (origId) process.env.GOOGLE_CLIENT_ID = origId;
    if (origSecret) process.env.GOOGLE_CLIENT_SECRET = origSecret;
  });

  it("returns true when both credentials are set", () => {
    const origId = process.env.GOOGLE_CLIENT_ID;
    const origSecret = process.env.GOOGLE_CLIENT_SECRET;
    process.env.GOOGLE_CLIENT_ID = "test-id";
    process.env.GOOGLE_CLIENT_SECRET = "test-secret";

    expect(isGmailConfigured()).toBe(true);

    if (origId) process.env.GOOGLE_CLIENT_ID = origId;
    else delete process.env.GOOGLE_CLIENT_ID;
    if (origSecret) process.env.GOOGLE_CLIENT_SECRET = origSecret;
    else delete process.env.GOOGLE_CLIENT_SECRET;
  });
});

describe("getGmailAuthUrl", () => {
  it("throws when GOOGLE_CLIENT_ID is not set", () => {
    const origId = process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_ID;

    expect(() => getGmailAuthUrl("http://localhost:3000")).toThrow("GOOGLE_CLIENT_ID is not configured");

    if (origId) process.env.GOOGLE_CLIENT_ID = origId;
  });

  it("returns a valid Google OAuth URL when configured", () => {
    const origId = process.env.GOOGLE_CLIENT_ID;
    process.env.GOOGLE_CLIENT_ID = "test-client-id.apps.googleusercontent.com";

    const url = getGmailAuthUrl("http://localhost:3000");
    expect(url).toContain("accounts.google.com");
    expect(url).toContain("client_id=test-client-id");
    expect(url).toContain("redirect_uri=");
    expect(url).toContain("scope=");
    expect(url).toContain("access_type=offline");

    if (origId) process.env.GOOGLE_CLIENT_ID = origId;
    else delete process.env.GOOGLE_CLIENT_ID;
  });
});

describe("parseEmailHeaders", () => {
  it("extracts standard email headers", () => {
    const headers = [
      { name: "From", value: "sender@example.com" },
      { name: "To", value: "recipient@example.com" },
      { name: "Subject", value: "Test Email" },
      { name: "Date", value: "Mon, 16 Feb 2026 12:00:00 -0700" },
    ];

    const parsed = parseEmailHeaders(headers);
    expect(parsed.from).toBe("sender@example.com");
    expect(parsed.to).toBe("recipient@example.com");
    expect(parsed.subject).toBe("Test Email");
    expect(parsed.date).toContain("2026");
  });

  it("handles case-insensitive header names", () => {
    const headers = [
      { name: "from", value: "test@test.com" },
      { name: "SUBJECT", value: "Test" },
    ];

    const parsed = parseEmailHeaders(headers);
    expect(parsed.from).toBe("test@test.com");
    expect(parsed.subject).toBe("Test");
  });

  it("returns empty strings for missing headers", () => {
    const parsed = parseEmailHeaders([]);
    expect(parsed.from).toBe("");
    expect(parsed.to).toBe("");
    expect(parsed.subject).toBe("");
  });
});

describe("decodeBody", () => {
  it("decodes base64url encoded content", () => {
    const encoded = Buffer.from("Hello, World!").toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
    const decoded = decodeBody(encoded);
    expect(decoded).toBe("Hello, World!");
  });

  it("handles standard base64 characters", () => {
    const encoded = Buffer.from("Test message with special chars: <>&").toString("base64");
    const decoded = decodeBody(encoded);
    expect(decoded).toContain("Test message");
  });
});

describe("extractTextBody", () => {
  it("extracts body data from payload", () => {
    const message = {
      id: "1",
      threadId: "1",
      labelIds: ["INBOX"],
      snippet: "Hello",
      payload: {
        headers: [],
        body: { data: Buffer.from("Hello from email body").toString("base64") },
      },
      internalDate: "1234567890",
    };

    const text = extractTextBody(message);
    expect(text).toBe("Hello from email body");
  });

  it("extracts text/plain from parts", () => {
    const message = {
      id: "1",
      threadId: "1",
      labelIds: ["INBOX"],
      snippet: "Snippet text",
      payload: {
        headers: [],
        parts: [
          { mimeType: "text/plain", body: { data: Buffer.from("Plain text content").toString("base64") } },
          { mimeType: "text/html", body: { data: Buffer.from("<p>HTML content</p>").toString("base64") } },
        ],
      },
      internalDate: "1234567890",
    };

    const text = extractTextBody(message);
    expect(text).toBe("Plain text content");
  });

  it("falls back to snippet when no body data", () => {
    const message = {
      id: "1",
      threadId: "1",
      labelIds: ["INBOX"],
      snippet: "Fallback snippet",
      payload: {
        headers: [],
      },
      internalDate: "1234567890",
    };

    const text = extractTextBody(message);
    expect(text).toBe("Fallback snippet");
  });
});
