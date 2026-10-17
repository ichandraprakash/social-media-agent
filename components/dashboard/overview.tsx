import Link from "next/link";
import { ArrowRight, Check, FileClock, Plus, Rocket } from "lucide-react";
import { cn } from "cn";
import { CampaignIcon } from "@/components/campaign/campaign-icon";
import { Greeting } from "@/components/dashboard/greeting";
import { ButtonLink } from "@/components/ui/button-link";

import type { Campaign } from "@/db/schema";

type OverviewCampaign = Pick<Campaign, "name" | "icon" | "iconUrl" | "createdAt">;

/** Overview cards: campaign status, upcoming posts and recent activity (the dashboard's left column). */
export function Overview({ firstName, campaign }: { firstName: string; campaign: OverviewCampaign }) {
  // Setup progress. Only "campaign created" can be true until posts/accounts exist.
  const steps = [
    { label: "Create campaign", done: true, href: null },
    { label: "Connect a social account", done: false, href: "/dashboard/accounts" },
    { label: "Create your first post", done: false, href: "/dashboard/posts" },
    { label: "Schedule a post", done: false, href: "/dashboard/calendar" },
  ];
  const completed = steps.filter((s) => s.done).length;
  const progress = Math.round((completed / steps.length) * 100);
  const nextStep = steps.find((s) => !s.done);

  // Real events only. More types (posts, publishing) will be added as features land.
  const activity = [
    { title: "Campaign created", body: `“${campaign.name}” is set up with its AI team.`, at: campaign.createdAt, Icon: Rocket },
  ];

  return (
    <>
      <section className="pb-1" style={stagger(0)}>
        <Greeting firstName={firstName} />
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-balance sm:text-[2.5rem] sm:leading-[1.1]">
          Your AI Creative Team is on it.
        </h2>
        <p className="mt-3 max-w-lg text-[15px] text-muted-foreground">
          From trends to content to posting, your agents work together to turn ideas into real growth.
        </p>
      </section>

      {/* Campaign status */}
      <Card style={stagger(1)}>
        <div className="flex items-start gap-4">
          <CampaignIcon icon={campaign.icon} iconUrl={campaign.iconUrl} className="size-16 rounded-2xl [&_svg]:size-7" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-bold">{campaign.name}</h3>
              <StatusBadge inProgress={completed > 1} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Your AI team is set up and ready. Finish setup so your agents can start researching, creating and scheduling.
            </p>
          </div>
          <div className="hidden shrink-0 text-right sm:block">
            <p className="text-3xl font-extrabold tracking-tight tabular-nums">{progress}%</p>
            <p className="text-xs font-medium text-muted-foreground">Setup complete</p>
          </div>
        </div>

        <ol className="mt-5 grid grid-cols-4 gap-1.5" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Campaign setup">
          {steps.map((step) => (
            <li key={step.label} className="flex min-w-0 flex-col gap-2">
              <span className="h-2 overflow-hidden rounded-full bg-muted">
                <span className={cn("block h-full rounded-full bg-gradient-to-r from-primary to-brand-pink transition-all duration-700", step.done ? "w-full" : "w-0")} />
              </span>
              <span className={cn("hidden items-start gap-1 text-[11px] leading-tight text-muted-foreground sm:flex", step.done && "font-semibold text-foreground")}>
                {step.done && <Check className="size-3 shrink-0 text-emerald-500" strokeWidth={3} />}
                {step.label}
              </span>
            </li>
          ))}
        </ol>
        {nextStep?.href && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-muted/50 px-4 py-3">
            <span className="text-xs text-muted-foreground">
              <span className="sm:hidden">{progress}% complete · </span>Next step
            </span>
            <Link href={nextStep.href} className="group inline-flex items-center gap-1 text-sm font-semibold text-primary">
              {nextStep.label}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        )}
      </Card>

      {/* Upcoming posts */}
      <Card style={stagger(2)}>
        <CardHeader title="Upcoming Posts" href="/dashboard/calendar" linkLabel="View calendar" />
        <EmptyState
          illustration={<CalendarIllustration />}
          title="No posts scheduled yet"
          body="Schedule your first post and it will show up here."
          action={
            <ButtonLink href="/dashboard/posts" className="mt-5 h-10 rounded-xl px-5 font-semibold shadow-md shadow-primary/25 transition-transform hover:-translate-y-px">
              <Plus data-icon="inline-start" />
              Create post
            </ButtonLink>
          }
        />
      </Card>

      {/* Recent activity */}
      <Card style={stagger(3)}>
        <CardHeader title="Recent Activity" />
        <ol className="mt-5 flex flex-col">
          {activity.map(({ title, body, at, Icon }) => (
            <li key={title} className="flex gap-3.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold">{title}</p>
                  <time dateTime={at.toISOString()} className="shrink-0 text-xs text-muted-foreground">{formatRelative(at)}</time>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{body}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-dashed bg-muted/30 px-4 py-3.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-background text-muted-foreground shadow-xs">
            <FileClock className="size-4" />
          </span>
          <p className="text-xs text-muted-foreground">
            As your agents research, draft and publish, their work will appear here.
          </p>
        </div>
      </Card>
    </>
  );
}

function stagger(index: number): React.CSSProperties {
  return { animation: `fade-up 600ms cubic-bezier(0.2, 0.8, 0.2, 1) ${index * 80}ms both` };
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <section
      style={style}
      className="rounded-3xl border bg-background p-5 shadow-[0_1px_2px_rgb(0_0_0/0.03),0_8px_24px_-12px_rgb(0_0_0/0.08)] transition-shadow duration-300 hover:shadow-[0_1px_2px_rgb(0_0_0/0.04),0_16px_32px_-16px_rgb(0_0_0/0.14)] sm:p-6"
    >
      {children}
    </section>
  );
}

function CardHeader({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-base font-bold">{title}</h3>
      {href && (
        <Link href={href} className="group inline-flex items-center gap-1 text-sm font-semibold text-primary">
          {linkLabel}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

function StatusBadge({ inProgress }: { inProgress: boolean }) {
  return inProgress ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
      <span className="size-1.5 rounded-full bg-emerald-500" /> In progress
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-500 opacity-60" />
        <span className="relative inline-flex size-1.5 rounded-full bg-amber-500" />
      </span>
      Getting started
    </span>
  );
}

function EmptyState({
  illustration,
  title,
  body,
  action,
}: {
  illustration: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-4 pt-6 pb-2 text-center">
      {illustration}
      <p className="mt-5 text-[15px] font-bold">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{body}</p>
      {action}
    </div>
  );
}

function CalendarIllustration() {
  return (
    <div className="relative flex size-24 items-center justify-center">
      <span className="absolute inset-2 rounded-full bg-primary/10 blur-xl" />
      {/* Sparkle rays */}
      {[
        "top-1 left-3 -rotate-45",
        "top-0 left-1/2 -translate-x-1/2",
        "top-1 right-3 rotate-45",
        "top-1/2 -left-1 -translate-y-1/2 rotate-90",
        "top-1/2 -right-1 -translate-y-1/2 rotate-90",
      ].map((pos) => (
        <span key={pos} className={cn("absolute h-2.5 w-[3px] rounded-full bg-brand-amber", pos)} />
      ))}
      <span className="animate-float relative flex size-16 flex-col overflow-hidden rounded-2xl bg-background shadow-lg ring-1 ring-primary/15">
        <span className="flex h-4 items-center justify-center gap-3 bg-gradient-to-r from-primary to-brand-pink">
          <span className="size-1 rounded-full bg-white/80" />
          <span className="size-1 rounded-full bg-white/80" />
        </span>
        <span className="grid flex-1 grid-cols-3 gap-1 p-2">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} className={cn("rounded-[3px]", i === 4 ? "bg-brand-pink" : "bg-primary/15")} />
          ))}
        </span>
      </span>
    </div>
  );
}

function formatRelative(date: Date) {
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return "just now";
}
