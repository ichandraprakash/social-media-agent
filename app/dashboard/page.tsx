import type { Metadata } from "next";
import { AgentWorkspace } from "@/components/agents/agent-workspace";
import { Overview } from "@/components/dashboard/overview";
import { AgentOfficePanel } from "@/components/office/agent-office-panel";
import { AgentSelectionProvider } from "@/components/office/agent-selection";
import { loadAgentAvatars } from "@/lib/office-studio";
import { requireDashboardContext, toUserSummary } from "@/lib/session";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage() {
  const { user, campaign } = await requireDashboardContext();
  const summary = toUserSummary(user);

  // Clicking an agent in the office opens its chat in place of the overview (no navigation).
  return (
    <AgentSelectionProvider>
      <AgentWorkspace
        avatars={await loadAgentAvatars(campaign.officeImage)}
        user={summary}
        office={<AgentOfficePanel officeImage={campaign.officeImage} />}
        overview={<Overview firstName={summary.name.split(" ")[0]} campaign={campaign} />}
      />
    </AgentSelectionProvider>
  );
}
