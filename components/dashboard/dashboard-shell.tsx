"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { cn } from "cn";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SIDEBAR_COOKIE } from "@/lib/dashboard-nav";
import { DashboardHeader } from "./dashboard-header";
import { SidebarContent, SidebarToggle } from "./sidebar";
import type { CampaignSummary, UserSummary } from "./types";

export function DashboardShell({
  user,
  campaigns,
  activeCampaignId,
  defaultExpanded,
  children,
}: {
  user: UserSummary;
  campaigns: CampaignSummary[];
  activeCampaignId: string;
  defaultExpanded: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeCampaign = campaigns.find((c) => c.id === activeCampaignId) ?? campaigns[0];

  const toggle = useCallback(() => {
    setExpanded((value) => {
      const next = !value;
      // Persist so the server renders the same state on the next visit (no layout flash).
      document.cookie = `${SIDEBAR_COOKIE}=${next ? 1 : 0}; path=/; max-age=31536000; samesite=lax`;
      return next;
    });
  }, []);

  // ⌘B / Ctrl+B toggles the sidebar.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "b" || !(event.metaKey || event.ctrlKey)) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable=true]")) return;
      event.preventDefault();
      toggle();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  return (
    <TooltipProvider delay={150}>
      <div className="min-h-svh bg-muted/40">
        {/* Desktop sidebar */}
        <aside
          data-expanded={expanded}
          className={cn(
            "fixed inset-y-0 left-0 z-30 hidden border-r bg-background/85 backdrop-blur-xl transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] lg:block",
            expanded ? "w-[264px]" : "w-[84px]"
          )}
        >
          <SidebarToggle expanded={expanded} onToggle={toggle} />
          <div className="h-full overflow-x-hidden overflow-y-auto">
            <SidebarContent expanded={expanded} campaigns={campaigns} activeCampaignId={activeCampaign.id} />
          </div>
        </aside>

        {/* Mobile sidebar */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" showCloseButton={false} className="w-[280px] max-w-[85vw] gap-0 p-0 sm:max-w-[280px]">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarContent
              expanded
              campaigns={campaigns}
              activeCampaignId={activeCampaign.id}
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <div
          className={cn(
            "flex min-h-svh flex-col transition-[padding] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
            expanded ? "lg:pl-[264px]" : "lg:pl-[84px]"
          )}
        >
          <DashboardHeader user={user} campaignName={activeCampaign.name} onOpenMobileNav={() => setMobileOpen(true)} />
          <main
            key={`${pathname}:${activeCampaign.id}`}
            className="w-full max-w-[1680px] flex-1 px-4 py-6 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out sm:px-8 sm:py-8"
          >
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
