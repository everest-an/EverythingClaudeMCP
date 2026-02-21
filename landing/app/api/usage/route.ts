import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/usage?days=30
export const GET = auth(async (req) => {
  if (!req.auth?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const days = parseInt(url.searchParams.get("days") ?? "30", 10);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [totalCalls, callsByTool, callsByDay] = await Promise.all([
    prisma.usageLog.count({
      where: { userId: req.auth.user.id, createdAt: { gte: since } },
    }),
    prisma.usageLog.groupBy({
      by: ["toolName"],
      where: { userId: req.auth.user.id, createdAt: { gte: since } },
      _count: true,
    }),
    prisma.$queryRaw`
      SELECT DATE("createdAt") as date, COUNT(*)::int as count
      FROM "UsageLog"
      WHERE "userId" = ${req.auth.user.id}
        AND "createdAt" >= ${since}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `,
  ]);

  return NextResponse.json({ totalCalls, callsByTool, callsByDay });
});
