import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalCalls, activeKeys, recentActivity, callsByTool, callsByKey] =
    await Promise.all([
      prisma.usageLog.count({
        where: { userId, createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.apiKey.count({ where: { userId, isActive: true } }),
      prisma.usageLog.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { toolName: true, latencyMs: true, createdAt: true },
      }),
      prisma.usageLog.groupBy({
        by: ["toolName"],
        where: { userId, createdAt: { gte: thirtyDaysAgo } },
        _count: true,
      }),
      prisma.apiKey.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          keyPrefix: true,
          isActive: true,
          _count: {
            select: {
              usageLogs: {
                where: { createdAt: { gte: thirtyDaysAgo } },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  const avgLatency =
    recentActivity.length > 0
      ? Math.round(
          recentActivity.reduce((sum, r) => sum + (r.latencyMs ?? 0), 0) /
            recentActivity.filter((r) => r.latencyMs).length,
        ) || 0
      : 0;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="API Calls (30d)" value={totalCalls.toString()} />
        <StatCard label="Active Keys" value={activeKeys.toString()} />
        <StatCard
          label="Avg Latency"
          value={avgLatency > 0 ? `${avgLatency}ms` : "—"}
        />
      </div>

      {/* Usage by tool */}
      {callsByTool.length > 0 && (
        <div className="glass-card rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Usage by Tool (30d)</h2>
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

      {/* Usage by Key */}
      {callsByKey.length > 0 && (
        <div className="glass-card rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Usage by Key (30d)</h2>
          <div className="space-y-3">
            {callsByKey
              .filter((k) => k.isActive || k._count.usageLogs > 0)
              .map((key) => {
                const max = Math.max(
                  ...callsByKey.map((k) => k._count.usageLogs),
                  1,
                );
                const pct = (key._count.usageLogs / max) * 100;
                return (
                  <div key={key.id}>
                    <div className="flex justify-between text-[13px] mb-1">
                      <span className="text-[var(--text-secondary)]">
                        {key.name}
                        <span className="text-[var(--text-tertiary)] ml-1.5 font-mono text-[11px]">
                          {key.keyPrefix}...
                        </span>
                        {!key.isActive && (
                          <span className="text-red-400 ml-1.5 text-[11px]">
                            revoked
                          </span>
                        )}
                      </span>
                      <span className="font-medium">
                        {key._count.usageLogs}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--glass-bg)]">
                      <div
                        className="h-2 rounded-full bg-[var(--secondary)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        {recentActivity.length === 0 ? (
          <p className="text-[13px] text-[var(--text-tertiary)]">
            No activity yet. Create an API key and start making requests.
          </p>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[var(--text-tertiary)] uppercase text-[11px] tracking-wide">
                <th className="pb-3">Tool</th>
                <th className="pb-3">Latency</th>
                <th className="pb-3">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glass-border)]">
              {recentActivity.map((log, i) => (
                <tr key={i}>
                  <td className="py-2.5 text-[var(--accent)] font-mono">
                    {log.toolName}
                  </td>
                  <td className="py-2.5 text-[var(--text-secondary)]">
                    {log.latencyMs ? `${log.latencyMs}ms` : "—"}
                  </td>
                  <td className="py-2.5 text-[var(--text-tertiary)]">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
