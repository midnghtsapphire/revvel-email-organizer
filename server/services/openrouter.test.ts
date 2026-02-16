import { describe, expect, it, vi } from "vitest";

/**
 * OpenRouter service unit tests.
 * Tests the service interface and error handling without making real API calls.
 */

// Mock axios to avoid real API calls
vi.mock("axios", () => ({
  default: {
    post: vi.fn(),
  },
}));

// Mock db to avoid database calls
vi.mock("../db", () => ({
  logAiAttribution: vi.fn().mockResolvedValue(undefined),
}));

import axios from "axios";
import { callOpenRouter, summarizeEmail, extractCommitments, categorizeEmail, draftReply } from "./openrouter";

const mockedAxios = vi.mocked(axios);

describe("callOpenRouter", () => {
  it("throws when OPENROUTER_API_KEY is not set", async () => {
    const originalKey = process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_API_KEY;

    await expect(
      callOpenRouter(
        [{ role: "user", content: "test" }],
        { component: "test", action: "test" }
      )
    ).rejects.toThrow("OPENROUTER_API_KEY is not configured");

    if (originalKey) process.env.OPENROUTER_API_KEY = originalKey;
  });

  it("calls OpenRouter API with correct parameters", async () => {
    const originalKey = process.env.OPENROUTER_API_KEY;
    process.env.OPENROUTER_API_KEY = "test-key";

    mockedAxios.post.mockResolvedValueOnce({
      data: {
        id: "test-id",
        model: "anthropic/claude-sonnet-4",
        choices: [{ message: { role: "assistant", content: "Hello!" }, finish_reason: "stop" }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      },
    });

    const result = await callOpenRouter(
      [{ role: "user", content: "Hello" }],
      { component: "test", action: "test" }
    );

    expect(result.content).toBe("Hello!");
    expect(result.model).toBe("anthropic/claude-sonnet-4");
    expect(mockedAxios.post).toHaveBeenCalledWith(
      "https://openrouter.ai/api/v1/chat/completions",
      expect.objectContaining({
        model: "anthropic/claude-sonnet-4",
        messages: [{ role: "user", content: "Hello" }],
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-key",
        }),
      })
    );

    if (originalKey) process.env.OPENROUTER_API_KEY = originalKey;
    else delete process.env.OPENROUTER_API_KEY;
  });

  it("uses custom model when specified", async () => {
    const originalKey = process.env.OPENROUTER_API_KEY;
    process.env.OPENROUTER_API_KEY = "test-key";

    mockedAxios.post.mockResolvedValueOnce({
      data: {
        id: "test-id",
        model: "openai/gpt-4o",
        choices: [{ message: { role: "assistant", content: "Hi" }, finish_reason: "stop" }],
      },
    });

    await callOpenRouter(
      [{ role: "user", content: "Hello" }],
      { component: "test", action: "test", model: "openai/gpt-4o" }
    );

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ model: "openai/gpt-4o" }),
      expect.any(Object)
    );

    if (originalKey) process.env.OPENROUTER_API_KEY = originalKey;
    else delete process.env.OPENROUTER_API_KEY;
  });
});

describe("summarizeEmail", () => {
  it("returns a summary string", async () => {
    const originalKey = process.env.OPENROUTER_API_KEY;
    process.env.OPENROUTER_API_KEY = "test-key";

    mockedAxios.post.mockResolvedValueOnce({
      data: {
        id: "test",
        model: "anthropic/claude-sonnet-4",
        choices: [{ message: { role: "assistant", content: "Meeting scheduled for Friday." }, finish_reason: "stop" }],
      },
    });

    const result = await summarizeEmail("Hi, let's meet on Friday at 3pm to discuss the project.");
    expect(result).toBe("Meeting scheduled for Friday.");

    if (originalKey) process.env.OPENROUTER_API_KEY = originalKey;
    else delete process.env.OPENROUTER_API_KEY;
  });
});

describe("extractCommitments", () => {
  it("parses JSON array of commitments", async () => {
    const originalKey = process.env.OPENROUTER_API_KEY;
    process.env.OPENROUTER_API_KEY = "test-key";

    mockedAxios.post.mockResolvedValueOnce({
      data: {
        id: "test",
        model: "anthropic/claude-sonnet-4",
        choices: [{
          message: {
            role: "assistant",
            content: JSON.stringify([{ text: "Send report by Friday", dueDate: "2026-02-20" }]),
          },
          finish_reason: "stop",
        }],
      },
    });

    const result = await extractCommitments("I'll send the report by Friday.");
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("Send report by Friday");

    if (originalKey) process.env.OPENROUTER_API_KEY = originalKey;
    else delete process.env.OPENROUTER_API_KEY;
  });

  it("returns empty array on invalid JSON", async () => {
    const originalKey = process.env.OPENROUTER_API_KEY;
    process.env.OPENROUTER_API_KEY = "test-key";

    mockedAxios.post.mockResolvedValueOnce({
      data: {
        id: "test",
        model: "anthropic/claude-sonnet-4",
        choices: [{ message: { role: "assistant", content: "not valid json" }, finish_reason: "stop" }],
      },
    });

    const result = await extractCommitments("Some email text");
    expect(result).toEqual([]);

    if (originalKey) process.env.OPENROUTER_API_KEY = originalKey;
    else delete process.env.OPENROUTER_API_KEY;
  });
});

describe("categorizeEmail", () => {
  it("returns categorization result", async () => {
    const originalKey = process.env.OPENROUTER_API_KEY;
    process.env.OPENROUTER_API_KEY = "test-key";

    mockedAxios.post.mockResolvedValueOnce({
      data: {
        id: "test",
        model: "anthropic/claude-sonnet-4",
        choices: [{
          message: {
            role: "assistant",
            content: JSON.stringify({ category: "Work", priority: "high", sentiment: "neutral" }),
          },
          finish_reason: "stop",
        }],
      },
    });

    const result = await categorizeEmail("Q4 Report", "Please review the attached report", "boss@company.com");
    expect(result.category).toBe("Work");
    expect(result.priority).toBe("high");

    if (originalKey) process.env.OPENROUTER_API_KEY = originalKey;
    else delete process.env.OPENROUTER_API_KEY;
  });

  it("returns defaults on invalid JSON", async () => {
    const originalKey = process.env.OPENROUTER_API_KEY;
    process.env.OPENROUTER_API_KEY = "test-key";

    mockedAxios.post.mockResolvedValueOnce({
      data: {
        id: "test",
        model: "anthropic/claude-sonnet-4",
        choices: [{ message: { role: "assistant", content: "invalid" }, finish_reason: "stop" }],
      },
    });

    const result = await categorizeEmail("Test", "test", "test@test.com");
    expect(result.category).toBe("Work");
    expect(result.priority).toBe("medium");
    expect(result.sentiment).toBe("neutral");

    if (originalKey) process.env.OPENROUTER_API_KEY = originalKey;
    else delete process.env.OPENROUTER_API_KEY;
  });
});

describe("draftReply", () => {
  it("returns a draft reply string", async () => {
    const originalKey = process.env.OPENROUTER_API_KEY;
    process.env.OPENROUTER_API_KEY = "test-key";

    mockedAxios.post.mockResolvedValueOnce({
      data: {
        id: "test",
        model: "anthropic/claude-sonnet-4",
        choices: [{
          message: { role: "assistant", content: "Thank you for your email. I'll review and get back to you." },
          finish_reason: "stop",
        }],
      },
    });

    const result = await draftReply("Please review the attached document.", "professional");
    expect(result).toContain("Thank you");

    if (originalKey) process.env.OPENROUTER_API_KEY = originalKey;
    else delete process.env.OPENROUTER_API_KEY;
  });
});
