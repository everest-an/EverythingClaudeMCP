import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Admin Dashboard" };

export default async function AdminPage() {
  const session = await auth();
  if (session?.user.role !== "admin") redirect("/dashboard");

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalUsers, totalKeys, totalCalls, users, callsByTool] =
    await Promise.all([
      prisma.user.count(),
      prisma.apiKey.count({ where: { isActive: true } }),
      prisma.usageLog.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          createdAt: true,
          _count: {
            select: { apiKeys: { where: { isActive: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.usageLog.groupBy({
        by: ["toolName"],
        where: { createdAt: { gte: thirtyDaysAgo } },
        _count: true,
      }),
    ]);

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {/* Global stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Users" value={totalUsers.toString()} />
        <StatCard label="Active Keys" value={totalKeys.toString()} />
        <StatCard label="Calls (30d)" value={totalCalls.toString()} />
      </div>

      {/* Tool breakdown */}
      {callsByTool.length > 0 && (
        <div className="glass-card rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            Usage by Tool (30d)
          </h2>
          <div className="space-y-3">
            {callsByTool.map((item) => {
              const max = Math.max(...callsByTool.map((t) => t._count));
              const pct = max > 0 ? (item._count / max) * 100 : 0;
              return (
                <div key={item.toolName}>
                  <div className="flex justify-between text-[13px] mb-1">
                    <span className="text-[var(--text-secondary)]">
                      {item.toolName}
                    </span>
                    <span className="font-medium">{item._count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--glass-bg)]">
                    <div
                      className="h-2 rounded-full bg-[var(--accent)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Users table */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">All Users</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[var(--text-tertiary)] uppercase text-[11px] tracking-wide">
                <th className="pb-3">User</th>
                <th className="pb-3">Email</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Keys</th>
                <th className="pb-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glass-border)]">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="py-3 flex items-center gap-2">
                    {user.image && (
                      <img
                        src={user.image}
                        alt=""
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    {user.name ?? "—"}
                  </td>
                  <td className="py-3 text-[var(--text-secondary)]">
                    {user.email}
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        user.role === "admin"
                          ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                          : "bg-[rgba(255,255,255,0.06)] text-[var(--text-secondary)]"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3">{user._count.apiKeys}</td>
                  <td className="py-3 text-[var(--text-tertiary)]">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="text-[12px] text-[var(--text-tertiary)] uppercase tracking-wide mb-1">
        {label}
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
