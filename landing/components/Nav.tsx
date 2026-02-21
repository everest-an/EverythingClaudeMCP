"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

const links = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Tools", href: "#tools" },
  { label: "Examples", href: "#examples" },
  { label: "Quick Start", href: "#quickstart" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      aria-label="Main navigation"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass-strong" : ""
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/" className="text-[15px] font-medium tracking-tight">
          AwesomeContext
        </a>
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
            >
              {l.label}
            </a>
          ))}
          <a
            href="https://github.com/everest-an/AwesomeContext"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
          >
            GitHub
          </a>
          {session ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-1.5 rounded-lg bg-[var(--accent)] text-white text-[13px] font-medium transition-all hover:opacity-90"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center px-4 py-1.5 rounded-lg glass text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
