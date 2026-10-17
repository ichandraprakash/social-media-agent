import { BarChart3, CalendarClock, PenLine, Search, type LucideIcon } from "lucide-react";

/** The AI agents that make up a campaign's social media team. */
export const AGENT_ROLES = [
  {
    key: "research",
    name: "Research Agent",
    status: "Finding trending topics",
    emoji: "🔍",
    description: "Finds trending topics, news and content ideas for your niche.",
    greeting: "Hi! I'm your Research Agent. I can find trending topics, analyze competitors, and suggest content ideas for your campaign.\n\nWhat would you like to research today?",
  },
  {
    key: "content",
    name: "Content Agent",
    status: "Generating posts",
    emoji: "✍️",
    description: "Writes captions, posts and threads in your brand voice.",
    greeting: "Hi! I'm your Content Agent. I turn ideas into on-brand posts, captions and threads for every channel.\n\nWhat should I write for you?",
  },
  {
    key: "scheduler",
    name: "Scheduler Agent",
    status: "Planning your posts",
    emoji: "📅",
    description: "Plans your calendar and publishes posts at the best times.",
    greeting: "Hi! I'm your Scheduler Agent. I plan your content calendar and pick the best times to publish.\n\nWhat would you like to schedule?",
  },
  {
    key: "analytics",
    name: "Analytics Agent",
    status: "Analyzing performance",
    emoji: "📊",
    description: "Tracks reach and engagement and tells you what's working.",
    greeting: "Hi! I'm your Analytics Agent. I track reach and engagement and explain what's resonating with your audience.\n\nWhat would you like to know?",
  },
] as const;

export type AgentRole = (typeof AGENT_ROLES)[number];
export type AgentRoleKey = AgentRole["key"];

/** Seats are assigned roles in bundle order: desk 1 = Research, desk 2 = Content, … */
export function roleForSeat(index: number): AgentRole {
  return AGENT_ROLES[index % AGENT_ROLES.length];
}

// Class strings are written out in full so Tailwind can detect them.
export const ROLE_STYLES: Record<
  AgentRoleKey,
  {
    Icon: LucideIcon;
    /** Gradient icon tile (pair with `bg-gradient-to-br`). */
    tile: string;
    /** Selected agent card: tinted background, border and glow. */
    selected: string;
    /** Ring drawn around a selected agent's office tag. */
    ring: string;
  }
> = {
  research: {
    Icon: Search,
    tile: "from-violet-500 to-indigo-500 shadow-violet-500/40",
    selected: "border-violet-400/70 bg-gradient-to-br from-violet-500/12 to-indigo-500/8 shadow-violet-500/20 dark:border-violet-400/50",
    ring: "ring-violet-500",
  },
  content: {
    Icon: PenLine,
    tile: "from-fuchsia-500 to-pink-500 shadow-pink-500/40",
    selected: "border-pink-400/70 bg-gradient-to-br from-fuchsia-500/12 to-pink-500/8 shadow-pink-500/20 dark:border-pink-400/50",
    ring: "ring-pink-500",
  },
  scheduler: {
    Icon: CalendarClock,
    tile: "from-amber-400 to-orange-500 shadow-orange-500/40",
    selected: "border-orange-400/70 bg-gradient-to-br from-amber-400/15 to-orange-500/8 shadow-orange-500/20 dark:border-orange-400/50",
    ring: "ring-orange-500",
  },
  analytics: {
    Icon: BarChart3,
    tile: "from-emerald-500 to-teal-500 shadow-emerald-500/40",
    selected: "border-emerald-400/70 bg-gradient-to-br from-emerald-500/12 to-teal-500/8 shadow-emerald-500/20 dark:border-emerald-400/50",
    ring: "ring-emerald-500",
  },
};
