import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateApiKey } from "@/lib/api-keys";

// GET /api/keys — List user's API keys
export const GET = auth(async (req) => {
  if (!req.auth?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keys = await prisma.apiKey.findMany({
    where: { userId: req.auth.user.id },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      isActive: true,
      lastUsedAt: true,
      createdAt: true,
      _count: { select: { usageLogs: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ keys });
});

// POST /api/keys — Create a new API key
export const POST = auth(async (req) => {
  if (!req.auth?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const name = (body as { name?: string }).name || "Default Key";

  const activeCount = await prisma.apiKey.count({
    where: { userId: req.auth.user.id, isActive: true },
  });

  if (activeCount >= 5) {
    return NextResponse.json(
      { error: "Maximum 5 active API keys allowed" },
      { status: 400 },
    );
  }

  const { key, hash, prefix } = generateApiKey();

  await prisma.apiKey.create({
    data: {
      userId: req.auth.user.id,
      name,
      keyHash: hash,
      keyPrefix: prefix,
    },
  });

  return NextResponse.json({ key, prefix, name }, { status: 201 });
});
