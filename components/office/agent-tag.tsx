"use client";

import { cn } from "cn";
import { ROLE_STYLES, type AgentRole } from "@/lib/agent-roles";

/**
 * Name card that floats above an agent's head.
 * Sized in `em` from a container-relative font size, so it scales with the office.
 */
export function AgentTag({
  role,
  visible,
  delay,
  selected = false,
  dimmed = false,
}: {
  role: AgentRole;
  visible: boolean;
  delay: number;
  /** Highlight this tag as the selected agent. */
  selected?: boolean;
  /** Fade this tag back while another agent is selected. */
  dimmed?: boolean;
}) {
  const { Icon, tile, ring } = ROLE_STYLES[role.key];

  return (
    <div
      className={cn(
        "transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
        visible ? "scale-100 opacity-100" : "translate-y-[0.6em] scale-90 opacity-0",
        visible && selected && "scale-110",
        visible && dimmed && "opacity-75"
      )}
      style={{ transitionDelay: visible && (selected || dimmed) ? "0ms" : `${delay}ms` }}
    >
      <div className="animate-float" style={{ animationDelay: `${-delay * 3}ms` }}>
        <div
          className={cn(
            "group/tag relative flex items-center gap-[0.6em] rounded-[0.95em] border border-white/70 bg-white/95 py-[0.45em] pr-[0.8em] pl-[0.45em] whitespace-nowrap text-slate-900 shadow-[0_0.5em_1.5em_-0.4em_rgb(15_23_42/0.45)] backdrop-blur-md transition-transform duration-300 hover:scale-105",
            selected && cn("ring-[0.18em] ring-offset-[0.12em] ring-offset-white/60", ring)
          )}
        >
          <span className={cn("flex size-[2.3em] shrink-0 items-center justify-center rounded-[0.7em] bg-gradient-to-br text-white shadow-[0_0.3em_0.8em_-0.2em]", tile)}>
            <Icon className="size-[1.15em]" strokeWidth={2.4} />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[1em] font-bold tracking-tight">{role.name}</span>
            <span className="text-[0.78em] font-medium text-slate-500">
              {role.status}… <span aria-hidden="true">{role.emoji}</span>
            </span>
          </span>
          <span className="relative ml-[0.2em] flex size-[0.55em]">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex size-full rounded-full bg-emerald-500" />
          </span>
          {/* Pointer down to the agent */}
          <span className="absolute -bottom-[0.38em] left-1/2 size-[0.75em] -translate-x-1/2 rotate-45 rounded-[0.15em] border-r border-b border-white/70 bg-white/95" />
        </div>
      </div>
    </div>
  );
}
