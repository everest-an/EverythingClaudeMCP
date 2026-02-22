import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/keys/[id] — Rename an API key
export const PATCH = auth(async (req, ctx) => {
  if (!req.auth?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
  const body = await req.json().catch(() => ({}));
  const name = (body as { name?: string }).name?.trim();

  if (!name || name.length > 100) {
    return NextResponse.json(
      { error: "Name is required (max 100 chars)" },
      { status: 400 },
    );
  }

  const key = await prisma.apiKey.findFirst({
    where: { id, userId: req.auth.user.id },
  });

  if (!key) {
    return NextResponse.json({ error: "Key not found" }, { status: 404 });
  }

  const updated = await prisma.apiKey.update({
    where: { id },
    data: { name },
    select: { id: true, name: true },
  });

  return NextResponse.json(updated);
});

// DELETE /api/keys/[id] — Deactivate an API key
export const DELETE = auth(async (req, ctx) => {
  if (!req.auth?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;

  const key = await prisma.apiKey.findFirst({
    where: { id, userId: req.auth.user.id },
  });

  if (!key) {
    return NextResponse.json({ error: "Key not found" }, { status: 404 });
  }

  await prisma.apiKey.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
});
