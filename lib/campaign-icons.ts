import {
  Briefcase,
  Camera,
  Coffee,
  Gamepad2,
  Globe,
  Heart,
  Leaf,
  Megaphone,
  Music,
  Palette,
  Rocket,
  ShoppingBag,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
  type LucideIcon,
} from "lucide-react";

export const CAMPAIGN_ICONS = {
  rocket: { label: "Rocket", Icon: Rocket },
  megaphone: { label: "Megaphone", Icon: Megaphone },
  sparkles: { label: "Sparkles", Icon: Sparkles },
  "trending-up": { label: "Growth", Icon: TrendingUp },
  target: { label: "Target", Icon: Target },
  zap: { label: "Lightning", Icon: Zap },
  heart: { label: "Heart", Icon: Heart },
  camera: { label: "Camera", Icon: Camera },
  "shopping-bag": { label: "Shopping", Icon: ShoppingBag },
  coffee: { label: "Coffee", Icon: Coffee },
  briefcase: { label: "Business", Icon: Briefcase },
  globe: { label: "Globe", Icon: Globe },
  music: { label: "Music", Icon: Music },
  gamepad: { label: "Gaming", Icon: Gamepad2 },
  palette: { label: "Design", Icon: Palette },
  leaf: { label: "Nature", Icon: Leaf },
} satisfies Record<string, { label: string; Icon: LucideIcon }>;

export type CampaignIconKey = keyof typeof CAMPAIGN_ICONS;

export function isCampaignIconKey(value: unknown): value is CampaignIconKey {
  return typeof value === "string" && Object.hasOwn(CAMPAIGN_ICONS, value);
}

export const CAMPAIGN_ICON_BUCKET = "campaign-icons";
export const MAX_ICON_BYTES = 2 * 1024 * 1024;
export const ICON_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const CAMPAIGN_NAME_MAX = 50;
