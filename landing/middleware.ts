import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Public routes
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

  // Protected: must be authenticated
  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes
  if (pathname.startsWith("/admin")) {
    if (req.auth.user.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
