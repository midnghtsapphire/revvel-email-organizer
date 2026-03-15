import { describe, it, expect } from "vitest";
import {
  heuristicCategorize,
  labelName,
  extractUnsubscribeLink,
  EMAIL_CATEGORIES,
} from "./emailOrganizer";

describe("heuristicCategorize", () => {
  it("categorizes social emails correctly", () => {
    const result = heuristicCategorize({
      from: "notification@facebookmail.com",
      subject: "You have a new friend request",
      snippet: "John wants to connect with you",
    });
    expect(result.category).toBe("Social");
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    expect(result.priority).toBe("low");
  });

  it("categorizes newsletter emails by domain", () => {
    const result = heuristicCategorize({
      from: "writer@substack.com",
      subject: "The Weekly Digest — Issue 42",
      snippet: "Here are the top stories this week",
    });
    expect(result.category).toBe("Newsletters");
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it("categorizes by Gmail CATEGORY_PROMOTIONS label", () => {
    const result = heuristicCategorize({
      from: "deals@shop.com",
      subject: "50% off everything this weekend!",
      snippet: "Don't miss our biggest sale",
      labelIds: ["CATEGORY_PROMOTIONS"],
    });
    expect(result.category).toBe("Promotions");
  });

  it("categorizes receipt emails by subject keywords", () => {
    const result = heuristicCategorize({
      from: "receipts@stripe.com",
      subject: "Your receipt from Revvel Pro",
      snippet: "Thank you for your payment of $15.00",
    });
    expect(result.category).toBe("Receipts");
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it("categorizes order confirmation emails", () => {
    const result = heuristicCategorize({
      from: "orders@amazon.com",
      subject: "Order Confirmation #123-456",
      snippet: "Your order has been confirmed",
    });
    expect(result.category).toBe("Receipts");
  });

  it("categorizes finance-related emails", () => {
    const result = heuristicCategorize({
      from: "alerts@chase.com",
      subject: "Your bank statement is ready",
      snippet: "Your monthly statement is now available",
    });
    expect(result.category).toBe("Finance");
  });

  it("categorizes travel emails", () => {
    const result = heuristicCategorize({
      from: "no-reply@airbnb.com",
      subject: "Your flight booking confirmation",
      snippet: "Your itinerary is attached",
    });
    expect(result.category).toBe("Travel");
  });

  it("categorizes health-related emails", () => {
    const result = heuristicCategorize({
      from: "noreply@clinic.com",
      subject: "Your appointment reminder",
      snippet: "You have an appointment scheduled for tomorrow",
    });
    expect(result.category).toBe("Health");
  });

  it("categorizes notification senders", () => {
    const result = heuristicCategorize({
      from: "noreply@github.com",
      subject: "[revvel] PR #42 merged",
      snippet: "Pull request merged successfully",
    });
    expect(result.category).toBe("Notifications");
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it("detects newsletter from List-Unsubscribe header", () => {
    const result = heuristicCategorize({
      from: "news@unknown-domain.com",
      subject: "Weekly roundup",
      snippet: "This week we cover…",
      listUnsubscribe: "<https://unsubscribe.example.com/list>",
    });
    expect(result.category).toBe("Newsletters");
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it("returns a valid category for unknown senders", () => {
    const result = heuristicCategorize({
      from: "someone@random.net",
      subject: "Hello",
      snippet: "Just checking in",
    });
    expect(EMAIL_CATEGORIES).toContain(result.category);
    expect(["high", "medium", "low"]).toContain(result.priority);
    expect(result.confidence).toBeGreaterThan(0);
  });
});

describe("labelName", () => {
  it("returns Revvel-prefixed label names", () => {
    expect(labelName("Work")).toBe("Revvel/Work");
    expect(labelName("Newsletters")).toBe("Revvel/Newsletters");
    expect(labelName("Personal")).toBe("Revvel/Personal");
  });

  it("covers all categories", () => {
    for (const cat of EMAIL_CATEGORIES) {
      expect(labelName(cat)).toBe(`Revvel/${cat}`);
    }
  });
});

describe("extractUnsubscribeLink", () => {
  it("extracts HTTPS unsubscribe URL", () => {
    const header = "<https://example.com/unsubscribe?id=123>, <mailto:unsub@example.com>";
    const url = extractUnsubscribeLink(header);
    expect(url).toBe("https://example.com/unsubscribe?id=123");
  });

  it("falls back to mailto when no https URL", () => {
    const header = "<mailto:unsub@example.com?subject=unsubscribe>";
    const url = extractUnsubscribeLink(header);
    expect(url).toBe("mailto:unsub@example.com?subject=unsubscribe");
  });

  it("returns null when header has no link", () => {
    const url = extractUnsubscribeLink("no links here");
    expect(url).toBeNull();
  });
});

describe("EMAIL_CATEGORIES", () => {
  it("contains the expected categories", () => {
    expect(EMAIL_CATEGORIES).toContain("Work");
    expect(EMAIL_CATEGORIES).toContain("Personal");
    expect(EMAIL_CATEGORIES).toContain("Newsletters");
    expect(EMAIL_CATEGORIES).toContain("Notifications");
    expect(EMAIL_CATEGORIES).toContain("Receipts");
    expect(EMAIL_CATEGORIES).toContain("Social");
    expect(EMAIL_CATEGORIES).toContain("Promotions");
    expect(EMAIL_CATEGORIES).toContain("Finance");
    expect(EMAIL_CATEGORIES).toContain("Travel");
    expect(EMAIL_CATEGORIES).toContain("Health");
  });

  it("has exactly 10 categories", () => {
    expect(EMAIL_CATEGORIES.length).toBe(10);
  });
});
