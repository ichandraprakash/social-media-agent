"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, ChevronLeft } from "lucide-react";
import { cn } from "cn";
import { BRAND_NAME, LogoMark } from "@/components/brand/logo";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DASHBOARD_NAV, navItemForPath, type NavItem } from "@/lib/dashboard-nav";
import { CampaignSwitcher } from "./campaign-switcher";
import type { CampaignSummary } from "./types";

export function SidebarContent({
  expanded,
  campaigns,
  activeCampaignId,
  onNavigate,
}: {
  expanded: boolean;
  campaigns: CampaignSummary[];
  activeCampaignId: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const current = navItemForPath(pathname);

  return (
    <div className="flex h-full flex-col px-4 pt-5 pb-4">
      {/* Logo */}
      <Link href="/dashboard" onClick={onNavigate} className="flex h-10 items-center gap-3 px-2" aria-label={`${BRAND_NAME} home`}>
        <LogoMark className="size-9 rounded-xl" />
        <FadeLabel expanded={expanded} className="text-[17px] font-extrabold tracking-tight">{BRAND_NAME}</FadeLabel>
      </Link>

      {/* Campaign switcher */}
      <div className="mt-6">
        <CampaignSwitcher campaigns={campaigns} activeId={activeCampaignId} expanded={expanded} />
      </div>

      {/* Navigation */}
      <div className="relative mt-6 mb-2 h-4 px-3">
        <span className={cn("absolute inset-x-3 top-0 text-[11px] font-bold tracking-[0.14em] text-muted-foreground/70 uppercase transition-opacity duration-200", expanded ? "opacity-100" : "opacity-0")}>
          Menu
        </span>
        <span className={cn("absolute top-1/2 left-1/2 h-px w-6 -translate-x-1/2 bg-border transition-opacity duration-200", expanded ? "opacity-0" : "opacity-100")} />
      </div>

      <nav aria-label="Dashboard" className="flex flex-col gap-1">
        {DASHBOARD_NAV.map((item) => (
          <NavLink key={item.key} item={item} active={item.key === current.key} expanded={expanded} onNavigate={onNavigate} />
        ))}
      </nav>

      {/* Agent status */}
      <div className="mt-auto pt-6">
        <div
          className={cn(
            "relative flex items-center gap-3 overflow-hidden rounded-2xl p-2 transition-colors duration-300",
            expanded ? "bg-gradient-to-br from-primary to-brand-pink text-white shadow-lg shadow-primary/25" : "bg-transparent"
          )}
        >
          <span
            className={cn(
              "relative flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors duration-300",
              expanded ? "bg-white/15" : "bg-gradient-to-br from-primary to-brand-pink text-white shadow-md shadow-primary/30"
            )}
            title={expanded ? undefined : "AI agent online"}
          >
            <Bot className="size-[18px]" />
            <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-background bg-emerald-400" />
          </span>
          <FadeLabel expanded={expanded} className="min-w-0">
            <span className="block text-sm font-bold">AI agent</span>
            <span className="block text-xs text-white/75">Online · ready to create</span>
          </FadeLabel>
        </div>
      </div>
    </div>
  );
}

function NavLink({
  item,
  active,
  expanded,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  expanded: boolean;
  onNavigate?: () => void;
}) {
  const { Icon } = item;
  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      aria-label={expanded ? undefined : item.label}
      className={cn(
        "group relative flex h-[52px] items-center gap-3 rounded-2xl px-2 text-sm font-medium outline-none transition-colors duration-200 focus-visible:ring-3 focus-visible:ring-ring/40",
        active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      )}
    >
      {/* Active indicator on the sidebar edge */}
      <span
        className={cn(
          "absolute top-1/2 -left-4 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary transition-all duration-300",
          active ? "opacity-100" : "scale-y-0 opacity-0"
        )}
      />
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105 group-active:scale-95",
          active ? item.tileActive : item.tile
        )}
      >
        <Icon className="size-[18px]" strokeWidth={2.2} />
      </span>
      <FadeLabel expanded={expanded} className={cn(active && "font-bold")}>{item.label}</FadeLabel>
    </Link>
  );

  if (expanded) return link;

  return (
    <Tooltip>
      <TooltipTrigger render={link} />
      <TooltipContent side="right" sideOffset={14} className="rounded-lg px-2.5 py-1.5 font-semibold">
        {item.label}
      </TooltipContent>
    </Tooltip>
  );
}

function FadeLabel({ expanded, className, children }: { expanded: boolean; className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "truncate whitespace-nowrap transition-all duration-200",
        expanded ? "translate-x-0 opacity-100 delay-75" : "pointer-events-none -translate-x-1 opacity-0",
        className
      )}
    >
      {children}
    </span>
  );
}

export function SidebarToggle({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={onToggle}
            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
            aria-expanded={expanded}
            className="absolute top-[27px] -right-3.5 z-10 flex size-7 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-all hover:scale-110 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
          />
        }
      >
        <ChevronLeft className={cn("size-4 transition-transform duration-300", !expanded && "rotate-180")} />
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8} className="rounded-lg px-2.5 py-1.5">
        {expanded ? "Collapse" : "Expand"} <Kbd>⌘B</Kbd>
      </TooltipContent>
    </Tooltip>
  );
}
