import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/log-usage
// Called asynchronously by MCP server after each tool call.
export async function POST(req: NextRequest) {
  const internalSecret = req.headers.get("x-internal-secret");
  if (internalSecret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { apiKeyId, userId, toolName, latencyMs } = body as {
    apiKeyId: string;
    userId: string;
    toolName: string;
    latencyMs?: number;
  };

  if (!apiKeyId || !userId || !toolName) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await prisma.usageLog.create({
    data: { apiKeyId, userId, toolName, latencyMs: latencyMs ?? null },
  });

  return NextResponse.json({ success: true });
}
