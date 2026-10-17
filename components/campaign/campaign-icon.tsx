import { Megaphone } from "lucide-react";
import { cn } from "cn";
import { CAMPAIGN_ICONS, isCampaignIconKey } from "@/lib/campaign-icons";

/** Renders a campaign's preset icon or uploaded custom icon inside a rounded tile. */
export function CampaignIcon({
  icon,
  iconUrl,
  className,
}: {
  icon?: string | null;
  iconUrl?: string | null;
  className?: string;
}) {
  const Icon = isCampaignIconKey(icon) ? CAMPAIGN_ICONS[icon].Icon : Megaphone;

  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary to-brand-pink text-white shadow-md shadow-primary/25",
        className
      )}
    >
      {iconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- user-uploaded icon on the InsForge host
        <img src={iconUrl} alt="" className="size-full bg-background object-cover" />
      ) : (
        <Icon className="size-1/2" aria-hidden="true" />
      )}
    </span>
  );
}
