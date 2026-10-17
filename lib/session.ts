import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import type { UserSummary } from "@/components/dashboard/types";
import { getActiveCampaign } from "@/lib/campaigns";
import { createInsForgeServerClient } from "@/lib/insforge/server";

/** Current InsForge user for this request (deduplicated across layout and page). */
export const getCurrentUser = cache(async () => {
  const insforge = await createInsForgeServerClient();
  const { data } = await insforge.auth.getCurrentUser();
  return data?.user ?? null;
});

/**
 * Signed-in user plus their campaigns for dashboard routes.
 * Redirects to sign-in, or to onboarding when the user has no campaign yet.
 */
export const requireDashboardContext = cache(async (next = "/dashboard") => {
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(next)}`);

  const { campaigns, active } = await getActiveCampaign(user.id);
  if (!active) redirect("/create-campaign");

  return { user, campaigns, campaign: active };
});

/** Display name, initials and avatar for the signed-in user. */
export function toUserSummary(user: { email: string; profile?: unknown }): UserSummary {
  const profile = user.profile as { name?: string; avatar_url?: string } | null;
  const name = profile?.name || user.email.split("@")[0];
  const initials = name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return { name, email: user.email, avatarUrl: profile?.avatar_url, initials };
}
