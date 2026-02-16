/**
 * OpenRouter API integration for AI features.
 * Routes through Claude Sonnet 4.5 (anthropic/claude-sonnet-4) for production-quality code.
 * 
 * AI Attribution: This module was architected by Claude Sonnet 4 via Manus agent.
 */
import axios from "axios";
import { logAiAttribution } from "../db";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function callOpenRouter(
  messages: OpenRouterMessage[],
  options: {
    model?: string;
    component: string;
    action: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<{ content: string; model: string; usage?: OpenRouterResponse["usage"] }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured. Set it in environment variables.");
  }

  const model = options.model || "anthropic/claude-sonnet-4";
  const startTime = Date.now();

  try {
    const response = await axios.post<OpenRouterResponse>(
      OPENROUTER_API_URL,
      {
        model,
        messages,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature ?? 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://revvel.app",
          "X-Title": "Revvel Email Organizer",
        },
        timeout: 60000,
      }
    );

    const latencyMs = Date.now() - startTime;
    const content = response.data.choices[0]?.message?.content || "";
    const usage = response.data.usage;

    // Log AI attribution
    await logAiAttribution({
      model: response.data.model || model,
      component: options.component,
      action: options.action,
      inputTokens: usage?.prompt_tokens || 0,
      outputTokens: usage?.completion_tokens || 0,
      latencyMs,
      metadata: {
        requestModel: model,
        actualModel: response.data.model,
        finishReason: response.data.choices[0]?.finish_reason,
      },
    }).catch(err => console.warn("[AI Attribution] Failed to log:", err));

    return { content, model: response.data.model || model, usage };
  } catch (error: any) {
    console.error("[OpenRouter] API call failed:", error?.response?.data || error.message);
    throw new Error(`OpenRouter API error: ${error?.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Summarize an email using AI.
 */
export async function summarizeEmail(emailContent: string): Promise<string> {
  const result = await callOpenRouter(
    [
      {
        role: "system",
        content: "You are Revvel's email assistant. Summarize the email concisely in 1-2 sentences. Focus on action items and key information. Be warm but efficient.",
      },
      {
        role: "user",
        content: `Summarize this email:\n\n${emailContent}`,
      },
    ],
    { component: "email-summarizer", action: "summarize" }
  );
  return result.content;
}

/**
 * Extract commitments from email text.
 */
export async function extractCommitments(emailContent: string): Promise<Array<{ text: string; dueDate?: string }>> {
  const result = await callOpenRouter(
    [
      {
        role: "system",
        content: `You are Revvel's Commitment Tracker. Extract any promises, deadlines, or action items from the email. Return a JSON array of objects with "text" (the commitment) and optional "dueDate" (ISO date string). If no commitments found, return an empty array. Only return valid JSON, no markdown.`,
      },
      {
        role: "user",
        content: emailContent,
      },
    ],
    { component: "commitment-tracker", action: "extract-commitments", temperature: 0.1 }
  );

  try {
    return JSON.parse(result.content);
  } catch {
    return [];
  }
}

/**
 * Draft a reply to an email.
 */
export async function draftReply(
  emailContent: string,
  tone: "professional" | "casual" | "brief" = "professional"
): Promise<string> {
  const result = await callOpenRouter(
    [
      {
        role: "system",
        content: `You are Revvel's email drafting assistant. Write a ${tone} reply to the email. Be concise, warm, and action-oriented. Do not include subject line or email headers.`,
      },
      {
        role: "user",
        content: `Draft a ${tone} reply to this email:\n\n${emailContent}`,
      },
    ],
    { component: "email-drafter", action: "draft-reply" }
  );
  return result.content;
}

/**
 * Categorize an email into a smart folder.
 */
export async function categorizeEmail(
  subject: string,
  snippet: string,
  from: string
): Promise<{ category: string; priority: "high" | "medium" | "low"; sentiment: "positive" | "neutral" | "negative" }> {
  const result = await callOpenRouter(
    [
      {
        role: "system",
        content: `You are Revvel's email categorizer. Analyze the email and return a JSON object with:
- "category": one of "Work", "Personal", "Newsletters", "Notifications", "Receipts", "Social", "Promotions"
- "priority": "high", "medium", or "low"
- "sentiment": "positive", "neutral", or "negative"
Only return valid JSON, no markdown.`,
      },
      {
        role: "user",
        content: `From: ${from}\nSubject: ${subject}\nSnippet: ${snippet}`,
      },
    ],
    { component: "email-categorizer", action: "categorize", temperature: 0.1 }
  );

  try {
    return JSON.parse(result.content);
  } catch {
    return { category: "Work", priority: "medium", sentiment: "neutral" };
  }
}
