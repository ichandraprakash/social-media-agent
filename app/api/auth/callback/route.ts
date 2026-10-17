import { NextResponse, type NextRequest } from "next/server";
import { createAuthActions } from "@insforge/sdk/ssr";
import { postAuthDestination } from "@/lib/campaigns";
import { syncUser } from "@/lib/users";

const CODE_VERIFIER_COOKIE = "insforge_code_verifier";

// OAuth (Google) lands here with ?insforge_code=...; exchange it for a session.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("insforge_code");
  const oauthError = request.nextUrl.searchParams.get("error");

  if (oauthError || !code) {
    if (oauthError) console.warn("OAuth callback failed", { error: oauthError });
    return NextResponse.redirect(new URL("/sign-in?error=oauth_failed", request.url));
  }

  const codeVerifier = request.cookies.get(CODE_VERIFIER_COOKIE)?.value;
  if (!codeVerifier) {
    return NextResponse.redirect(new URL("/sign-in?error=missing_verifier", request.url));
  }

  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  const auth = createAuthActions({
    requestCookies: request.cookies,
    responseCookies: response.cookies,
  });

  const { data, error } = await auth.exchangeOAuthCode(code, codeVerifier);
  if (error || !data?.user) {
    if (error) console.error("OAuth code exchange failed", error);
    return NextResponse.redirect(new URL("/sign-in?error=exchange_failed", request.url));
  }

  await syncUser(data.user, "google");
  // First-time users (no campaign yet) go to onboarding instead of the dashboard.
  const destination = await postAuthDestination(data.user.id);
  if (destination !== "/dashboard") {
    response.headers.set("Location", new URL(destination, request.url).toString());
  }
  response.cookies.delete(CODE_VERIFIER_COOKIE);
  return response;
}
