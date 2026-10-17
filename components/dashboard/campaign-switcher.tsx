"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "cn";
import { setActiveCampaign } from "@/app/actions/campaign";
import { CampaignIcon } from "@/components/campaign/campaign-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import type { CampaignSummary } from "./types";

export function CampaignSwitcher({
  campaigns,
  activeId,
  expanded,
}: {
  campaigns: CampaignSummary[];
  activeId: string;
  expanded: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const active = campaigns.find((c) => c.id === activeId) ?? campaigns[0];

  function switchTo(id: string) {
    if (id === activeId) return;
    startTransition(async () => {
      await setActiveCampaign(id);
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Campaign: ${active.name}. Switch campaign`}
        className={cn(
          "group flex h-[52px] w-full items-center gap-3 rounded-2xl px-2 text-left transition-colors outline-none hover:bg-muted/70 focus-visible:ring-3 focus-visible:ring-ring/40 data-[popup-open]:bg-muted/70",
          expanded && "border bg-background shadow-xs"
        )}
      >
        <span className="relative">
          <CampaignIcon icon={active.icon} iconUrl={active.iconUrl} className="size-9 rounded-[10px]" />
          {pending && (
            <span className="absolute inset-0 flex items-center justify-center rounded-[10px] bg-background/70">
              <Spinner className="size-3.5" />
            </span>
          )}
        </span>
        <span className={cn("min-w-0 flex-1 transition-all duration-200", expanded ? "opacity-100" : "pointer-events-none -translate-x-1 opacity-0")}>
          <span className="block truncate text-sm font-bold">{active.name}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {campaigns.length} campaign{campaigns.length === 1 ? "" : "s"}
          </span>
        </span>
        <ChevronsUpDown
          className={cn("size-4 shrink-0 text-muted-foreground transition-opacity", expanded ? "opacity-100" : "opacity-0")}
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side={expanded ? "bottom" : "right"}
        align="start"
        sideOffset={8}
        className="w-72 rounded-2xl p-1.5 shadow-xl"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 pt-1.5 pb-2 text-[11px] font-bold tracking-[0.12em] uppercase">
            Your campaigns
          </DropdownMenuLabel>
          {campaigns.map((campaign) => {
            const isActive = campaign.id === activeId;
            return (
              <DropdownMenuItem
                key={campaign.id}
                onClick={() => switchTo(campaign.id)}
                className={cn("gap-3 rounded-xl px-2 py-2", isActive && "bg-accent/60")}
              >
                <CampaignIcon icon={campaign.icon} iconUrl={campaign.iconUrl} className="size-8 rounded-lg shadow-none" />
                <span className="min-w-0 flex-1 truncate font-medium">{campaign.name}</span>
                {isActive && <Check className="size-4 text-primary" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="my-1.5" />
        <DropdownMenuItem onClick={() => router.push("/create-campaign?new=1")} className="gap-3 rounded-xl px-2 py-2">
          <span className="flex size-8 items-center justify-center rounded-lg border border-dashed border-primary/40 bg-primary/5 text-primary">
            <Plus className="size-4" />
          </span>
          <span className="flex-1 font-semibold">Create new campaign</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
