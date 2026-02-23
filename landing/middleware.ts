import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Lightweight middleware that gates protected routes by checking for the
 * presence of an Auth.js session cookie.  We intentionally avoid importing
 * `auth()` here because it pulls in PrismaAdapter which cannot run on the
 * Edge Runtime.  Full session validation (including role checks) happens in
 * server components / API routes via `auth()`.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes — no auth required
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/skills" ||
    pathname === "/privacy" ||
    pathname === "/terms" ||
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
    /\.(svg|png|ico|jpg|webp|woff2?|json|txt)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

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
