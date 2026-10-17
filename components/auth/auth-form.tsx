"use client";

import Link from "next/link";
import { useActionState, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, Mail, MailCheck, User } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  resendVerificationCode,
  signInWithGoogle,
  signInWithPassword,
  signUpWithPassword,
  verifyEmailCode,
  type AuthState,
} from "@/app/actions/auth";

type Mode = "sign-in" | "sign-up";

const OAUTH_ERRORS: Record<string, string> = {
  oauth_failed: "Google sign-in was cancelled or failed. Please try again.",
  missing_verifier: "Your sign-in session expired. Please try again.",
  exchange_failed: "We couldn't complete Google sign-in. Please try again.",
  oauth_init_failed: "Couldn't start Google sign-in. Please try again.",
};

const CODE_LENGTH = 6;

export function AuthForm({ mode, next, errorCode }: { mode: Mode; next?: string; errorCode?: string }) {
  const isSignUp = mode === "sign-up";
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    isSignUp ? signUpWithPassword : signInWithPassword,
    { error: errorCode ? OAUTH_ERRORS[errorCode] ?? "Authentication failed." : undefined }
  );

  if (state.verifyEmail) {
    return <VerifyEmailForm email={state.verifyEmail} next={next} initialMessage={state.message} />;
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight">
          {isSignUp ? "Create your account" : "Welcome back"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isSignUp
            ? "Set up your AI social media team in minutes."
            : "Sign in to pick up where your agent left off."}
        </p>
      </div>

      <form action={signInWithGoogle}>
        <input type="hidden" name="from" value={mode} />
        <GoogleButton />
      </form>

      <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or with email
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        {next && <input type="hidden" name="next" value={next} />}
        {isSignUp && (
          <IconField id="name" label="Full name" Icon={User}>
            <input id="name" name="name" autoComplete="name" placeholder="Jane Cooper" className={fieldInput} />
          </IconField>
        )}
        <IconField id="email" label="Email" Icon={Mail}>
          <input id="email" name="email" type="email" autoComplete="email" placeholder="you@company.com" required className={fieldInput} />
        </IconField>
        <PasswordField isSignUp={isSignUp} />

        {state.error && <FormError message={state.error} />}

        <Button type="submit" disabled={pending} className="mt-1 h-11 w-full rounded-xl text-sm font-semibold shadow-md shadow-primary/20">
          {pending ? <Spinner /> : null}
          {isSignUp ? "Create account" : "Sign in"}
          {!pending && <ArrowRight data-icon="inline-end" />}
        </Button>

        {isSignUp && (
          <p className="text-center text-xs text-muted-foreground">
            We&apos;ll email you a 6-digit code to verify your address.
          </p>
        )}
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {isSignUp ? "Already have an account? " : "New here? "}
        <Link href={isSignUp ? "/sign-in" : "/sign-up"} className="font-semibold text-primary underline-offset-4 hover:underline">
          {isSignUp ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}

const fieldInput =
  "h-11 w-full min-w-0 rounded-xl border border-input bg-background/80 pr-3 pl-10 text-sm shadow-xs transition-[color,box-shadow,border-color] outline-none placeholder:text-muted-foreground/70 hover:border-foreground/20 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15";

function IconField({
  id,
  label,
  Icon,
  children,
  trailing,
}: {
  id: string;
  label: React.ReactNode;
  Icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-[13px] font-semibold">{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        {children}
        {trailing}
      </div>
    </div>
  );
}

function PasswordField({ isSignUp }: { isSignUp: boolean }) {
  const [visible, setVisible] = useState(false);
  return (
    <IconField
      id="password"
      label="Password"
      Icon={Lock}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      }
    >
      <input
        id="password"
        name="password"
        type={visible ? "text" : "password"}
        autoComplete={isSignUp ? "new-password" : "current-password"}
        placeholder={isSignUp ? "At least 6 characters" : "Enter your password"}
        minLength={isSignUp ? 6 : undefined}
        required
        className={cn(fieldInput, "pr-11")}
      />
    </IconField>
  );
}

function FormError({ message }: { message: string }) {
  return (
    <p role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      {message}
    </p>
  );
}

function VerifyEmailForm({ email, next, initialMessage }: { email: string; next?: string; initialMessage?: string }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(verifyEmailCode, {
    verifyEmail: email,
    message: initialMessage,
  });
  const [resendState, setResendState] = useState<AuthState | null>(null);
  const [resending, startResend] = useTransition();
  const [code, setCode] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const error = state.error ?? resendState?.error;

  return (
    <div className="flex flex-col gap-7">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-brand-pink/15 text-primary ring-1 ring-primary/15">
        <MailCheck className="size-6" />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Check your inbox</h1>
        <p className="text-sm text-muted-foreground">
          We sent a {CODE_LENGTH}-digit code to <span className="font-semibold text-foreground">{email}</span>.
          Enter it below to verify your account.
        </p>
      </div>

      <form ref={formRef} action={formAction} className="flex flex-col gap-5">
        <input type="hidden" name="email" value={email} />
        {next && <input type="hidden" name="next" value={next} />}

        <InputOTP
          name="otp"
          maxLength={CODE_LENGTH}
          pattern={REGEXP_ONLY_DIGITS}
          value={code}
          onChange={setCode}
          onComplete={() => formRef.current?.requestSubmit()}
          autoFocus
          aria-label="Verification code"
          containerClassName="justify-between"
        >
          <InputOTPGroup className="w-full justify-between gap-2">
            {Array.from({ length: CODE_LENGTH }, (_, i) => (
              <InputOTPSlot
                key={i}
                index={i}
                className="h-14 flex-1 rounded-xl border text-xl font-bold first:rounded-xl last:rounded-xl data-[active=true]:border-primary data-[active=true]:ring-4 data-[active=true]:ring-primary/15"
              />
            ))}
          </InputOTPGroup>
        </InputOTP>

        {error && <FormError message={error} />}
        {!error && resendState?.message && (
          <p className="rounded-xl bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-700 dark:text-emerald-400">{resendState.message}</p>
        )}

        <Button type="submit" disabled={pending || code.length < CODE_LENGTH} className="h-11 w-full rounded-xl font-semibold shadow-md shadow-primary/20">
          {pending && <Spinner />}
          Verify and continue
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Didn&apos;t get it? Check spam, or{" "}
        <button
          type="button"
          disabled={resending}
          onClick={() => startResend(async () => setResendState(await resendVerificationCode(email)))}
          className="font-semibold text-primary underline-offset-4 hover:underline disabled:opacity-60"
        >
          {resending ? "sending…" : "resend the code"}
        </button>
      </p>
    </div>
  );
}

function GoogleButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="outline"
      disabled={pending}
      className="h-11 w-full rounded-xl bg-background text-sm font-semibold shadow-xs hover:border-foreground/20"
    >
      {pending ? (
        <Spinner />
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[18px]">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
        </svg>
      )}
      Continue with Google
    </Button>
  );
}
