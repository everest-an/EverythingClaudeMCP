"use client";

import RevealOnScroll from "./RevealOnScroll";
import CopyBlock from "./CopyBlock";

const CLOUD_CONFIG = `{
  "mcpServers": {
    "awesome-context": {
      "url": "https://mcp.awesomecontext.dev/mcp"
    }
  }
}`;

const SELF_HOSTED_CLONE = `git clone https://github.com/everest-an/AwesomeContext.git
cd AwesomeContext
docker compose --profile cloud up -d`;

const SELF_HOSTED_CONFIG = `{
  "mcpServers": {
    "awesome-context": {
      "url": "http://localhost:3000/mcp"
    }
  }
}`;

const CLAUDE_MD = `# CLAUDE.md

## MCP Tools — Auto-Invocation Rules

ALWAYS call these tools from the "awesome-context" MCP server:

1. **get_rules** — Call at the START of every conversation
   with project_type matching this project's stack.

2. **architect_consult** — Call BEFORE writing any code.
   Pass your design intent as the "intent" parameter.

3. **compliance_verify** — Call BEFORE committing code.
   Pass the code diff as the "code" parameter.`;

export default function QuickStart() {
  return (
    <section id="quickstart" aria-labelledby="quickstart-heading" className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <RevealOnScroll className="text-center mb-16">
          <h2 id="quickstart-heading" className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Quick Start
          </h2>
          <p className="text-[var(--text-secondary)] max-w-lg mx-auto">
            Start using AwesomeContext in under a minute. Choose cloud or
            self-hosted.
          </p>
        </RevealOnScroll>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Cloud option */}
          <RevealOnScroll delay={1}>
          <div className="glass-card rounded-2xl p-6 h-full">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-xl font-semibold">Cloud</h3>
              <span className="text-[11px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                Recommended
              </span>
            </div>
            <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed mb-6">
              No installation needed. Add the MCP server URL to your Claude Code
              settings and start coding.
            </p>

            {/* Step 1 */}
            <div className="mb-4">
              <div className="text-[12px] font-medium text-[var(--text-tertiary)] tracking-wide uppercase mb-2">
                1. Add to Claude Code settings
              </div>
              <CopyBlock code={CLOUD_CONFIG} />
            </div>

            {/* Step 2 */}
            <div>
              <div className="text-[12px] font-medium text-[var(--text-tertiary)] tracking-wide uppercase mb-2">
                2. Start coding
              </div>
              <p className="text-[13px] text-[var(--text-secondary)]">
                Claude will automatically call{" "}
                <code className="text-[var(--accent)]">get_rules</code> when you
                start a new session. Rules are injected based on your project
                type.
              </p>
            </div>
          </div>
          </RevealOnScroll>

          {/* Self-hosted option */}
          <RevealOnScroll delay={2}>
          <div className="glass-card rounded-2xl p-6 h-full">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-xl font-semibold">Self-Hosted</h3>
              <span className="text-[11px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-[rgba(255,255,255,0.08)] text-[var(--text-secondary)]">
                Full control
              </span>
            </div>
            <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed mb-6">
              Run the complete stack locally or on your own infrastructure.
              Customize rules and add your own modules.
            </p>

            {/* Step 1 */}
            <div className="mb-4">
              <div className="text-[12px] font-medium text-[var(--text-tertiary)] tracking-wide uppercase mb-2">
                1. Clone and build
              </div>
              <CopyBlock code={SELF_HOSTED_CLONE} />
            </div>

            {/* Step 2 */}
            <div className="mb-4">
              <div className="text-[12px] font-medium text-[var(--text-tertiary)] tracking-wide uppercase mb-2">
                2. Configure Claude Code
              </div>
              <CopyBlock code={SELF_HOSTED_CONFIG} />
            </div>

            {/* Step 3 */}
            <div>
              <div className="text-[12px] font-medium text-[var(--text-tertiary)] tracking-wide uppercase mb-2">
                3. Add custom rules (optional)
              </div>
              <p className="text-[13px] text-[var(--text-secondary)]">
                Drop markdown files into{" "}
                <code className="text-[var(--accent)]">vendor/</code> and
                rebuild to add your own engineering rules and skills.
              </p>
            </div>
          </div>
          </RevealOnScroll>
        </div>

        {/* Optional CLAUDE.md */}
        <RevealOnScroll delay={3}>
        <div className="mt-8 glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-3">
            Optional: Auto-Invocation with CLAUDE.md
          </h3>
          <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed mb-4">
            For the best experience, add a{" "}
            <code className="text-[var(--accent)]">CLAUDE.md</code> file to your
            project root. This tells Claude to always invoke AwesomeContext tools
            at the right moments.
          </p>
          <CopyBlock code={CLAUDE_MD} />
        </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
