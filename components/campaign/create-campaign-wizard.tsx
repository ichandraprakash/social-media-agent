"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, Check, ImageOff, Rocket, UploadCloud, X } from "lucide-react";
import { cn } from "cn";
import { createCampaign } from "@/app/actions/campaign";
import { Logo } from "@/components/brand/logo";
import { CampaignIcon } from "@/components/campaign/campaign-icon";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  CAMPAIGN_ICON_BUCKET,
  CAMPAIGN_ICONS,
  CAMPAIGN_NAME_MAX,
  ICON_MIME_TYPES,
  MAX_ICON_BYTES,
  type CampaignIconKey,
} from "@/lib/campaign-icons";
import { insforge } from "@/lib/insforge/client";

type Office = { src: string; label: string };
type Step = 1 | 2;

const STEPS = [
  { id: 1, title: "Campaign details", hint: "Name & icon" },
  { id: 2, title: "Agent office", hint: "Pick a workspace" },
] as const;

export function CreateCampaignWizard({ offices, isAdditional = false }: { offices: Office[]; isAdditional?: boolean }) {
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<CampaignIconKey | null>("rocket");
  const [customIcon, setCustomIcon] = useState<{ file: File; preview: string } | null>(null);
  const [office, setOffice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Release the object URL for a replaced or removed custom icon.
  useEffect(() => () => { if (customIcon) URL.revokeObjectURL(customIcon.preview); }, [customIcon]);

  const trimmedName = name.trim();
  const canContinue = trimmedName.length > 0 && Boolean(customIcon || icon);
  const selectedOffice = offices.find((o) => o.src === office);

  function goNext(event: React.FormEvent) {
    event.preventDefault();
    if (!canContinue) return;
    setError(null);
    setStep(2);
  }

  function handleCreate() {
    if (!office) return;
    setError(null);
    startTransition(async () => {
      let iconKey: string | null = null;
      if (customIcon) {
        const { data, error: uploadError } = await insforge.storage
          .from(CAMPAIGN_ICON_BUCKET)
          .uploadAuto(customIcon.file);
        if (uploadError || !data) {
          setError(uploadError?.message ?? "Icon upload failed. Please try again.");
          return;
        }
        iconKey = data.key;
      }

      // Redirects to /dashboard on success; only returns on failure.
      const result = await createCampaign({ name: trimmedName, icon, iconKey, officeImage: office });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="grid min-h-svh bg-background lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      {/* Form column */}
      <div className="relative flex min-w-0 flex-col">
        <div className="pointer-events-none absolute inset-0 bg-aurora opacity-50" />

        <header className="relative flex items-center justify-between gap-4 px-5 py-5 sm:px-10">
          <Logo href={isAdditional ? "/dashboard" : "/create-campaign"} />
          <div className="flex items-center gap-2">
            <span className="rounded-full border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              Step {step} of {STEPS.length}
            </span>
            {isAdditional && (
              <Link
                href="/dashboard"
                aria-label="Cancel and return to dashboard"
                className="flex size-8 items-center justify-center rounded-full border bg-background/70 text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
              >
                <X className="size-4" />
              </Link>
            )}
          </div>
        </header>

        <main className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 pt-4 pb-6 sm:px-10">
          <Stepper current={step} />

          {step === 1 ? (
            <form onSubmit={goNext} className="mt-10 flex flex-1 flex-col">
              <StepHeading
                eyebrow={isAdditional ? "New campaign" : "Let's get started"}
                title={isAdditional ? "Create a new campaign" : "Create your first campaign"}
                description="Give your campaign a name and an icon so you can spot it at a glance."
              />

              <div className="mt-8 flex flex-col gap-8">
                <NameField value={name} onChange={setName} />
                <IconPicker
                  icon={icon}
                  customIcon={customIcon}
                  onSelectIcon={(key) => { setIcon(key); setCustomIcon(null); }}
                  onUpload={(file) => { setCustomIcon({ file, preview: URL.createObjectURL(file) }); setIcon(null); }}
                  onRemoveUpload={() => { setCustomIcon(null); setIcon("rocket"); }}
                />
              </div>

              <StepFooter>
                <span className="hidden text-sm text-muted-foreground sm:block">
                  {canContinue ? "Looking good! Next, pick an office." : "Add a name to continue."}
                </span>
                <Button type="submit" disabled={!canContinue} className="h-11 rounded-xl px-6 font-semibold shadow-md shadow-primary/20">
                  Continue
                  <ArrowRight data-icon="inline-end" />
                </Button>
              </StepFooter>
            </form>
          ) : (
            <div className="mt-10 flex flex-1 flex-col">
              <StepHeading
                eyebrow="Almost there"
                title="Choose your agent's office"
                description="This is where your AI agent works on your campaign. Pick the space that fits your vibe."
              />

              <div className="mt-8">
                <OfficePicker offices={offices} value={office} onChange={setOffice} disabled={pending} />
                {error && (
                  <p role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    {error}
                  </p>
                )}
              </div>

              <StepFooter>
                <Button variant="ghost" className="h-11 rounded-xl px-4" onClick={() => setStep(1)} disabled={pending}>
                  <ArrowLeft data-icon="inline-start" />
                  Back
                </Button>
                <Button onClick={handleCreate} disabled={!office || pending} className="h-11 rounded-xl px-6 font-semibold shadow-md shadow-primary/20">
                  {pending ? <Spinner /> : <Rocket data-icon="inline-start" />}
                  {pending ? "Creating campaign…" : "Create campaign"}
                </Button>
              </StepFooter>
            </div>
          )}
        </main>
      </div>

      <CampaignPreview
        name={trimmedName}
        icon={icon}
        customIconUrl={customIcon?.preview}
        office={selectedOffice}
        fallbackOffice={offices[0]}
        step={step}
      />
    </div>
  );
}

function Stepper({ current }: { current: Step }) {
  return (
    <ol className="grid grid-cols-2 gap-3" aria-label="Progress">
      {STEPS.map((s) => {
        const done = s.id < current;
        const active = s.id === current;
        return (
          <li key={s.id} aria-current={active ? "step" : undefined} className="flex flex-col gap-3">
            <span className="h-1.5 overflow-hidden rounded-full bg-muted">
              <span
                className={cn(
                  "block h-full rounded-full bg-gradient-to-r from-primary to-brand-pink transition-all duration-500",
                  done || active ? "w-full" : "w-0"
                )}
              />
            </span>
            <span className="flex items-center gap-2.5">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors",
                  done && "bg-primary text-primary-foreground",
                  active && "bg-primary/10 text-primary ring-1 ring-primary/30",
                  !done && !active && "bg-muted text-muted-foreground"
                )}
              >
                {done ? <Check className="size-3.5" /> : s.id}
              </span>
              <span className="min-w-0">
                <span className={cn("block truncate text-sm font-semibold", !active && !done && "text-muted-foreground")}>{s.title}</span>
                <span className="hidden text-xs text-muted-foreground sm:block">{s.hint}</span>
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function StepHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-bold tracking-[0.16em] text-primary uppercase">{eyebrow}</span>
      <h1 className="text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function StepFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 mt-auto -mx-5 flex items-center justify-between gap-3 border-t bg-background/85 px-5 pt-5 pb-1 backdrop-blur sm:mx-0 sm:border-t-0 sm:bg-transparent sm:px-0 sm:pt-10 sm:backdrop-blur-none">
      {children}
    </div>
  );
}

function NameField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const remaining = CAMPAIGN_NAME_MAX - value.length;
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between">
        <Label htmlFor="campaign-name" className="text-[13px] font-semibold">Campaign name</Label>
        <span className={cn("text-xs tabular-nums text-muted-foreground", remaining <= 10 && "text-amber-600")}>
          {value.length}/{CAMPAIGN_NAME_MAX}
        </span>
      </div>
      <input
        id="campaign-name"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={CAMPAIGN_NAME_MAX}
        placeholder="e.g. Summer Product Launch"
        autoFocus
        autoComplete="off"
        className="h-14 w-full rounded-2xl border border-input bg-background/80 px-4 text-lg font-semibold shadow-xs transition-[box-shadow,border-color] outline-none placeholder:font-normal placeholder:text-muted-foreground/60 hover:border-foreground/20 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15"
      />
    </div>
  );
}

function IconPicker({
  icon,
  customIcon,
  onSelectIcon,
  onUpload,
  onRemoveUpload,
}: {
  icon: CampaignIconKey | null;
  customIcon: { file: File; preview: string } | null;
  onSelectIcon: (key: CampaignIconKey) => void;
  onUpload: (file: File) => void;
  onRemoveUpload: () => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const labelId = useId();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function accept(file: File | undefined) {
    if (!file) return;
    if (!ICON_MIME_TYPES.includes(file.type)) return setUploadError("Use a PNG, JPG or WebP image.");
    if (file.size > MAX_ICON_BYTES) return setUploadError("Image must be 2 MB or smaller.");
    setUploadError(null);
    onUpload(file);
  }

  return (
    <div className="flex flex-col gap-3">
      <span id={labelId} className="text-[13px] font-semibold">Campaign icon</span>

      <div role="radiogroup" aria-labelledby={labelId} className="grid grid-cols-4 gap-2.5 sm:grid-cols-8">
        {(Object.keys(CAMPAIGN_ICONS) as CampaignIconKey[]).map((key) => {
          const { Icon, label } = CAMPAIGN_ICONS[key];
          const selected = !customIcon && icon === key;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={label}
              title={label}
              onClick={() => onSelectIcon(key)}
              className={cn(
                "group relative flex aspect-square items-center justify-center rounded-2xl border bg-background/80 text-muted-foreground transition-all outline-none hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary hover:shadow-md hover:shadow-primary/10 focus-visible:ring-4 focus-visible:ring-primary/20",
                selected &&
                  "border-transparent bg-gradient-to-br from-primary to-brand-pink text-white shadow-lg shadow-primary/30 hover:border-transparent hover:text-white"
              )}
            >
              <Icon className="size-5" />
            </button>
          );
        })}
      </div>

      {/* Custom upload */}
      {customIcon ? (
        <div className="flex items-center gap-3 rounded-2xl border-2 border-primary bg-primary/5 p-3" role="status">
          {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
          <img src={customIcon.preview} alt="Custom icon preview" className="size-12 rounded-xl object-cover shadow-sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{customIcon.file.name}</p>
            <p className="text-xs text-muted-foreground">Custom icon · {(customIcon.file.size / 1024).toFixed(0)} KB</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => fileInput.current?.click()}>Replace</Button>
          <button
            type="button"
            onClick={onRemoveUpload}
            aria-label="Remove custom icon"
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); accept(e.dataTransfer.files?.[0]); }}
          className={cn(
            "flex items-center gap-4 rounded-2xl border border-dashed bg-background/60 p-4 text-left transition-colors outline-none hover:border-primary/50 hover:bg-primary/[0.03] focus-visible:ring-4 focus-visible:ring-primary/20",
            dragging && "border-primary bg-primary/5"
          )}
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <UploadCloud className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold">
              Upload your own <span className="font-normal text-muted-foreground">or drag & drop</span>
            </span>
            <span className="block text-xs text-muted-foreground">PNG, JPG or WebP · up to 2 MB · square works best</span>
          </span>
        </button>
      )}

      <input
        ref={fileInput}
        type="file"
        accept={ICON_MIME_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => { accept(e.target.files?.[0]); e.target.value = ""; }}
      />
      {uploadError && <p role="alert" className="text-xs font-medium text-destructive">{uploadError}</p>}
    </div>
  );
}

function OfficePicker({
  offices,
  value,
  onChange,
  disabled,
}: {
  offices: Office[];
  value: string | null;
  onChange: (src: string) => void;
  disabled?: boolean;
}) {
  if (offices.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed px-6 py-14 text-center">
        <ImageOff className="size-6 text-muted-foreground" />
        <p className="text-sm font-semibold">No offices available yet</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          Add office images to <code className="rounded bg-muted px-1">public/offices</code> and refresh the page.
        </p>
      </div>
    );
  }

  return (
    <div role="radiogroup" aria-label="Agent office" className="grid gap-4 sm:grid-cols-2">
      {offices.map((office, i) => {
        const selected = value === office.src;
        return (
          <button
            key={office.src}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(office.src)}
            className={cn(
              "group relative overflow-hidden rounded-2xl bg-brand-night text-left shadow-sm ring-1 ring-border transition-all outline-none hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 focus-visible:ring-4 focus-visible:ring-primary/30 disabled:pointer-events-none",
              selected && "shadow-xl shadow-primary/20 ring-[3px] ring-primary"
            )}
          >
            <span className="relative block aspect-[4/3]">
              <Image
                src={office.src}
                alt={office.label}
                fill
                priority={i < 2}
                sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-4 pt-10 pb-3.5">
                <span className="block text-sm font-bold text-white">{office.label}</span>
              </span>
              <span
                className={cn(
                  "absolute top-3 right-3 flex size-7 items-center justify-center rounded-full border-2 border-white/80 bg-black/25 backdrop-blur-sm transition-all",
                  selected && "scale-110 border-white bg-primary text-primary-foreground"
                )}
              >
                {selected && <Check className="size-4" strokeWidth={3} />}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function CampaignPreview({
  name,
  icon,
  customIconUrl,
  office,
  fallbackOffice,
  step,
}: {
  name: string;
  icon: CampaignIconKey | null;
  customIconUrl?: string;
  office?: Office;
  fallbackOffice?: Office;
  step: Step;
}) {
  const shown = office ?? fallbackOffice;
  const ready = Boolean(name && office);

  return (
    <aside className="relative hidden p-3 lg:block">
      <div className="sticky top-3 h-[calc(100svh-1.5rem)] overflow-hidden rounded-[2rem] bg-brand-night text-white">
        {shown && (
          <div className="absolute inset-0">
          <Image
            key={shown.src}
            src={shown.src}
            alt=""
            fill
            sizes="45vw"
            className={cn(
              "object-cover transition-all duration-700 animate-in fade-in",
              !office && "scale-105 opacity-40 blur-[2px] grayscale-[40%]"
            )}
          />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-night via-brand-night/30 to-brand-night/20" />

        <span className="absolute top-8 left-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-xl">
          <span className="size-1.5 rounded-full bg-brand-amber" /> Live preview
        </span>

        {!office && step === 2 && (
          <p className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-sm font-medium text-white/70">
            Select an office to see it here
          </p>
        )}

        <div className="absolute inset-x-8 bottom-8">
          <div className="rounded-3xl border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center gap-4">
              <CampaignIcon icon={icon} iconUrl={customIconUrl} className="size-14 rounded-2xl" />
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-xl font-extrabold tracking-tight", !name && "text-white/50")}>
                  {name || "Your campaign name"}
                </p>
                <p className="truncate text-sm text-white/60">
                  AI agent · {office ? office.label : "No office yet"}
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs">
              <span className="text-white/60">Status</span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold",
                  ready ? "bg-emerald-400/15 text-emerald-300" : "bg-white/10 text-white/70"
                )}
              >
                <span className={cn("size-1.5 rounded-full", ready ? "bg-emerald-400" : "bg-white/50")} />
                {ready ? "Ready to launch" : "Setting up"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
