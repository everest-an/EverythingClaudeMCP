"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import Aurora from "@/components/Aurora";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/keys", label: "API Keys" },
];

export default function DashboardShell({
  session,
  children,
}: {
  session: Session;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <>
      <Aurora />
      <div className="min-h-screen flex">
        {/* Sidebar */}
        <aside className="w-64 glass-strong border-r border-[var(--glass-border)] p-6 flex flex-col shrink-0">
          <Link
            href="/"
            className="text-[15px] font-medium tracking-tight mb-8"
          >
            AwesomeContext
          </Link>

          <nav className="space-y-1 flex-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                  pathname === item.href
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--glass-hover)]"
                }`}
              >
                {item.label}
              </Link>
            ))}

            {session.user.role === "admin" && (
              <Link
                href="/admin"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                  pathname === "/admin"
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--glass-hover)]"
                }`}
              >
                Admin
              </Link>
            )}
          </nav>

          {/* User info */}
          <div className="border-t border-[var(--glass-border)] pt-4">
            <div className="flex items-center gap-3 mb-3">
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt=""
                  className="w-8 h-8 rounded-full"
                />
              )}
              <div className="min-w-0">
                <div className="text-[13px] font-medium truncate">
                  {session.user.name}
                </div>
                <div className="text-[11px] text-[var(--text-tertiary)] truncate">
                  {session.user.email}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full text-left px-3 py-2 rounded-lg text-[13px] text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--glass-hover)] transition-all"
            >
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </>
  );
}
