import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@insforge/sdk/ssr/middleware";

const PROTECTED_PREFIXES = ["/dashboard", "/create-campaign"];
const AUTH_PAGES = ["/sign-in", "/sign-up"];

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  // Refresh the access token (if needed) before Server Components render.
  const { accessToken } = await updateSession({
    requestCookies: request.cookies,
    responseCookies: response.cookies,
  });

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isAuthPage = AUTH_PAGES.includes(pathname);

  if (isProtected && !accessToken) {
    const url = new URL("/sign-in", request.url);
    url.searchParams.set("next", pathname);
    return withCookies(NextResponse.redirect(url), response);
  }

  if (isAuthPage && accessToken) {
    return withCookies(NextResponse.redirect(new URL("/dashboard", request.url)), response);
  }

  return response;
}

// Carry over any refreshed/cleared auth cookies onto a redirect response.
function withCookies(target: NextResponse, source: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
  return target;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
