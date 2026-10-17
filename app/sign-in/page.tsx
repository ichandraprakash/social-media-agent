import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { listOfficeImages } from "@/lib/campaigns";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const [{ next, error }, offices] = await Promise.all([searchParams, listOfficeImages()]);
  return (
    <AuthShell image={offices[0]}>
      <AuthForm mode="sign-in" next={next} errorCode={error} />
    </AuthShell>
  );
}
