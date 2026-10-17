import { z } from "zod";
import { AGENT_ROLES, type AgentRoleKey } from "@/lib/agent-roles";

/** Request contract for POST /api/agents/[agent]/chat, shared by the route and the browser. */

export const CHAT_LIMITS = {
  /** Earlier turns beyond this are dropped (oldest first) before sending. */
  maxMessages: 40,
  /** What the user can type in one message. */
  maxUserChars: 4_000,
  /** Longer, since agents may write full posts or calendars. */
  maxAssistantChars: 12_000,
  maxPreferencesChars: 1_000,
} as const;

export const chatRequestSchema = z.object({
  messages: z
    .array(
      z.discriminatedUnion("role", [
        z.object({ role: z.literal("user"), content: z.string().trim().min(1).max(CHAT_LIMITS.maxUserChars) }),
        z.object({ role: z.literal("assistant"), content: z.string().trim().min(1).max(CHAT_LIMITS.maxAssistantChars) }),
      ])
    )
    .min(1)
    .max(CHAT_LIMITS.maxMessages)
    .refine((messages) => messages.at(-1)?.role === "user", "The last message must be from the user"),
  preferences: z.string().trim().max(CHAT_LIMITS.maxPreferencesChars).optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ChatTurn = ChatRequest["messages"][number];

export function isAgentRoleKey(value: string): value is AgentRoleKey {
  return AGENT_ROLES.some((role) => role.key === value);
}
