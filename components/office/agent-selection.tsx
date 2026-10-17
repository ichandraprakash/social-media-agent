"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { AgentRoleKey } from "@/lib/agent-roles";

type AgentSelection = {
  /** Null until an agent is picked (when the provider starts with nothing selected). */
  selected: AgentRoleKey | null;
  select: (key: AgentRoleKey | null) => void;
};

const AgentSelectionContext = createContext<AgentSelection | null>(null);

/**
 * Shares the selected agent between the agent list and the office scene.
 * Inside this provider, office characters become clickable; outside it the office is display-only.
 */
export function AgentSelectionProvider({
  defaultSelected = null,
  children,
}: {
  defaultSelected?: AgentRoleKey | null;
  children: React.ReactNode;
}) {
  const [selected, select] = useState<AgentRoleKey | null>(defaultSelected);
  const value = useMemo(() => ({ selected, select }), [selected]);
  return <AgentSelectionContext.Provider value={value}>{children}</AgentSelectionContext.Provider>;
}

/** The current selection, or null when rendered outside an AgentSelectionProvider. */
export function useAgentSelection() {
  return useContext(AgentSelectionContext);
}
