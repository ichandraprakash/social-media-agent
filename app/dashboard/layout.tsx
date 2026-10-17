import { cookies } from "next/headers";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SIDEBAR_COOKIE } from "@/lib/dashboard-nav";
import { requireDashboardContext, toUserSummary } from "@/lib/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, campaigns, campaign } = await requireDashboardContext();
  // Collapsed (icons only) by default; remembers the user's choice.
  const expanded = (await cookies()).get(SIDEBAR_COOKIE)?.value === "1";

  return (
    <DashboardShell
      user={toUserSummary(user)}
      campaigns={campaigns.map(({ id, name, icon, iconUrl }) => ({ id, name, icon, iconUrl }))}
      activeCampaignId={campaign.id}
      defaultExpanded={expanded}
    >
      {children}
    </DashboardShell>
  );
}
