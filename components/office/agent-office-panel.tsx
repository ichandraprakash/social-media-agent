import Image from "next/image";
import { existsSync } from "node:fs";
import path from "node:path";
import { ImageOff } from "lucide-react";
import { AgentOffice } from "@/components/office/agent-office";
import { loadOfficeScene, officeKeyFromImage } from "@/lib/office-studio";

/**
 * Server wrapper: picks the scene bundle for a campaign's office
 * (/offices/day-office.jpeg -> /office-studio/day-office.json) and renders it in its card frame.
 * Falls back to the static office image, then to an empty state.
 *
 * Inside an AgentSelectionProvider, clicking an agent in the office selects it.
 */
export async function AgentOfficePanel({ officeImage, className }: { officeImage: string; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-3xl border bg-background p-2 shadow-[0_1px_2px_rgb(0_0_0/0.03),0_8px_24px_-12px_rgb(0_0_0/0.08)] ${className ?? ""}`}>
      <OfficeScene officeImage={officeImage} className="rounded-[1.25rem]" />
    </div>
  );
}

async function OfficeScene({ officeImage, className }: { officeImage: string; className: string }) {
  const key = officeKeyFromImage(officeImage);
  const scene = key ? await loadOfficeScene(key) : null;

  if (scene) {
    return (
      <AgentOffice scene={scene} className={className}>
        <span
          className="absolute top-[1.4em] left-[1.4em] z-50 inline-flex items-center gap-[0.6em] rounded-full border border-white/20 bg-black/35 px-[0.9em] py-[0.45em] font-semibold text-white shadow-lg backdrop-blur-md"
          style={{ fontSize: "clamp(8px, 1.15cqw, 12px)" }}
        >
          <span className="relative flex size-[0.65em]">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex size-full rounded-full bg-emerald-400" />
          </span>
          {scene.seats.length} agent{scene.seats.length === 1 ? "" : "s"} at work
        </span>
      </AgentOffice>
    );
  }

  if (existsSync(path.join(process.cwd(), "public", officeImage))) {
    return (
      <div className={`relative aspect-[4/3] w-full overflow-hidden bg-muted ${className ?? ""}`}>
        <Image src={officeImage} alt="Your AI agent's office" fill sizes="(min-width: 1280px) 50vw, 100vw" className="object-cover" />
      </div>
    );
  }

  return (
    <div className={`flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 bg-muted/50 text-center ${className ?? ""}`}>
      <ImageOff className="size-6 text-muted-foreground" />
      <p className="text-sm font-semibold">Office unavailable</p>
      <p className="max-w-xs text-xs text-muted-foreground">This campaign&apos;s office image is no longer available.</p>
    </div>
  );
}
