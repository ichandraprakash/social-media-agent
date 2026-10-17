"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { Bell, ChevronDown, LogOut, Menu, Plus, Settings } from "lucide-react";
import { cn } from "cn";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
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
import { navItemForPath } from "@/lib/dashboard-nav";
import { ThemeColorPicker } from "./theme-color-picker";
import type { UserSummary } from "./types";

export function DashboardHeader({
  user,
  campaignName,
  onOpenMobileNav,
}: {
  user: UserSummary;
  campaignName: string;
  onOpenMobileNav: () => void;
}) {
  const pathname = usePathname();
  const section = navItemForPath(pathname);

  return (
    <header className="sticky top-0 z-20 border-b bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-[72px] items-center gap-3 px-4 sm:px-8">
        <Button variant="outline" size="icon" className="size-10 rounded-xl lg:hidden" onClick={onOpenMobileNav} aria-label="Open navigation">
          <Menu />
        </Button>

        <div className="min-w-0 flex-1">
          <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 text-xs font-medium text-muted-foreground sm:flex">
            <span className="truncate">{campaignName}</span>
            <span aria-hidden="true">/</span>
            <span className="text-foreground/80">{section.label}</span>
          </nav>
          <h1 key={section.key} className="truncate text-lg font-extrabold tracking-tight animate-in fade-in slide-in-from-left-1 duration-300 sm:text-xl">
            {section.label}
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ButtonLink
            href="/dashboard/posts"
            className="hidden h-10 rounded-xl px-4 font-semibold shadow-md shadow-primary/20 transition-transform hover:-translate-y-px sm:inline-flex"
          >
            <Plus data-icon="inline-start" />
            Create post
          </ButtonLink>
          <NotificationsMenu />
          <ThemeColorPicker />
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}

function NotificationsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Notifications"
        className="flex size-10 items-center justify-center rounded-xl border bg-background text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 data-[popup-open]:bg-muted"
      >
        <Bell className="size-[18px]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} className="w-80 rounded-2xl p-0 shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-bold">Notifications</span>
        </div>
        <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Bell className="size-5" />
          </span>
          <p className="text-sm font-semibold">You&apos;re all caught up</p>
          <p className="text-xs text-muted-foreground">Updates from your AI agent will appear here.</p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserMenu({ user }: { user: UserSummary }) {
  const [signingOut, startSignOut] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="flex h-10 items-center gap-2.5 rounded-xl pr-2 pl-1 transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 data-[popup-open]:bg-muted"
      >
        <UserAvatar user={user} />
        <span className="hidden max-w-36 truncate text-sm font-semibold md:block">{user.name}</span>
        <ChevronDown className="hidden size-4 text-muted-foreground md:block" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} className="w-64 rounded-2xl p-1.5 shadow-xl">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-3 px-2 py-2">
            <UserAvatar user={user} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-foreground">{user.name}</span>
              <span className="block truncate text-xs font-normal">{user.email}</span>
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="my-1.5" />
        <DropdownMenuItem className="gap-2.5 rounded-xl px-2 py-2" render={<Link href="/dashboard/settings" />}>
          <Settings />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          className="gap-2.5 rounded-xl px-2 py-2"
          closeOnClick={false}
          onClick={() => startSignOut(() => signOut())}
        >
          {signingOut ? <Spinner /> : <LogOut />}
          {signingOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserAvatar({ user, className }: { user: UserSummary; className?: string }) {
  if (user.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- OAuth provider avatar on an external host
      <img src={user.avatarUrl} alt="" referrerPolicy="no-referrer" className={cn("size-8 shrink-0 rounded-full object-cover ring-2 ring-background", className)} />
    );
  }
  return (
    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-brand-pink text-[11px] font-bold text-white", className)}>
      {user.initials}
    </span>
  );
}
