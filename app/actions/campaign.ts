"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { campaigns, db } from "@/db";
import { CAMPAIGN_ICON_BUCKET, CAMPAIGN_NAME_MAX, isCampaignIconKey } from "@/lib/campaign-icons";
import { listOfficeImages } from "@/lib/campaigns";
import { ACTIVE_CAMPAIGN_COOKIE } from "@/lib/dashboard-nav";
import { createInsForgeServerClient } from "@/lib/insforge/server";

export type CreateCampaignInput = {
  name: string;
  icon?: string | null;
  /** Storage key of an uploaded custom icon in the campaign-icons bucket. */
  iconKey?: string | null;
  officeImage: string;
};

const ACTIVE_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

async function requireUser(next: string) {
  const insforge = await createInsForgeServerClient();
  const { data } = await insforge.auth.getCurrentUser();
  if (!data?.user) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  return data.user;
}

export async function createCampaign(input: CreateCampaignInput): Promise<{ error: string }> {
  const user = await requireUser("/create-campaign");

  const name = input.name?.trim() ?? "";
  if (!name) return { error: "Give your campaign a name." };
  if (name.length > CAMPAIGN_NAME_MAX) return { error: `Name must be ${CAMPAIGN_NAME_MAX} characters or fewer.` };

  const iconKey = input.iconKey?.trim() || null;
  const icon = iconKey ? null : input.icon;
  if (iconKey && !/^[\w.\-/]{1,200}$/.test(iconKey)) return { error: "Invalid icon upload. Please try again." };
  if (!iconKey && !isCampaignIconKey(icon)) return { error: "Choose an icon for your campaign." };

  const offices = await listOfficeImages();
  if (!offices.some((office) => office.src === input.officeImage)) {
    return { error: "Choose an office for your AI agent." };
  }

  // Build the public URL from the key so clients can't store arbitrary URLs.
  const iconUrl = iconKey
    ? `${process.env.NEXT_PUBLIC_INSFORGE_URL}/api/storage/buckets/${CAMPAIGN_ICON_BUCKET}/objects/${encodeURIComponent(iconKey)}`
    : null;

  let campaignId: string;
  try {
    const [created] = await db
      .insert(campaigns)
      .values({ authUserId: user.id, name, icon, iconUrl, iconKey, officeImage: input.officeImage })
      .returning({ id: campaigns.id });
    campaignId = created.id;
  } catch (error) {
    console.error("Failed to create campaign", { authUserId: user.id, error });
    return { error: "We couldn't save your campaign. Please try again." };
  }

  // Open the dashboard on the campaign that was just created.
  (await cookies()).set(ACTIVE_CAMPAIGN_COOKIE, campaignId, ACTIVE_COOKIE_OPTIONS);
  redirect("/dashboard");
}

/** Switch the dashboard to another of the user's campaigns. */
export async function setActiveCampaign(campaignId: string) {
  const user = await requireUser("/dashboard");

  const [owned] = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.authUserId, user.id)))
    .limit(1);
  if (!owned) return;

  (await cookies()).set(ACTIVE_CAMPAIGN_COOKIE, owned.id, ACTIVE_COOKIE_OPTIONS);
  revalidatePath("/dashboard", "layout");
}
