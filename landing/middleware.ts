import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Lightweight middleware that gates protected routes by checking for the
 * presence of an Auth.js session cookie.  We intentionally avoid importing
 * `auth()` here because it pulls in PrismaAdapter which cannot run on the
 * Edge Runtime.  Full session validation (including role checks) happens in
 * server components / API routes via `auth()`.
 *
 * Also captures UTM parameters and referrer for user acquisition tracking.
 */
export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Public routes — no auth required
  const isPublic =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/skills" ||
    pathname === "/privacy" ||
    pathname === "/terms" ||
    pathname.startsWith("/blog") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/api/validate-key" ||
    pathname === "/api/log-usage" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/.well-known") ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt" ||
    pathname === "/llms.txt" ||
    pathname === "/llms-full.txt" ||
    /\.(svg|png|ico|jpg|webp|woff2?|json|txt)$/.test(pathname);

  // Capture UTM params into a cookie (first-touch attribution)
  const res = isPublic ? NextResponse.next() : undefined;
  const utmSource = searchParams.get("utm_source");
  if (utmSource && !req.cookies.has("ac_utm")) {
    const utm = JSON.stringify({
      source: utmSource,
      medium: searchParams.get("utm_medium") ?? "",
      campaign: searchParams.get("utm_campaign") ?? "",
    });
    const response = res ?? NextResponse.next();
    response.cookies.set("ac_utm", utm, {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
      httpOnly: false, // readable by server on createUser
      sameSite: "lax",
    });
    if (isPublic) return response;
  }

  // Capture referrer (first-touch)
  const referer = req.headers.get("referer");
  if (referer && !req.cookies.has("ac_ref")) {
    try {
      const refHost = new URL(referer).hostname;
      const selfHost = req.nextUrl.hostname;
      if (refHost !== selfHost) {
        const response = res ?? NextResponse.next();
        response.cookies.set("ac_ref", refHost, {
          maxAge: 30 * 24 * 60 * 60,
          path: "/",
          httpOnly: false,
          sameSite: "lax",
        });
        if (isPublic) return response;
      }
    } catch {
      // invalid referer URL, ignore
    }
  }

  if (isPublic) return res ?? NextResponse.next();

  // Check for session cookie (secure variant on HTTPS, plain on HTTP)
  const hasSession =
    req.cookies.has("__Secure-authjs.session-token") ||
    req.cookies.has("authjs.session-token");

  if (!hasSession) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
