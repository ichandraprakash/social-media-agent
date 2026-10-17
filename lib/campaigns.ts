import "server-only";

import { readdir } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import { desc, eq } from "drizzle-orm";
import { campaigns, db } from "@/db";
import { ACTIVE_CAMPAIGN_COOKIE } from "@/lib/dashboard-nav";

const OFFICES_DIR = path.join(process.cwd(), "public", "offices");
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif"]);

export type OfficeOption = { src: string; label: string };

/** Latest campaign for a user, or null. Returns null (and logs) if the query fails. */
export async function getCampaign(authUserId: string) {
  try {
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.authUserId, authUserId))
      .orderBy(desc(campaigns.createdAt))
      .limit(1);
    return campaign ?? null;
  } catch (error) {
    console.error("Failed to load campaign", { authUserId, error });
    return null;
  }
}

/** All of a user's campaigns, newest first. */
export async function listCampaigns(authUserId: string) {
  try {
    return await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.authUserId, authUserId))
      .orderBy(desc(campaigns.createdAt));
  } catch (error) {
    console.error("Failed to list campaigns", { authUserId, error });
    return [];
  }
}

/** The campaign chosen in the switcher (cookie), falling back to the newest. */
export async function getActiveCampaign(authUserId: string) {
  const all = await listCampaigns(authUserId);
  const selectedId = (await cookies()).get(ACTIVE_CAMPAIGN_COOKIE)?.value;
  return { campaigns: all, active: all.find((c) => c.id === selectedId) ?? all[0] ?? null };
}

/** Where to send a user right after they authenticate. */
export async function postAuthDestination(authUserId: string, next = "/dashboard") {
  return (await getCampaign(authUserId)) ? next : "/create-campaign";
}

/** Office images available in public/offices, sorted by file name. */
export async function listOfficeImages(): Promise<OfficeOption[]> {
  try {
    const files = await readdir(OFFICES_DIR);
    return files
      .filter((file) => IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((file, i) => ({ src: `/offices/${file}`, label: officeLabel(file, i) }));
  } catch {
    return [];
  }
}

// Used when a file name isn't human-readable (e.g. generated hashes).
const FALLBACK_OFFICE_NAMES = [
  "Creative Hub",
  "Skyline Studio",
  "Neon Loft",
  "Night Shift Lab",
  "Idea Factory",
  "Growth Garage",
  "Content Café",
  "Launch Pad",
];

// "modern-loft.jpg" -> "Modern Loft"; "Gemini_Generated_Image_4zr0.png" -> "Creative Hub"
function officeLabel(file: string, index: number) {
  const words = path.parse(file).name.split(/[-_\s]+/).filter(Boolean);
  const readable =
    words.length > 0 &&
    words.length <= 4 &&
    words.every((w) => /^[a-z]{2,}$/i.test(w)) &&
    !words.some((w) => /^(image|img|generated|gemini|photo|screenshot|untitled)$/i.test(w));

  if (readable) return words.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  return FALLBACK_OFFICE_NAMES[index % FALLBACK_OFFICE_NAMES.length] + (index >= FALLBACK_OFFICE_NAMES.length ? ` ${Math.floor(index / FALLBACK_OFFICE_NAMES.length) + 1}` : "");
}
