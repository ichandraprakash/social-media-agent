import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CreateCampaignWizard } from "@/components/campaign/create-campaign-wizard";
import { getCampaign, listOfficeImages } from "@/lib/campaigns";
import { createInsForgeServerClient } from "@/lib/insforge/server";

export const metadata: Metadata = { title: "Create your campaign" };

export default async function CreateCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const insforge = await createInsForgeServerClient();
  const { data } = await insforge.auth.getCurrentUser();
  const user = data?.user;
  if (!user) redirect("/sign-in?next=/create-campaign");

  // Onboarding is skipped for users who already have a campaign,
  // unless they explicitly asked for another one from the switcher.
  const hasCampaign = Boolean(await getCampaign(user.id));
  const { new: wantsNew } = await searchParams;
  if (hasCampaign && !wantsNew) redirect("/dashboard");

  return <CreateCampaignWizard offices={await listOfficeImages()} isAdditional={hasCampaign} />;
}
