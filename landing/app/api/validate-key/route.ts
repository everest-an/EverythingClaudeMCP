import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashApiKey } from "@/lib/api-keys";

// POST /api/validate-key
// Called by MCP server to validate an API key. Public endpoint.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const apiKey = (body as { apiKey?: string }).apiKey;

  if (!apiKey || !apiKey.startsWith("ac_")) {
    return NextResponse.json(
      { valid: false, error: "Invalid key format" },
      { status: 400 },
    );
  }

  const keyHash = hashApiKey(apiKey);

  const key = await prisma.apiKey.findUnique({
    where: { keyHash },
    select: {
      id: true,
      userId: true,
      isActive: true,
    },
  });

  if (!key || !key.isActive) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  // Update lastUsedAt (fire-and-forget)
  prisma.apiKey
    .update({
      where: { keyHash },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {});

  return NextResponse.json({
    valid: true,
    userId: key.userId,
    apiKeyId: key.id,
  });
}
