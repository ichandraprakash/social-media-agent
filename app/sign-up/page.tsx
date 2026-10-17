import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { listOfficeImages } from "@/lib/campaigns";

export const metadata: Metadata = { title: "Sign up" };

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const [{ next, error }, offices] = await Promise.all([searchParams, listOfficeImages()]);
  return (
    <AuthShell image={offices[1] ?? offices[0]}>
      <AuthForm mode="sign-up" next={next} errorCode={error} />
    </AuthShell>
  );
}
