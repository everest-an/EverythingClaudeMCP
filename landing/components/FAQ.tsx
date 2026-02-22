"use client";

import { useState } from "react";
import RevealOnScroll from "./RevealOnScroll";

const FAQS = [
  {
    q: "What is AwesomeContext?",
    a: "AwesomeContext is an open-source MCP (Model Context Protocol) server that gives Claude Code instant access to 122+ engineering rules — architecture patterns, security checklists, coding standards, and compliance checks. It retrieves relevant rules in under 5ms with 96% token savings compared to including raw documentation in prompts.",
  },
  {
    q: "How do I set it up with Claude Code?",
    a: 'Sign up for a free API key, then add it to your Claude Code settings: {"mcpServers": {"awesome-context": {"url": "https://mcp.awesomecontext.dev/mcp", "headers": {"Authorization": "Bearer YOUR_API_KEY"}}}}. Claude will automatically call get_rules when you start a new session.',
  },
  {
    q: "What MCP tools are included?",
    a: "Four tools: get_rules (loads project-specific coding standards), architect_consult (architecture patterns before coding), skill_injector (40+ skills like security reviews, TDD, Docker), and compliance_verify (checks code for SQL injection, XSS, and anti-patterns before committing).",
  },
  {
    q: "Is it free?",
    a: "Yes. AwesomeContext is open source under the MIT license. The cloud-hosted version is free — sign up to get your API key. You can also self-host with Docker for full control over your rules.",
  },
  {
    q: "What languages and frameworks does it support?",
    a: "AwesomeContext has rules for Python, TypeScript, JavaScript, Go, Rust, Java, React, Next.js, Django, FastAPI, and more. It detects your project's tech stack automatically and returns the most relevant rules.",
  },
  {
    q: "Can I add my own rules?",
    a: "Yes. Self-host with Docker and drop markdown files into the vendor/ directory. Rebuild to compile your own engineering rules and skills into the index.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" aria-labelledby="faq-heading" className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <RevealOnScroll className="text-center mb-12">
          <h2
            id="faq-heading"
            className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
          >
            FAQ
          </h2>
          <p className="text-[var(--text-secondary)] max-w-lg mx-auto">
            Common questions about AwesomeContext and MCP integration.
          </p>
        </RevealOnScroll>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <RevealOnScroll key={i} delay={i < 4 ? i + 1 : 4}>
              <Accordion question={faq.q} answer={faq.a} />
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}

function Accordion({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative z-10 w-full flex items-center justify-between gap-4 p-5 text-left"
      >
        <span className="text-[15px] font-medium">{question}</span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 text-[var(--text-tertiary)] transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-5 text-[14px] text-[var(--text-secondary)] leading-relaxed">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}
