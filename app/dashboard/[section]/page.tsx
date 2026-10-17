import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { cn } from "cn";
import { ButtonLink } from "@/components/ui/button-link";
import { DASHBOARD_NAV } from "@/lib/dashboard-nav";

// Placeholder for dashboard sections that aren't built yet.
const SECTIONS = DASHBOARD_NAV.filter((item) => item.key !== "overview");

function findSection(key: string) {
  return SECTIONS.find((item) => item.key === key);
}

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }): Promise<Metadata> {
  const section = findSection((await params).section);
  return { title: section?.label ?? "Not found" };
}

export default async function SectionPlaceholderPage({ params }: { params: Promise<{ section: string }> }) {
  const section = findSection((await params).section);
  if (!section) notFound();

  const { Icon } = section;

  return (
    <div className="relative flex min-h-[calc(100svh-12rem)] items-center justify-center overflow-hidden rounded-3xl border bg-background px-6 py-16">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(50%_50%_at_50%_45%,black,transparent)]" />
      <div className="relative flex max-w-md flex-col items-center text-center">
        <span className="relative">
          <span className={cn("absolute inset-0 scale-150 rounded-full opacity-40 blur-2xl", section.tileActive)} />
          <span className={cn("animate-float relative flex size-20 items-center justify-center rounded-[1.75rem]", section.tileActive)}>
            <Icon className="size-9" strokeWidth={2} />
          </span>
        </span>
        <span className="mt-8 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          <Sparkles className="size-3.5" /> Coming soon
        </span>
        <h2 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">{section.label}</h2>
        <p className="mt-2 text-muted-foreground">{section.description}</p>
        <ButtonLink href="/dashboard" variant="outline" className="mt-8 h-10 rounded-xl px-4 font-semibold">
          <ArrowLeft data-icon="inline-start" />
          Back to overview
        </ButtonLink>
      </div>
    </div>
  );
}
