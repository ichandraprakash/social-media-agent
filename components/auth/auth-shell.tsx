import Image from "next/image";
import { CalendarClock, Sparkles, TrendingUp } from "lucide-react";
import { BRAND_NAME, Logo } from "@/components/brand/logo";

const HIGHLIGHTS = [
  { Icon: Sparkles, text: "On-brand posts drafted in seconds" },
  { Icon: CalendarClock, text: "A content calendar that plans itself" },
  { Icon: TrendingUp, text: "Insights that sharpen every post" },
];

export function AuthShell({
  children,
  image,
}: {
  children: React.ReactNode;
  image?: { src: string; label: string };
}) {
  return (
    <div className="grid min-h-svh bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* Form column */}
      <div className="relative flex flex-col px-5 py-6 sm:px-10">
        <div className="pointer-events-none absolute inset-0 bg-aurora opacity-60 lg:opacity-40" />
        <Logo className="relative" />
        <main className="relative flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[400px]">{children}</div>
        </main>
        <p className="relative text-center text-xs text-muted-foreground lg:text-left">
          © {new Date().getFullYear()} {BRAND_NAME}
        </p>
      </div>

      {/* Showcase column */}
      <aside className="relative hidden p-3 lg:block">
        <div className="relative h-full overflow-hidden rounded-[2rem] bg-brand-night text-white">
          {image && (
            <Image src={image.src} alt="" fill priority sizes="55vw" className="object-cover opacity-90" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-brand-night via-brand-night/40 to-brand-night/10" />
          <div className="absolute inset-0 bg-[radial-gradient(50%_40%_at_80%_10%,color-mix(in_oklch,var(--primary)_35%,transparent),transparent)]" />

          {/* Floating status card */}
          <div className="animate-float absolute top-10 right-10 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 shadow-2xl backdrop-blur-xl">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400" />
            </span>
            <div>
              <p className="text-sm font-semibold">Your agent is online</p>
              <p className="text-xs text-white/60">{image?.label ?? "Creative Hub"}</p>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-10 xl:p-14">
            <h2 className="max-w-md text-3xl leading-tight font-extrabold tracking-tight text-balance xl:text-4xl">
              Meet the AI team behind your social media.
            </h2>
            <ul className="mt-7 flex flex-col gap-3">
              {HIGHLIGHTS.map(({ Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-white/85">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur">
                    <Icon className="size-4 text-brand-amber" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>
    </div>
  );
}
