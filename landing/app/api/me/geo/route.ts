import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { lookupGeo } from "@/lib/geo";

// POST /api/me/geo — called once after login to record user location + source
export const POST = auth(async (req) => {
  if (!req.auth?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = req.auth.user.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { country: true, source: true },
  });

  // Parse optional source from request body
  let bodySource: string | undefined;
  try {
    const body = await req.json();
    if (body?.source && typeof body.source === "string") {
      bodySource = body.source.slice(0, 100); // cap length
    }
  } catch { /* empty body is fine */ }

  const updates: Record<string, string> = {};

  // Geo: only set if not already captured
  if (!user?.country) {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip =
      forwarded?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "";

    const { country, city } = lookupGeo(ip);
    if (country) {
      updates.country = country;
      if (city) updates.city = city;
    }
  }

  // Source: only set if not already captured
  if (!user?.source && bodySource) {
    updates.source = bodySource;
  }

  if (Object.keys(updates).length > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: updates,
    });
  }

  return NextResponse.json({
    country: updates.country ?? user?.country ?? null,
    source: updates.source ?? user?.source ?? null,
  });
});
