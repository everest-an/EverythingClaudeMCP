"use client";

import RevealOnScroll from "./RevealOnScroll";
import CopyBlock from "./CopyBlock";

export default function Tools() {
  return (
    <section id="tools" aria-labelledby="tools-heading" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <RevealOnScroll className="text-center mb-16">
          <h2 id="tools-heading" className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            MCP Tools
          </h2>
          <p className="text-[var(--text-secondary)] max-w-lg mx-auto">
            Four specialized tools that Claude calls automatically during
            development.
          </p>
        </RevealOnScroll>

        {/* Tool cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <RevealOnScroll delay={1}>
            <ToolCard
              icon={<RulesIcon />}
              name="get_rules"
              badge="Auto-invoked"
              description="Loads project-specific coding standards, security guidelines, and best practices at the start of every conversation."
              params={[
                {
                  name: "project_type",
                  type: "string",
                  desc: "Tech stack identifier (e.g. react, python, golang)",
                },
              ]}
              example={`{
  "tool": "get_rules",
  "arguments": {
    "project_type": "typescript"
  }
}

// Returns: 5 matched rules
// Tokens: ~150 (vs 4,000+ raw)`}
            />
          </RevealOnScroll>

          <RevealOnScroll delay={2}>
            <ToolCard
              icon={<ArchitectIcon />}
              name="architect_consult"
              badge="Before coding"
              description="Retrieves architecture patterns, design principles, and domain-specific guidance before writing any code."
              params={[
                {
                  name: "intent",
                  type: "string",
                  desc: "Design question or task description",
                },
                {
                  name: "top_k",
                  type: "number",
                  desc: "Number of modules to retrieve (1-10)",
                },
              ]}
              example={`{
  "tool": "architect_consult",
  "arguments": {
    "intent": "design a REST API
      with auth and rate limiting",
    "top_k": 5
  }
}`}
            />
          </RevealOnScroll>

          <RevealOnScroll delay={3}>
            <ToolCard
              icon={<SkillIcon />}
              name="skill_injector"
              badge="On demand"
              description="Loads full implementation details for specific skills — security reviews, TDD workflows, database patterns, and more."
              params={[
                {
                  name: "skill_id",
                  type: "string",
                  desc: "Skill path (e.g. skills/security-review)",
                },
              ]}
              example={`{
  "tool": "skill_injector",
  "arguments": {
    "skill_id": "skills/security-review"
  }
}

// Returns: Full security review
// checklist and procedures`}
            />
          </RevealOnScroll>

          <RevealOnScroll delay={4}>
            <ToolCard
              icon={<ComplianceIcon />}
              name="compliance_verify"
              badge="Before commit"
              description="Checks code against loaded rules for compliance violations, security issues, and anti-patterns before committing."
              params={[
                {
                  name: "code",
                  type: "string",
                  desc: "Code snippet or diff to verify",
                },
              ]}
              example={`{
  "tool": "compliance_verify",
  "arguments": {
    "code": "def get_user(id):
      query = f'SELECT * FROM
        users WHERE id={id}'
      ..."
  }
}
// → Flags SQL injection risk`}
            />
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}

/** Tool SVG Icons — minimal line art with float animation */

function RulesIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="13" y2="17" />
    </svg>
  );
}

function ArchitectIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  );
}

function SkillIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function ComplianceIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function ToolCard({
  icon,
  name,
  badge,
  description,
  params,
  example,
}: {
  icon: React.ReactNode;
  name: string;
  badge: string;
  description: string;
  params: Array<{ name: string; type: string; desc: string }>;
  example: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)]">
          {icon}
        </div>
        <code className="text-lg font-semibold">{name}</code>
        <span className="text-[11px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
          {badge}
        </span>
      </div>

      {/* Description */}
      <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed mb-5">
        {description}
      </p>

      {/* Parameters */}
      <div className="mb-5">
        <div className="text-[12px] font-medium text-[var(--text-tertiary)] tracking-wide uppercase mb-2">
          Parameters
        </div>
        <div className="space-y-2">
          {params.map((p) => (
            <div key={p.name} className="flex items-baseline gap-2 text-[13px]">
              <code className="text-[var(--accent)] font-medium shrink-0">
                {p.name}
              </code>
              <span className="text-[var(--text-tertiary)]">{p.type}</span>
              <span className="text-[var(--text-secondary)]">— {p.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Example */}
      <CopyBlock code={example} className="code-block p-4 mt-auto">
        <pre className="text-[var(--text-secondary)] whitespace-pre-wrap text-[12px] select-text">
          {example}
        </pre>
      </CopyBlock>
    </div>
  );
}
