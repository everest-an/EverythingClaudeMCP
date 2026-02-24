import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Aurora from "@/components/Aurora";

export const metadata: Metadata = {
  title: "Skills & Rules Catalog — 122+ Engineering Modules",
  description:
    "Browse all 62 injectable skills and 60 coding rule modules available in AwesomeContext. Covers security review, TDD, Docker, API design, Django, Spring Boot, Go, Python, React, and more. Free MCP server for Claude Code.",
  keywords: [
    "Claude Code skills",
    "MCP server skills",
    "AI coding rules",
    "security review tool",
    "TDD workflow",
    "Docker patterns",
    "API design patterns",
    "Django best practices",
    "Spring Boot patterns",
    "Go coding standards",
    "Python testing",
    "React patterns",
    "database migrations",
    "code review AI",
    "compliance check",
    "vibe coding tools",
    "cursor rules alternative",
    "best MCP tools for coding",
  ],
  alternates: { canonical: "/skills" },
};

interface Skill {
  id: string;
  name: string;
  description: string;
}

interface Category {
  title: string;
  icon: string;
  skills: Skill[];
}

const CATEGORIES: Category[] = [
  {
    title: "Security",
    icon: "shield",
    skills: [
      {
        id: "security-review",
        name: "Security Review",
        description:
          "Comprehensive security audit — authentication bypass vectors, input sanitization, token storage, CORS, rate limiting, timing attacks, and error message info leaks.",
      },
      {
        id: "security-scan",
        name: "Security Scan",
        description:
          "Automated scanning for security vulnerabilities, misconfigurations, and injection risks across your codebase.",
      },
      {
        id: "django-security",
        name: "Django Security",
        description:
          "Django-specific security — authentication, authorization, CSRF protection, SQL injection prevention, XSS prevention, and secure middleware patterns.",
      },
      {
        id: "springboot-security",
        name: "Spring Boot Security",
        description:
          "Spring Security best practices for authn/authz, validation, CSRF, secrets management, headers, rate limiting, and dependency security.",
      },
    ],
  },
  {
    title: "Testing & TDD",
    icon: "flask",
    skills: [
      {
        id: "tdd-workflow",
        name: "TDD Workflow",
        description:
          "Test-driven development methodology — red/green/refactor cycle, 80%+ coverage enforcement, test isolation, and refactoring guidance.",
      },
      {
        id: "e2e-testing",
        name: "E2E Testing (Playwright)",
        description:
          "Playwright end-to-end testing — Page Object Model, configuration, CI/CD integration, artifact management, and flaky test handling.",
      },
      {
        id: "python-testing",
        name: "Python Testing (pytest)",
        description:
          "Python testing with pytest — fixtures, mocking, parametrization, coverage requirements, and TDD methodology.",
      },
      {
        id: "golang-testing",
        name: "Go Testing",
        description:
          "Go testing patterns — table-driven tests, subtests, benchmarks, fuzzing, test coverage, and idiomatic TDD practices.",
      },
      {
        id: "cpp-testing",
        name: "C++ Testing (GoogleTest)",
        description:
          "C++ testing with GoogleTest/CTest — test configuration, fixture setup, mock objects, and CI integration.",
      },
      {
        id: "django-tdd",
        name: "Django TDD",
        description:
          "Django testing with pytest-django — factory_boy, mocking strategies, coverage measurement, and test-driven development methodology.",
      },
      {
        id: "springboot-tdd",
        name: "Spring Boot TDD",
        description:
          "Spring Boot TDD with JUnit 5, Mockito, MockMvc, Testcontainers, and JaCoCo coverage reporting.",
      },
      {
        id: "verification-loop",
        name: "Verification Loop",
        description:
          "Comprehensive verification system — build checks, linting, test suites, and security scans in a single automated loop.",
      },
      {
        id: "django-verification",
        name: "Django Verification",
        description:
          "Django-specific verification — migrations check, linting, tests with coverage, and security scans.",
      },
      {
        id: "springboot-verification",
        name: "Spring Boot Verification",
        description:
          "Spring Boot verification — build, static analysis, tests with coverage, and security scans in one loop.",
      },
    ],
  },
  {
    title: "API & Architecture",
    icon: "layers",
    skills: [
      {
        id: "api-design",
        name: "API Design",
        description:
          "REST API design patterns — resource naming, status codes, pagination, filtering, error responses, versioning, and rate limiting for production APIs.",
      },
      {
        id: "backend-patterns",
        name: "Backend Patterns",
        description:
          "Backend architecture patterns — API design, database optimization, and server-side best practices for Node.js, Express, and Next.js API routes.",
      },
      {
        id: "frontend-patterns",
        name: "Frontend Patterns",
        description:
          "Frontend development patterns — React, Next.js, state management, performance optimization, and UI best practices.",
      },
      {
        id: "deployment-patterns",
        name: "Deployment Patterns",
        description:
          "Deployment workflows — CI/CD pipelines, Docker containerization, health checks, rollback strategies, and zero-downtime deployments.",
      },
      {
        id: "docker-patterns",
        name: "Docker Patterns",
        description:
          "Docker and Docker Compose — multi-stage builds, container security, networking, volume strategies, and local development workflows.",
      },
    ],
  },
  {
    title: "Database",
    icon: "database",
    skills: [
      {
        id: "database-migrations",
        name: "Database Migrations",
        description:
          "Database migration best practices — schema changes, data migrations, rollbacks, zero-downtime deployments, and version control for schemas.",
      },
      {
        id: "postgres-patterns",
        name: "PostgreSQL Patterns",
        description:
          "PostgreSQL patterns — query optimization, schema design, indexing strategies, partitioning, and security hardening.",
      },
      {
        id: "clickhouse-io",
        name: "ClickHouse Analytics",
        description:
          "ClickHouse database patterns — query optimization, analytics pipelines, data engineering, and high-performance analytical workloads.",
      },
      {
        id: "jpa-patterns",
        name: "JPA / Hibernate Patterns",
        description:
          "JPA/Hibernate patterns — entity design, relationships, query optimization, transactions, auditing, and indexing strategies.",
      },
    ],
  },
  {
    title: "Python",
    icon: "python",
    skills: [
      {
        id: "python-patterns",
        name: "Python Patterns",
        description:
          "Pythonic idioms, PEP 8 standards, type hints, async/await patterns, and best practices for robust Python applications.",
      },
      {
        id: "django-patterns",
        name: "Django Patterns",
        description:
          "Django architecture — REST APIs with DRF, ORM best practices, caching strategies, signals, middleware, and project structure.",
      },
    ],
  },
  {
    title: "Java & Spring",
    icon: "coffee",
    skills: [
      {
        id: "java-coding-standards",
        name: "Java Coding Standards",
        description:
          "Java coding standards for Spring Boot — naming conventions, immutability, Optional usage, streams, exceptions, and generics.",
      },
      {
        id: "springboot-patterns",
        name: "Spring Boot Patterns",
        description:
          "Spring Boot architecture — REST API design, layered services, data access, caching, async processing, and structured logging.",
      },
    ],
  },
  {
    title: "Go",
    icon: "go",
    skills: [
      {
        id: "golang-patterns",
        name: "Go Patterns",
        description:
          "Idiomatic Go — error handling, concurrency patterns, interface design, package structure, and performance optimization.",
      },
    ],
  },
  {
    title: "C++ & Swift",
    icon: "code",
    skills: [
      {
        id: "cpp-coding-standards",
        name: "C++ Coding Standards",
        description:
          "C++ coding standards based on the C++ Core Guidelines — memory safety, RAII, smart pointers, and modern C++ patterns.",
      },
      {
        id: "swift-actor-persistence",
        name: "Swift Actor Persistence",
        description:
          "Thread-safe data persistence in Swift using actors — in-memory cache with file-backed storage and concurrency safety.",
      },
      {
        id: "swift-protocol-di-testing",
        name: "Swift Protocol DI & Testing",
        description:
          "Protocol-based dependency injection for testable Swift — mock file system, network, and external API patterns.",
      },
    ],
  },
  {
    title: "AI & LLM Patterns",
    icon: "brain",
    skills: [
      {
        id: "cost-aware-llm-pipeline",
        name: "Cost-Aware LLM Pipeline",
        description:
          "Cost optimization for LLM API usage — model routing by task complexity, budget tracking, retry logic, and prompt caching.",
      },
      {
        id: "iterative-retrieval",
        name: "Iterative Retrieval",
        description:
          "Pattern for progressively refining context retrieval — solves the subagent context problem with multi-round search.",
      },
      {
        id: "eval-harness",
        name: "Eval Harness",
        description:
          "Formal evaluation framework implementing eval-driven development (EDD) — measure, score, and improve AI coding sessions.",
      },
      {
        id: "continuous-learning",
        name: "Continuous Learning",
        description:
          "Automatically extract reusable patterns from Claude Code sessions and save them as learned skills for future use.",
      },
      {
        id: "regex-vs-llm-structured-text",
        name: "Regex vs LLM Decision Framework",
        description:
          "Decision framework for choosing between regex and LLM when parsing structured text — cost, accuracy, and latency trade-offs.",
      },
    ],
  },
  {
    title: "Workflow & Utilities",
    icon: "wrench",
    skills: [
      {
        id: "coding-standards",
        name: "Universal Coding Standards",
        description:
          "Universal coding standards and best practices for TypeScript, JavaScript, React, and Node.js development.",
      },
      {
        id: "content-hash-cache-pattern",
        name: "Content Hash Cache Pattern",
        description:
          "Cache expensive file processing with SHA-256 content hashes — path-independent, auto-invalidating, with service layer separation.",
      },
      {
        id: "strategic-compact",
        name: "Strategic Compact",
        description:
          "Manual context compaction at logical intervals to preserve context quality through long task phases.",
      },
      {
        id: "nutrient-document-processing",
        name: "Document Processing (Nutrient)",
        description:
          "Process, convert, OCR, extract, redact, sign, and fill documents using the Nutrient DWS API.",
      },
    ],
  },
];

const RULES = [
  {
    title: "Common Rules (all projects)",
    items: [
      "Coding style — naming, formatting, import ordering",
      "Security — OWASP top 10, secrets management, input validation",
      "Testing — coverage requirements, test structure, mocking patterns",
      "Performance — lazy loading, caching, query optimization",
      "Git workflow — branching, commit messages, PR conventions",
      "Patterns — design patterns, error handling, logging",
    ],
  },
  {
    title: "TypeScript Rules",
    items: [
      "Strict mode, type safety, utility types",
      "React hooks patterns, component architecture",
      "ESLint/Prettier configuration",
      "Module resolution, path aliases",
      "Testing with Jest/Vitest",
    ],
  },
  {
    title: "Python Rules",
    items: [
      "PEP 8, type hints, dataclasses",
      "Async/await patterns",
      "Virtual environments, dependency management",
      "Pytest configuration and fixtures",
      "Django/FastAPI conventions",
    ],
  },
  {
    title: "Go Rules",
    items: [
      "Effective Go, code review comments",
      "Error handling, context propagation",
      "Package structure, interface design",
      "Testing and benchmarking conventions",
      "Concurrency patterns with goroutines/channels",
    ],
  },
];

function IconForCategory({ type }: { type: string }) {
  const shared =
    "w-5 h-5 shrink-0 text-[var(--accent)]";
  switch (type) {
    case "shield":
      return (
        <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case "flask":
      return (
        <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 3h6M10 3v7.4a2 2 0 01-.6 1.4L4 17.2A2 2 0 005.4 21h13.2a2 2 0 001.4-3.8l-5.4-5.4a2 2 0 01-.6-1.4V3" />
        </svg>
      );
    case "layers":
      return (
        <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      );
    case "database":
      return (
        <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
        </svg>
      );
    default:
      return (
        <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      );
  }
}

export default function SkillsPage() {
  return (
    <>
      <Aurora />
      <Nav />
      <main className="pt-24 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Skills & Rules Catalog
            </h1>
            <p className="text-[var(--text-secondary)] max-w-2xl mx-auto text-lg leading-relaxed">
              Browse all 62 injectable skills and 60 coding rule modules. Each
              skill is a complete, production-grade knowledge pack that Claude
              Code loads on demand via MCP.
            </p>
            <p className="text-[14px] text-[var(--text-tertiary)] mt-4 max-w-xl mx-auto">
              Use{" "}
              <code className="text-[var(--accent)]">skill_injector</code>{" "}
              with any skill ID below, or let Claude auto-detect the right skill
              for your task.
            </p>
          </div>

          {/* Skills by category */}
          <h2 className="text-2xl font-bold tracking-tight mb-8">
            Injectable Skills
          </h2>

          <div className="space-y-12 mb-24">
            {CATEGORIES.map((cat) => (
              <section key={cat.title} id={cat.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}>
                <div className="flex items-center gap-3 mb-4">
                  <IconForCategory type={cat.icon} />
                  <h3 className="text-xl font-semibold">{cat.title}</h3>
                  <span className="text-[12px] text-[var(--text-tertiary)]">
                    {cat.skills.length} skill{cat.skills.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {cat.skills.map((skill) => (
                    <div
                      key={skill.id}
                      id={skill.id}
                      className="glass-card rounded-xl p-5"
                    >
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="font-medium text-[15px]">
                          {skill.name}
                        </span>
                        <code className="text-[11px] text-[var(--accent)] opacity-70">
                          skills/{skill.id}
                        </code>
                      </div>
                      <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                        {skill.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Rules */}
          <h2 className="text-2xl font-bold tracking-tight mb-8">
            Coding Rules
          </h2>
          <p className="text-[var(--text-secondary)] mb-8 max-w-2xl">
            60 rule modules loaded automatically by{" "}
            <code className="text-[var(--accent)]">get_rules</code> based on
            your project type. Rules cover coding style, security, testing,
            performance, and workflow conventions.
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-16">
            {RULES.map((group) => (
              <div key={group.title} className="glass-card rounded-xl p-5">
                <h3 className="font-medium text-[15px] mb-3">{group.title}</h3>
                <ul className="space-y-1.5">
                  {group.items.map((item, i) => (
                    <li
                      key={i}
                      className="text-[13px] text-[var(--text-secondary)] flex items-start gap-2"
                    >
                      <span className="text-[var(--accent)] mt-0.5 shrink-0">
                        &bull;
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <p className="text-[var(--text-secondary)] mb-4">
              All skills are free and available via the cloud MCP server.
            </p>
            <a
              href="/login"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[var(--accent)] text-white text-[14px] font-medium btn-glow"
            >
              Get Started
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
