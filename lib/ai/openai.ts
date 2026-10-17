import "server-only";

import { OpenAIProvider, Runner } from "@openai/agents";
import OpenAI from "openai";

/**
 * One OpenAI client and one Agents SDK runner for the whole server process.
 *
 * The runner is given our client explicitly (instead of the SDK's global default), so every
 * agent run shares the same connection pool and configuration. Both are created lazily, so a
 * missing key fails the request that needs it, not the build. They're kept on globalThis so
 * dev hot reloads don't create a new client on every edit.
 */

type AiGlobals = { client?: OpenAI; runner?: Runner };
const globals = globalThis as typeof globalThis & { __socialAgentsAi?: AiGlobals };
const ai = (globals.__socialAgentsAi ??= {});

export class OpenAINotConfiguredError extends Error {
  constructor() {
    super("OPENAI_API_KEY is not set");
    this.name = "OpenAINotConfiguredError";
  }
}

export function isOpenAIConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

/** The shared OpenAI client. Throws OpenAINotConfiguredError when no API key is set. */
export function getOpenAIClient(): OpenAI {
  if (!ai.client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new OpenAINotConfiguredError();
    ai.client = new OpenAI({ apiKey, maxRetries: 2, timeout: 60_000 });
  }
  return ai.client;
}

/**
 * The shared Agents SDK runner, wired to our OpenAI client.
 * The model comes from OPENAI_DEFAULT_MODEL when set, otherwise the SDK's default.
 */
export function getAgentRunner(): Runner {
  ai.runner ??= new Runner({
    modelProvider: new OpenAIProvider({ openAIClient: getOpenAIClient() }),
    workflowName: "Social media agents",
    // Don't send user conversations to OpenAI's trace dashboard.
    traceIncludeSensitiveData: false,
  });
  return ai.runner;
}
