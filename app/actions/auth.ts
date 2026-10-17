"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAuthActions, createServerClient } from "@insforge/sdk/ssr";
import { postAuthDestination } from "@/lib/campaigns";
import { syncUser } from "@/lib/users";

export type AuthState = {
  error?: string;
  /** Email that still needs to enter its verification code. */
  verifyEmail?: string;
  message?: string;
};

const DEFAULT_REDIRECT = "/dashboard";

// Only allow internal paths so `next` can't be used as an open redirect.
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : DEFAULT_REDIRECT;
}

async function authActions() {
  return createAuthActions({ cookies: await cookies() });
}

function isUnverifiedError(error: { statusCode?: number; message?: string } | null) {
  return !!error && (error.statusCode === 403 || /verif/i.test(error.message ?? ""));
}

export async function signInWithPassword(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email and password are required." };

  const auth = await authActions();
  const { data, error } = await auth.signInWithPassword({ email, password });

  if (isUnverifiedError(error)) {
    return { verifyEmail: email, message: "Please verify your email. Enter the code we sent you." };
  }
  if (error || !data?.user) {
    return { error: error?.message ?? "Invalid email or password." };
  }

  await syncUser(data.user, "email");
  redirect(await postAuthDestination(data.user.id, safeNext(formData.get("next"))));
}

export async function signUpWithPassword(_: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email and password are required." };

  const auth = await authActions();
  const { data, error } = await auth.signUp({ email, password, name: name || undefined });

  if (error) return { error: error.message ?? "Could not create your account." };

  // With email verification on, no session is issued until the code is confirmed.
  if (data?.requireEmailVerification || !data?.user) {
    return { verifyEmail: email, message: `We sent a 6-digit code to ${email}.` };
  }

  await syncUser(data.user, "email");
  redirect(await postAuthDestination(data.user.id, safeNext(formData.get("next"))));
}

export async function verifyEmailCode(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const otp = String(formData.get("otp") ?? "").trim();
  if (!otp) return { verifyEmail: email, error: "Enter the code from your email." };

  const auth = await authActions();
  const { data, error } = await auth.verifyEmail({ email, otp });

  if (error || !data?.user) {
    return { verifyEmail: email, error: error?.message ?? "Invalid or expired code." };
  }

  await syncUser(data.user, "email");
  redirect(await postAuthDestination(data.user.id, safeNext(formData.get("next"))));
}

export async function resendVerificationCode(email: string): Promise<AuthState> {
  const client = createServerClient({ cookies: await cookies() });
  const { error } = await client.auth.resendVerificationEmail({ email });
  if (error) return { verifyEmail: email, error: error.message };
  return { verifyEmail: email, message: `A new code was sent to ${email}.` };
}

export async function signInWithGoogle(formData: FormData) {
  const cookieStore = await cookies();
  const auth = createAuthActions({ cookies: cookieStore });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { data, error } = await auth.signInWithOAuth("google", {
    redirectTo: new URL("/api/auth/callback", appUrl).toString(),
    skipBrowserRedirect: true,
  });

  if (error || !data.url || !data.codeVerifier) {
    const page = formData.get("from") === "sign-up" ? "/sign-up" : "/sign-in";
    redirect(`${page}?error=oauth_init_failed`);
  }

  cookieStore.set("insforge_code_verifier", data.codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  redirect(data.url);
}

export async function signOut() {
  const auth = await authActions();
  await auth.signOut();
  redirect("/sign-in");
}
