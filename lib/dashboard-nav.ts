import {
  AtSign,
  BarChart3,
  Bot,
  CalendarDays,
  FileText,
  LayoutDashboard,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  key: string;
  label: string;
  href: string;
  Icon: LucideIcon;
  description: string;
  /** Tailwind classes for the icon tile: idle state and active state. */
  tile: string;
  tileActive: string;
};

// Class strings are written out in full so Tailwind can detect them.
export const DASHBOARD_NAV: NavItem[] = [
  {
    key: "overview",
    label: "Overview",
    href: "/dashboard",
    Icon: LayoutDashboard,
    description: "A snapshot of your campaign and your agent's progress.",
    // Follows the user's theme color.
    tile: "bg-primary/12 text-primary",
    tileActive: "bg-gradient-to-br from-primary to-brand-pink text-white shadow-lg shadow-primary/35",
  },
  {
    key: "agent",
    label: "AI Agent",
    href: "/dashboard/agent",
    Icon: Bot,
    description: "Train your agent's brand voice, goals and posting style.",
    tile: "bg-fuchsia-500/12 text-fuchsia-600 dark:text-fuchsia-300",
    tileActive: "bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white shadow-lg shadow-fuchsia-500/35",
  },
  {
    key: "posts",
    label: "Posts",
    href: "/dashboard/posts",
    Icon: FileText,
    description: "Review, edit and approve the posts your agent drafts.",
    tile: "bg-sky-500/12 text-sky-600 dark:text-sky-300",
    tileActive: "bg-gradient-to-br from-sky-500 to-blue-500 text-white shadow-lg shadow-sky-500/35",
  },
  {
    key: "calendar",
    label: "Calendar",
    href: "/dashboard/calendar",
    Icon: CalendarDays,
    description: "See everything scheduled across your channels at a glance.",
    tile: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
    tileActive: "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/35",
  },
  {
    key: "analytics",
    label: "Analytics",
    href: "/dashboard/analytics",
    Icon: BarChart3,
    description: "Track reach, engagement and what's resonating with your audience.",
    tile: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300",
    tileActive: "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/35",
  },
  {
    key: "accounts",
    label: "Accounts",
    href: "/dashboard/accounts",
    Icon: AtSign,
    description: "Connect LinkedIn, X, Instagram and Facebook to start publishing.",
    tile: "bg-rose-500/12 text-rose-600 dark:text-rose-300",
    tileActive: "bg-gradient-to-br from-rose-500 to-red-500 text-white shadow-lg shadow-rose-500/35",
  },
  {
    key: "settings",
    label: "Settings",
    href: "/dashboard/settings",
    Icon: Settings,
    description: "Manage your campaign, team and account preferences.",
    tile: "bg-slate-500/12 text-slate-600 dark:text-slate-300",
    tileActive: "bg-gradient-to-br from-slate-600 to-slate-800 text-white shadow-lg shadow-slate-500/35",
  },
];

export function navItemForPath(pathname: string) {
  return (
    DASHBOARD_NAV.find((item) => item.href !== "/dashboard" && pathname.startsWith(item.href)) ??
    DASHBOARD_NAV[0]
  );
}

export const SIDEBAR_COOKIE = "sidebar_expanded";
export const ACTIVE_CAMPAIGN_COOKIE = "active_campaign";
