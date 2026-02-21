import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
