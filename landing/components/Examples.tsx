"use client";

import { useState } from "react";
import RevealOnScroll from "./RevealOnScroll";

const TABS = [
  {
    id: "architecture",
    label: "Architecture Query",
    description:
      "Ask Claude to design a system — it automatically consults the latent knowledge base for architecture patterns.",
    request: `// You say to Claude:
"Design a REST API with authentication
 and rate limiting for our Next.js app"

// Claude auto-calls:
tools/call: architect_consult
{
  "intent": "REST API design with auth
    and rate limiting for Next.js",
  "top_k": 5
}`,
    response: `// AwesomeContext returns (< 5ms):
{
  "dense_prompt": "API Design Rules:
    1. Use layered architecture
       (controller → service → repo)
    2. JWT + refresh token rotation
    3. Rate limit: sliding window,
       429 with Retry-After header
    4. Input validation at boundary
    5. OpenAPI spec-first design...",
  "metrics": {
    "tokens_saved": 3847,
    "retrieval_time_ms": 1.2,
    "modules_matched": 5
  }
}`,
  },
  {
    id: "skill",
    label: "Skill Injection",
    description:
      "Load a complete skill — security audit checklists, TDD workflows, or database migration patterns — on demand.",
    request: `// You say to Claude:
"Run a security review on this auth module"

// Claude auto-calls:
tools/call: skill_injector
{
  "skill_id": "skills/security-review"
}`,
    response: `// AwesomeContext returns:
{
  "dense_prompt": "Security Review Protocol:
    1. Check auth bypass vectors
    2. Verify input sanitization
    3. Audit token storage (no localStorage)
    4. Check CORS configuration
    5. Verify rate limiting on auth endpoints
    6. Check for timing attacks
    7. Audit error messages (no info leak)
    ...",
  "metrics": {
    "tokens_saved": 5120,
    "retrieval_time_ms": 0.8,
    "modules_matched": 1
  }
}`,
  },
  {
    id: "compliance",
    label: "Compliance Check",
    description:
      "Before committing, Claude checks your code against loaded rules — catching SQL injection, XSS, and anti-patterns.",
    request: `// Claude auto-calls before commit:
tools/call: compliance_verify
{
  "code": "def get_user(user_id):
    query = f'SELECT * FROM users
      WHERE id = {user_id}'
    cursor.execute(query)
    return cursor.fetchone()"
}`,
    response: `// AwesomeContext returns:
{
  "dense_prompt": "COMPLIANCE VIOLATIONS FOUND:

    [CRITICAL] SQL Injection
    Line 2: f-string in SQL query
    Fix: Use parameterized queries
      cursor.execute(
        'SELECT * FROM users WHERE id=?',
        (user_id,))

    [WARNING] No input validation
    Add type check for user_id

    [INFO] Missing error handling
    Wrap in try/except with logging",
  "metrics": {
    "tokens_saved": 2340,
    "retrieval_time_ms": 1.1
  }
}`,
  },
];

export default function Examples() {
  const [activeTab, setActiveTab] = useState("architecture");
  const active = TABS.find((t) => t.id === activeTab)!;

  return (
    <section id="examples" aria-labelledby="examples-heading" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <RevealOnScroll className="text-center mb-12">
          <h2 id="examples-heading" className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Examples
          </h2>
          <p className="text-[var(--text-secondary)] max-w-lg mx-auto">
            See how Claude interacts with AwesomeContext during real development
            workflows.
          </p>
        </RevealOnScroll>

        {/* Tabs */}
        <RevealOnScroll delay={1}>
          <div className="flex items-center justify-center gap-2 mb-8">
            {TABS.map((tab) => (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-[var(--accent)] text-white glow-accent"
                    : "glass text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </RevealOnScroll>

        {/* Description */}
        <p className="text-center text-[14px] text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto">
          {active.description}
        </p>

        {/* Code panels */}
        <RevealOnScroll delay={2}>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="text-[12px] font-medium text-[var(--text-tertiary)] tracking-wide uppercase mb-2 px-1">
                Request
              </div>
              <div className="glass-card rounded-2xl p-5 h-full code-block border-0">
                <pre className="whitespace-pre-wrap text-[13px] leading-relaxed">
                  <SyntaxHighlight code={active.request} />
                </pre>
              </div>
            </div>
            <div>
              <div className="text-[12px] font-medium text-[var(--text-tertiary)] tracking-wide uppercase mb-2 px-1">
                Response
              </div>
              <div className="glass-card rounded-2xl p-5 h-full code-block border-0">
                <pre className="whitespace-pre-wrap text-[13px] leading-relaxed">
                  <SyntaxHighlight code={active.response} />
                </pre>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}

/** Simple syntax highlighting */
function SyntaxHighlight({ code }: { code: string }) {
  const lines = code.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <span key={i}>
          {colorLine(line)}
          {i < lines.length - 1 ? "\n" : ""}
        </span>
      ))}
    </>
  );
}

function colorLine(line: string): React.ReactNode {
  const trimmed = line.trimStart();

  // Comments
  if (trimmed.startsWith("//")) {
    return <span className="syntax-comment">{line}</span>;
  }

  // Keys with colons (JSON-like)
  const keyMatch = line.match(/^(\s*)"([^"]+)"(\s*:\s*)(.*)/);
  if (keyMatch) {
    const [, indent, key, colon, rest] = keyMatch;
    return (
      <>
        {indent}
        <span className="syntax-bracket">&quot;</span>
        <span className="syntax-key">{key}</span>
        <span className="syntax-bracket">&quot;</span>
        <span className="syntax-bracket">{colon}</span>
        {colorValue(rest)}
      </>
    );
  }

  // Strings on their own
  if (trimmed.startsWith('"') || trimmed.startsWith("'")) {
    return <span className="syntax-string">{line}</span>;
  }

  // Brackets
  if (/^[\s]*[{}[\]]+[,]?$/.test(line)) {
    return <span className="syntax-bracket">{line}</span>;
  }

  // Keywords
  if (/tools\/call:|COMPLIANCE|CRITICAL|WARNING|INFO/.test(line)) {
    return <span className="syntax-keyword">{line}</span>;
  }

  return <span className="text-[var(--text-secondary)]">{line}</span>;
}

function colorValue(val: string): React.ReactNode {
  const trimmed = val.trim();
  // String values
  if (trimmed.startsWith('"')) {
    return <span className="syntax-string">{val}</span>;
  }
  // Numbers
  if (/^[\d.]+[,]?$/.test(trimmed)) {
    return <span className="syntax-value">{val}</span>;
  }
  return <span className="text-[var(--text-secondary)]">{val}</span>;
}
