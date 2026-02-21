import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/stats
export const GET = auth(async (req) => {
  if (!req.auth?.user?.id || req.auth.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalUsers, totalKeys, totalCalls, callsByTool, topUsers] =
    await Promise.all([
      prisma.user.count(),
      prisma.apiKey.count({ where: { isActive: true } }),
      prisma.usageLog.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.usageLog.groupBy({
        by: ["toolName"],
        where: { createdAt: { gte: thirtyDaysAgo } },
        _count: true,
      }),
      prisma.$queryRaw`
        SELECT u.id, u.name, u.email, u.image, COUNT(ul.id)::int as "callCount"
        FROM "User" u
        LEFT JOIN "UsageLog" ul ON u.id = ul."userId"
          AND ul."createdAt" >= ${thirtyDaysAgo}
        GROUP BY u.id, u.name, u.email, u.image
        ORDER BY "callCount" DESC
        LIMIT 20
      `,
    ]);

  return NextResponse.json({
    totalUsers,
    totalKeys,
    totalCalls,
    callsByTool,
    topUsers,
  });
});
