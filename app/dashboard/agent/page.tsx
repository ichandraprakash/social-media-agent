import type { Metadata } from "next";
import { AgentWorkspace } from "@/components/agents/agent-workspace";
import { AgentOfficePanel } from "@/components/office/agent-office-panel";
import { AgentSelectionProvider } from "@/components/office/agent-selection";
import { loadAgentAvatars } from "@/lib/office-studio";
import { requireDashboardContext, toUserSummary } from "@/lib/session";

export const metadata: Metadata = { title: "AI Agents" };

export default async function AgentPage() {
  const { user, campaign } = await requireDashboardContext();

  return (
    <AgentSelectionProvider defaultSelected="research">
      <AgentWorkspace
        avatars={await loadAgentAvatars(campaign.officeImage)}
        user={toUserSummary(user)}
        office={<AgentOfficePanel officeImage={campaign.officeImage} />}
      />
    </AgentSelectionProvider>
  );
}
