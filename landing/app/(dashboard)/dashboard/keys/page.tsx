import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import KeyManager from "@/components/dashboard/KeyManager";

export const metadata = { title: "API Keys" };

export default async function KeysPage() {
  const session = await auth();

  const keys = await prisma.apiKey.findMany({
    where: { userId: session!.user.id },
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

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">API Keys</h1>
      <KeyManager initialKeys={JSON.parse(JSON.stringify(keys))} />
    </div>
  );
}
