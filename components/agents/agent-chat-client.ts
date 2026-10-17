import { CHAT_LIMITS, type ChatRequest, type ChatTurn } from "@/lib/ai/chat";
import type { AgentRoleKey } from "@/lib/agent-roles";

export class AgentChatError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "AgentChatError";
  }
}

/** Keep the most recent turns within the API limits (the server rejects anything larger). */
export function toChatTurns(turns: ChatTurn[]): ChatTurn[] {
  const recent = turns.filter((t) => t.content.trim()).slice(-CHAT_LIMITS.maxMessages);
  return recent.map((t) => ({
    ...t,
    content: t.content.slice(0, t.role === "user" ? CHAT_LIMITS.maxUserChars : CHAT_LIMITS.maxAssistantChars),
  }));
}

/**
 * Send the conversation to an agent and stream its reply.
 * Calls `onText` with each chunk as it arrives; resolves when the reply is complete.
 */
export async function streamAgentReply(
  agent: AgentRoleKey,
  body: ChatRequest,
  { signal, onText }: { signal?: AbortSignal; onText: (chunk: string) => void }
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`/api/agents/${agent}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new AgentChatError("You appear to be offline. Check your connection and try again.");
  }

  if (!response.ok || !response.body) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new AgentChatError(data?.error ?? "The agent couldn't respond right now. Please try again.", response.status);
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return;
      if (value) onText(value);
    }
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new AgentChatError("The reply was interrupted. Please try again.");
  }
}
