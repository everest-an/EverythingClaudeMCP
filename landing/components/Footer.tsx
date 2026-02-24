"use client";

import Link from "next/link";
import RevealOnScroll from "./RevealOnScroll";
import Logo from "./Logo";

export default function Footer() {
  const techStack = [
    "FastAPI",
    "Sentence Transformers",
    "FAISS",
    "Node.js",
    "MCP SDK",
    "Docker",
    "Next.js",
  ];

  return (
    <footer className="border-t border-[var(--glass-border)] py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <RevealOnScroll>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            {/* Left side */}
            <div>
              <div className="flex items-center gap-2 text-lg font-semibold mb-2">
                <Logo size={20} />
                AwesomeContext
              </div>
              <p className="text-[13px] text-[var(--text-secondary)] max-w-md">
                Compress engineering rules into latent space tensors. Query them
                in milliseconds. Open source under MIT license.
              </p>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6">
              <a
                href="https://github.com/everest-an/AwesomeContext"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
              >
                GitHub
              </a>
              <Link
                href="/skills"
                className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
              >
                Skills Catalog
              </Link>
              <Link
                href="/blog"
                className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
              >
                Blog
              </Link>
              <a
                href="#quickstart"
                className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--foreground)] transition-colors"
              >
                Quick Start
              </a>
            </div>
          </div>
        </RevealOnScroll>

        {/* Tech stack tags */}
        <RevealOnScroll delay={1}>
          <div className="mt-10 pt-8 border-t border-[var(--glass-border)]">
            <div className="text-[11px] font-medium text-[var(--text-tertiary)] tracking-wide uppercase mb-3">
              Built with
            </div>
            <div className="flex flex-wrap gap-2">
              {techStack.map((tech) => (
                <span
                  key={tech}
                  className="text-[12px] px-3 py-1 rounded-full glass text-[var(--text-secondary)]"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </RevealOnScroll>

        {/* Copyright */}
        <RevealOnScroll delay={2}>
          <div className="mt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-[12px] text-[var(--text-tertiary)]">
            <div>Powered by Awareness · MIT License</div>
            <div className="flex items-center gap-4 text-[11px]">
              <Link
                href="/terms"
                className="hover:text-[var(--foreground)] transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="hover:text-[var(--foreground)] transition-colors"
              >
                Privacy
              </Link>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </footer>
  );
}
