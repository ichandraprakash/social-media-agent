import { assistant, user as userMessage } from "@openai/agents";
import { NextResponse } from "next/server";
import { getAgent } from "@/lib/ai/agents";
import { chatRequestSchema, isAgentRoleKey } from "@/lib/ai/chat";
import { getAgentRunner, isOpenAIConfigured } from "@/lib/ai/openai";
import { createRateLimiter } from "@/lib/ai/rate-limit";
import { getActiveCampaign } from "@/lib/campaigns";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Per user, across all agents.
const rateLimit = createRateLimiter({ limit: 20, windowMs: 60_000 });

/**
 * Chat with one agent. Body: { messages, preferences? } (see lib/ai/chat.ts).
 * The browser sends the conversation so far; the agent's system instructions are added here
 * on the server and can't be changed by the client. Responds with the reply as streamed plain text.
 */
export async function POST(request: Request, { params }: { params: Promise<{ agent: string }> }) {
  const { agent: agentKey } = await params;
  if (!isAgentRoleKey(agentKey)) return error(404, "Unknown agent.");

  const currentUser = await getCurrentUser();
  if (!currentUser) return error(401, "Your session has expired. Refresh the page to sign in again.");

  const limited = rateLimit(currentUser.id);
  if (!limited.ok) {
    return error(429, "You're sending messages too quickly. Try again in a moment.", { "Retry-After": String(limited.retryAfterSeconds) });
  }

  const parsed = chatRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return error(400, "That message couldn't be sent. Try a shorter message.");

  if (!isOpenAIConfigured()) return error(503, "AI agents aren't configured yet. Add OPENAI_API_KEY to the server environment.");

  const { active: campaign } = await getActiveCampaign(currentUser.id);
  if (!campaign) return error(409, "Create a campaign before chatting with your agents.");

  const { messages, preferences } = parsed.data;
  const input = messages.map((m) => (m.role === "user" ? userMessage(m.content) : assistant(m.content)));

  try {
    const result = await getAgentRunner().run(getAgent(agentKey), input, {
      stream: true,
      context: { campaignName: campaign.name, preferences },
      // Stop generating (and billing) if the user leaves or the request is cancelled.
      signal: request.signal,
      maxTurns: 3,
    });

    // Wait for the first chunk so failures before any output (bad key, quota, refusal) get a real
    // error status instead of an empty 200.
    // The SDK types this with its own stream shim; on Node it's a standard web ReadableStream.
    const reader = (result.toTextStream() as unknown as ReadableStream<string>).getReader();
    const first = await reader.read();

    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        if (first.done) controller.close();
        else controller.enqueue(encoder.encode(first.value));
      },
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          if (done) controller.close();
          else controller.enqueue(encoder.encode(value));
        } catch (err) {
          console.error(`[agents] ${agentKey} stream failed`, err);
          controller.error(err);
        }
      },
      cancel(reason) {
        return reader.cancel(reason);
      },
    });

    return new Response(body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    if (request.signal.aborted) return new Response(null, { status: 499 });
    console.error(`[agents] ${agentKey} run failed`, err);
    // Provider details (keys, quotas, org ids) stay in the server log.
    return error(502, "The agent couldn't respond right now. Please try again.");
  }
}

function error(status: number, message: string, headers?: HeadersInit) {
  return NextResponse.json({ error: message }, { status, headers });
}
