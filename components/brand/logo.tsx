import Link from "next/link";
import { cn } from "cn";

export const BRAND_NAME = "Social Agent";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-primary via-primary to-brand-pink text-primary-foreground shadow-[0_6px_16px_-6px] shadow-primary/60",
        className
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-[55%]">
        <path d="M4 12.5 19.5 4l-4 16-4.2-6.3L4 12.5Z" fill="currentColor" fillOpacity=".95" />
        <path d="m11.3 13.7 8.2-9.7" stroke="currentColor" strokeOpacity=".45" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function Logo({ href = "/", className, inverted }: { href?: string; className?: string; inverted?: boolean }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5 font-bold tracking-tight", inverted && "text-white", className)}>
      <LogoMark />
      <span className="text-[17px]">{BRAND_NAME}</span>
    </Link>
  );
}
