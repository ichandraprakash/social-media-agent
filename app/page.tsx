import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  Check,
  Facebook,
  Instagram,
  Layers,
  Linkedin,
  MessageSquareQuote,
  PenLine,
  Repeat2,
  Sparkles,
  Twitter,
  Wand2,
  Youtube,
} from "lucide-react";
import { BRAND_NAME, Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button-link";
import { listOfficeImages } from "@/lib/campaigns";

const PLATFORMS = [
  { name: "LinkedIn", Icon: Linkedin },
  { name: "X / Twitter", Icon: Twitter },
  { name: "Instagram", Icon: Instagram },
  { name: "Facebook", Icon: Facebook },
  { name: "YouTube Shorts", Icon: Youtube },
];

const FEATURES = [
  {
    Icon: Repeat2,
    title: "Repurpose everywhere",
    body: "Turn one idea into a LinkedIn post, an X thread and an Instagram caption, each in the right format.",
  },
  {
    Icon: CalendarClock,
    title: "Smart scheduling",
    body: "Your agent plans a content calendar and queues posts for the times your audience is most active.",
  },
  {
    Icon: MessageSquareQuote,
    title: "Your brand voice",
    body: "Agents learn your tone from past posts so every draft sounds like you, not like a robot.",
  },
  {
    Icon: BarChart3,
    title: "Insights that act",
    body: "See what's working and let your agent double down on the hooks and formats that perform.",
  },
  {
    Icon: Layers,
    title: "Campaign workspaces",
    body: "Keep every launch, client or brand in its own campaign with a dedicated AI agent and office.",
  },
];

const STEPS = [
  { title: "Create a campaign", body: "Name it, pick an icon, and tell us what you're promoting." },
  { title: "Choose your agent's office", body: "Give your AI agent a home. It's where your campaign comes to life." },
  { title: "Let your agent work", body: "Review drafts, approve with one click, and watch your calendar fill up." },
];

export default async function Home() {
  const offices = await listOfficeImages();
  const hero = offices[0];
  const secondary = offices[1] ?? offices[0];

  return (
    <div className="relative overflow-x-clip bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 bg-aurora" />
        <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]" />

        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 pt-16 pb-20 text-center sm:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full border bg-background/70 py-1 pr-3 pl-1 text-xs font-medium shadow-sm backdrop-blur">
            <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">New</span>
            AI agents for social media teams
          </span>

          <h1 className="mt-6 max-w-4xl text-4xl font-extrabold tracking-tight text-balance sm:text-6xl lg:text-7xl">
            Your social media team, <span className="text-gradient">powered by AI agents</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base text-pretty text-muted-foreground sm:text-lg">
            {BRAND_NAME} gives every campaign its own AI agent that writes, repurposes and schedules content
            across your channels, so you can focus on the ideas.
          </p>

          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
            <ButtonLink size="lg" className="h-12 rounded-full px-7 text-base shadow-lg shadow-primary/25" href="/sign-up">
              Start for free
              <ArrowRight data-icon="inline-end" />
            </ButtonLink>
            <ButtonLink size="lg" variant="outline" className="h-12 rounded-full px-7 text-base" href="#how-it-works">
              See how it works
            </ButtonLink>
          </div>

          <HeroVisual image={hero?.src} />
        </div>
      </section>

      {/* Platforms */}
      <section className="border-y bg-muted/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-8 sm:flex-row sm:justify-between">
          <span className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">Create content for</span>
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {PLATFORMS.map(({ name, Icon }) => (
              <li key={name} className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                <Icon className="size-4" aria-hidden="true" />
                {name}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24">
        <SectionHeading
          eyebrow="Features"
          title="Everything your content engine needs"
          body="From the first idea to the final post, your AI agent handles the busywork while you stay in control."
        />

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          <div className="relative overflow-hidden rounded-3xl border bg-card p-7 md:col-span-2 md:row-span-2">
            <FeatureIcon Icon={Wand2} />
            <h3 className="mt-5 text-xl font-bold">AI content writer</h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Hooks, captions, threads and hashtags drafted in seconds, tailored to each platform and your goals.
            </p>
            <ComposerMock />
          </div>
          {FEATURES.slice(0, 2).map((f) => <FeatureCard key={f.title} {...f} />)}
          {FEATURES.slice(2).map((f) => <FeatureCard key={f.title} {...f} />)}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 bg-muted/40 py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              eyebrow="How it works"
              title="Up and running in three steps"
              body="No complicated setup. Create a campaign, give your agent a workspace, and start publishing."
            />
            <ol className="mt-10 flex flex-col gap-6">
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-md shadow-primary/30">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-bold">{step.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-primary/20 via-brand-pink/10 to-brand-amber/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-3xl border bg-brand-night shadow-2xl">
              <div className="relative aspect-[4/3]">
                {secondary ? (
                  <Image src={secondary.src} alt="An AI agent's office" fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
                ) : null}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-night via-brand-night/70 to-transparent p-6 pt-20 text-white">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                    <span className="size-1.5 rounded-full bg-emerald-400" /> Agent online
                  </span>
                  <p className="mt-3 text-lg font-bold">{secondary?.label ?? "Your agent's office"}</p>
                  <p className="text-sm text-white/70">Drafting 3 posts for this week&apos;s launch</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-24">
        <div className="relative overflow-hidden rounded-[2rem] bg-brand-night px-6 py-16 text-center text-white sm:px-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,color-mix(in_oklch,var(--primary)_55%,transparent),transparent)]" />
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(60%_60%_at_50%_50%,black,transparent)]" />
          <div className="relative">
            <Sparkles className="mx-auto size-8 text-brand-amber" />
            <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-extrabold tracking-tight text-balance sm:text-5xl">
              Hire your first AI social media agent today
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/70">
              Create a campaign in under a minute and let your agent draft your first week of content.
            </p>
            <ButtonLink
              size="lg"
              className="mt-8 h-12 rounded-full bg-white px-7 text-base text-brand-night hover:bg-white/90" href="/sign-up">
              Get started free
              <ArrowRight data-icon="inline-end" />
            </ButtonLink>
          </div>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
          <Logo />
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-transparent bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <a href="#features" className="transition-colors hover:text-foreground">Features</a>
          <a href="#how-it-works" className="transition-colors hover:text-foreground">How it works</a>
        </nav>
        <div className="flex items-center gap-2">
          <ButtonLink variant="ghost" className="h-9 rounded-full px-4" href="/sign-in">
            Sign in
          </ButtonLink>
          <ButtonLink className="h-9 rounded-full px-4" href="/sign-up">
            Get started
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}

function HeroVisual({ image }: { image?: string }) {
  return (
    <div className="relative mt-16 w-full max-w-5xl sm:mt-20">
      <div className="absolute -inset-x-10 -top-10 -bottom-4 rounded-[3rem] bg-gradient-to-b from-primary/25 via-brand-pink/10 to-transparent blur-3xl" />

      <div className="relative rounded-[1.75rem] border bg-background/60 p-2 shadow-2xl shadow-primary/10 backdrop-blur sm:p-3">
        <div className="overflow-hidden rounded-[1.25rem] border bg-brand-night">
          <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
            <span className="size-2.5 rounded-full bg-white/20" />
            <span className="size-2.5 rounded-full bg-white/20" />
            <span className="size-2.5 rounded-full bg-white/20" />
            <span className="mx-auto rounded-md bg-white/10 px-10 py-1 text-[11px] text-white/50">Your agent&apos;s office</span>
          </div>
          <div className="relative aspect-[16/9]">
            {image ? (
              <Image src={image} alt="AI agent office" fill priority sizes="(min-width: 1024px) 1000px, 100vw" className="object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-brand-pink/30" />
            )}
          </div>
        </div>
      </div>

      {/* Floating UI cards */}
      <div className="animate-float absolute top-1/4 -left-4 hidden w-64 rounded-2xl border bg-background/95 p-4 text-left shadow-xl backdrop-blur md:block lg:-left-12">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Linkedin className="size-3.5 text-[#0a66c2]" /> LinkedIn draft
          <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">AI</span>
        </div>
        <p className="mt-2 text-sm leading-snug font-medium">“3 lessons from launching our product in 30 days 🚀”</p>
        <div className="mt-3 space-y-1.5">
          <div className="h-1.5 w-full rounded-full bg-muted" />
          <div className="h-1.5 w-4/5 rounded-full bg-muted" />
        </div>
      </div>

      <div className="animate-float absolute -right-4 bottom-1/4 hidden w-60 rounded-2xl border bg-background/95 p-4 text-left shadow-xl backdrop-blur [animation-delay:-3s] md:block lg:-right-12">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand-amber/20 text-amber-600">
            <CalendarClock className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">Post scheduled</p>
            <p className="text-xs text-muted-foreground">Tue · 9:00 AM</p>
          </div>
          <Check className="ml-auto size-4 text-emerald-500" />
        </div>
      </div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  body,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  body: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-xl"}>
      <span className="text-xs font-bold tracking-[0.18em] text-primary uppercase">{eyebrow}</span>
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">{title}</h2>
      <p className="mt-4 text-muted-foreground">{body}</p>
    </div>
  );
}

function FeatureIcon({ Icon }: { Icon: React.ComponentType<{ className?: string }> }) {
  return (
    <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-brand-pink/15 text-primary ring-1 ring-primary/15">
      <Icon className="size-5" />
    </span>
  );
}

function FeatureCard({ Icon, title, body }: (typeof FEATURES)[number]) {
  return (
    <div className="group rounded-3xl border bg-card p-7 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5">
      <FeatureIcon Icon={Icon} />
      <h3 className="mt-5 font-bold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function ComposerMock() {
  return (
    <div className="mt-8 rounded-2xl border bg-background p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
          <PenLine className="size-3.5" />
        </span>
        <span className="text-sm font-semibold">New post</span>
        <div className="ml-auto flex gap-1.5">
          {[Linkedin, Twitter, Instagram].map((Icon, i) => (
            <span key={i} className="flex size-7 items-center justify-center rounded-lg border text-muted-foreground">
              <Icon className="size-3.5" />
            </span>
          ))}
        </div>
      </div>
      <div className="mt-4 rounded-xl bg-muted/60 p-4 text-sm leading-relaxed">
        We just shipped something big. 🎉 Here&apos;s how our team cut content planning time in half, and the
        <span className="rounded bg-primary/15 px-1 text-primary"> 3 tools </span>
        that made it possible…
        <span className="ml-0.5 inline-block h-4 w-px translate-y-0.5 animate-pulse bg-primary" />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {["#ProductLaunch", "#Startups", "#BuildInPublic"].map((tag) => (
          <span key={tag} className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">{tag}</span>
        ))}
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
          <Sparkles className="size-3" /> Rewrite
        </span>
      </div>
    </div>
  );
}
