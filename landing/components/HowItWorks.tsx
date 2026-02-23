"use client";

import RevealOnScroll from "./RevealOnScroll";
import CopyBlock from "./CopyBlock";

export default function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-it-works-heading" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <RevealOnScroll className="text-center mb-16">
          <h2 id="how-it-works-heading" className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            How It Works
          </h2>
          <p className="text-[var(--text-secondary)] max-w-lg mx-auto">
            Three steps to inject compressed engineering rules into every Claude
            conversation.
          </p>
        </RevealOnScroll>

        {/* Steps with arrows */}
        <div className="grid md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-4 items-start">
          <RevealOnScroll delay={1}>
            <Step
              icon={<ConfigIcon />}
              number="01"
              title="Configure"
              description="Sign up and get your API key from the dashboard. Add it to your Claude Code settings — the key is required for cloud access."
              code={`// .claude/settings.json
{
  "mcpServers": {
    "awesome-context": {
      "url": "https://mcp.awesomecontext.dev/mcp",
      "headers": {
        "Authorization": "Bearer ac_..."
      }
    }
  }
}`}
            />
          </RevealOnScroll>

          {/* Arrow connector */}
          <div className="hidden md:flex items-center justify-center pt-24">
            <ArrowConnector />
          </div>

          <RevealOnScroll delay={2}>
            <Step
              icon={<QueryIcon />}
              number="02"
              title="Query"
              description="Claude automatically calls get_rules at the start of every session, loading project-specific coding standards, security rules, and best practices."
              code={`// Auto-invoked by Claude
tools/call: get_rules
{
  "project_type": "react"
}
// → Returns 5 matched rules
//   in < 5ms`}
            />
          </RevealOnScroll>

          {/* Arrow connector */}
          <div className="hidden md:flex items-center justify-center pt-24">
            <ArrowConnector />
          </div>

          <RevealOnScroll delay={3}>
            <Step
              icon={<InjectIcon />}
              number="03"
              title="Inject"
              description="Compressed rules flow into Claude's context as dense prompts — 96% fewer tokens than raw markdown, with zero loss of instruction quality."
              code={`// Claude's context receives:
# Active Rules for: react

## Coding Rules
- Component patterns...
- Testing standards...
- Security guidelines...

// 150 tokens vs 4,000+`}
            />
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}

/** Animated arrow connector between steps */
function ArrowConnector() {
  return (
    <svg
      width="40"
      height="24"
      viewBox="0 0 40 24"
      fill="none"
      className="text-[var(--accent)] opacity-40"
    >
      <path
        d="M0 12H32M32 12L24 4M32 12L24 20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="4 3"
      >
        <animate
          attributeName="stroke-dashoffset"
          values="0;-14"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
}

/** Step icons */
function ConfigIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-float"
    >
      <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

function QueryIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-float"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
      <path d="M11 8v6M8 11h6" />
    </svg>
  );
}

function InjectIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-float"
    >
      <path d="M12 5v14M5 12l7 7 7-7" />
    </svg>
  );
}

function Step({
  icon,
  number,
  title,
  description,
  code,
}: {
  icon: React.ReactNode;
  number: string;
  title: string;
  description: string;
  code: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col h-full">
      {/* Icon + Step number */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)]">
          {icon}
        </div>
        <div className="text-[12px] font-medium text-[var(--accent)] tracking-widest uppercase">
          Step {number}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold mb-3">{title}</h3>

      {/* Description */}
      <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed mb-5">
        {description}
      </p>

      {/* Code block */}
      <CopyBlock code={code} className="code-block p-4 mt-auto">
        <pre className="text-[var(--text-secondary)] whitespace-pre-wrap select-text">
          {code}
        </pre>
      </CopyBlock>
    </div>
  );
}
