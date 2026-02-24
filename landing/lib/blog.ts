export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  readingTime: string;
  sections: { heading?: string; paragraphs: string[] }[];
}

export const posts: BlogPost[] = [
  {
    slug: "best-mcp-servers-claude-code-2026",
    title: "Best MCP Servers for Claude Code in 2026",
    description:
      "A curated guide to the most useful MCP servers that supercharge Claude Code — from coding rules engines to database tools, file search, and more.",
    date: "2026-02-23",
    tags: ["MCP", "Claude Code", "developer tools"],
    readingTime: "5 min",
    sections: [
      {
        paragraphs: [
          "Model Context Protocol (MCP) servers let Claude Code reach beyond its built-in capabilities. Instead of pasting documentation into every prompt, an MCP server delivers precisely the context Claude needs — on demand, in milliseconds.",
          "Below we cover the most impactful MCP servers available today and explain when each one shines.",
        ],
      },
      {
        heading: "What Is an MCP Server?",
        paragraphs: [
          "An MCP server exposes tools that Claude Code can call during a session. Think of it as a plugin system: Claude discovers available tools, decides when to use them, and calls them with structured arguments. The server responds with context that Claude weaves into its reasoning.",
          "This means you can give Claude access to live databases, file systems, coding standards, and more — without bloating your prompt.",
        ],
      },
      {
        heading: "1. AwesomeContext — Coding Rules Engine",
        paragraphs: [
          "AwesomeContext is an open-source MCP server that gives Claude Code instant access to 122+ engineering rules. It covers architecture patterns (REST API design, microservices), security checklists (OWASP top 10), 40+ injectable skills (TDD, Docker, database migrations), and real-time compliance verification.",
          "Setup takes 30 seconds: sign up for a free API key, add one JSON block to your Claude Code settings, and Claude automatically loads project-specific rules at the start of every session. Retrieval is under 5ms with 96% token savings compared to pasting raw docs.",
          "Best for: teams that want consistent coding standards enforced automatically, developers who want architecture guidance without context-switching to documentation.",
        ],
      },
      {
        heading: "2. Filesystem MCP — Local File Access",
        paragraphs: [
          "The official Filesystem MCP server gives Claude Code read and write access to directories on your machine. This is useful when Claude needs to browse project structures, read config files, or write generated code directly to disk.",
          "Best for: scaffolding projects, generating boilerplate, batch file operations.",
        ],
      },
      {
        heading: "3. GitHub MCP — Repository Integration",
        paragraphs: [
          "The GitHub MCP server connects Claude to your repositories. It can read issues, pull requests, commit history, and even create PRs. This turns Claude into a code review assistant that understands your project history.",
          "Best for: automated PR reviews, issue triage, commit message generation.",
        ],
      },
      {
        heading: "4. Database MCP Servers",
        paragraphs: [
          "Several MCP servers provide direct database access — PostgreSQL, SQLite, and others. Claude can inspect schemas, run read queries, and help you write migrations. Combined with a rules engine like AwesomeContext, Claude can check your SQL against security best practices in real time.",
          "Best for: data exploration, migration generation, schema design.",
        ],
      },
      {
        heading: "How to Set Up Any MCP Server",
        paragraphs: [
          "All MCP servers follow the same pattern. In your Claude Code settings (or .claude.json), add the server under mcpServers with its URL and any required headers like API keys. Claude discovers the tools automatically.",
          "You can run multiple MCP servers simultaneously. For example, AwesomeContext for coding rules plus a database MCP for schema access gives Claude both standards enforcement and live data context.",
        ],
      },
      {
        heading: "Conclusion",
        paragraphs: [
          "MCP servers are the fastest way to level up Claude Code. Start with a coding rules engine to enforce standards, add file or database access as needed, and layer in GitHub integration for team workflows. The ecosystem is growing fast — 2026 is the year MCP goes mainstream.",
        ],
      },
    ],
  },
  {
    slug: "vibe-coding-claude-code-guide",
    title: "Vibe Coding with Claude Code: The Complete Guide",
    description:
      "Learn how to vibe code effectively with Claude Code — from setup tips to advanced MCP integrations that make AI-assisted development faster and more reliable.",
    date: "2026-02-23",
    tags: ["vibe coding", "Claude Code", "AI development"],
    readingTime: "6 min",
    sections: [
      {
        paragraphs: [
          "Vibe coding is the practice of building software by describing what you want in natural language and letting an AI assistant handle the implementation. Claude Code has emerged as one of the most powerful tools for this workflow — and with MCP servers, it gets even better.",
        ],
      },
      {
        heading: "What Makes Vibe Coding Different",
        paragraphs: [
          "Traditional coding means writing every line yourself. Copilot-style tools autocomplete one line at a time. Vibe coding is a level beyond: you describe the feature, the architecture, or the bug, and the AI writes entire functions, files, or systems.",
          "The key skill shifts from typing code to communicating intent clearly. You become an architect and reviewer rather than a typist.",
        ],
      },
      {
        heading: "Setting Up Claude Code for Vibe Coding",
        paragraphs: [
          "Install Claude Code via npm (npm install -g @anthropic-ai/claude-code) or use it through the VS Code extension. The CLI works in any terminal alongside your existing tools.",
          "Create a CLAUDE.md file in your project root. This is your persistent instruction file — Claude reads it at the start of every session. Include your tech stack, coding conventions, file structure notes, and any preferences. Think of it as onboarding documentation for your AI pair programmer.",
        ],
      },
      {
        heading: "Level Up with MCP Servers",
        paragraphs: [
          "CLAUDE.md is great for project-specific context, but MCP servers deliver reusable, structured knowledge. AwesomeContext, for example, provides 122+ engineering rules that Claude can query on demand — architecture patterns, security checklists, compliance verification, and 40+ specialized skills.",
          "Instead of writing 'always use parameterized queries' in your CLAUDE.md, the compliance_verify tool catches SQL injection automatically. Instead of documenting REST API patterns, the architect_consult tool delivers production-grade patterns when Claude is designing an endpoint.",
          "This separation of concerns keeps your CLAUDE.md focused on project specifics while MCP servers handle universal engineering knowledge.",
        ],
      },
      {
        heading: "Effective Prompting Patterns",
        paragraphs: [
          "Be specific about what you want but flexible about how. Say 'add user authentication with JWT tokens stored in httpOnly cookies' rather than 'add login'. Give Claude the constraints and let it choose the implementation.",
          "Break large features into steps. Instead of 'build an e-commerce site', start with 'create the product listing API endpoint with pagination'. Review each step before moving to the next.",
          "Use Claude's plan mode for complex features. It will explore your codebase, design an approach, and ask for approval before writing code. This prevents wasted effort on misaligned implementations.",
        ],
      },
      {
        heading: "Common Pitfalls and How to Avoid Them",
        paragraphs: [
          "Over-delegation: Don't ask Claude to build an entire app in one prompt. The quality drops with scope. Keep requests focused.",
          "Skipping review: Always review generated code. Claude is good but not infallible. Use tools like AwesomeContext's compliance_verify to catch issues automatically.",
          "Ignoring context limits: Long conversations degrade quality. Start fresh sessions for new features. Use CLAUDE.md and MCP servers to provide persistent context without eating your context window.",
        ],
      },
      {
        heading: "Claude Code vs Cursor: Which to Choose?",
        paragraphs: [
          "Both are excellent. Cursor provides a full IDE experience with inline AI editing. Claude Code is a CLI tool that works in any terminal and supports MCP for extensibility. Many developers use both — Cursor for visual editing sessions and Claude Code for complex multi-file tasks, git operations, and automated workflows.",
          "If you value extensibility through MCP servers, Claude Code has the edge. If you prefer an integrated IDE experience, Cursor is hard to beat. The tools are complementary, not competing.",
        ],
      },
    ],
  },
  {
    slug: "cursor-rules-vs-claude-code-mcp",
    title: "Cursor Rules vs Claude Code MCP: How to Give AI Coding Context",
    description:
      "Compare Cursor's .cursorrules with Claude Code's MCP servers. Learn the best way to give your AI coding assistant persistent project knowledge and engineering standards.",
    date: "2026-02-23",
    tags: ["Cursor", "Claude Code", "MCP", "coding rules"],
    readingTime: "4 min",
    sections: [
      {
        paragraphs: [
          "Both Cursor and Claude Code let you teach your AI assistant about your project. Cursor uses .cursorrules files, Claude Code uses CLAUDE.md plus MCP servers. Here is how they compare and when to use each approach.",
        ],
      },
      {
        heading: "Cursor Rules: Simple and Direct",
        paragraphs: [
          "Cursor reads a .cursorrules file from your project root. You write plain-text instructions — coding conventions, preferred libraries, patterns to follow or avoid. Cursor injects these into every prompt automatically.",
          "Strengths: zero setup, works immediately, easy to understand. Limitations: everything is plain text (no structured queries), rules count against your context window, and there is no way to dynamically load different rules based on what you are doing.",
        ],
      },
      {
        heading: "Claude Code CLAUDE.md: Project-Specific Context",
        paragraphs: [
          "Claude Code reads CLAUDE.md from your project root — similar concept to .cursorrules. Write your tech stack, conventions, and preferences in markdown. Claude loads it at session start.",
          "The key difference is that CLAUDE.md is just one layer. Claude Code also supports MCP servers for dynamic, structured context delivery.",
        ],
      },
      {
        heading: "MCP Servers: Dynamic Rules on Demand",
        paragraphs: [
          "MCP servers like AwesomeContext deliver context only when needed. Instead of loading all 122 engineering rules into every prompt (which would blow your context window), Claude queries specific rules on demand — architecture patterns when designing, security checklists when reviewing, compliance checks before committing.",
          "This means sub-5ms retrieval with 96% token savings. Your context window stays clean for actual code while Claude still has access to comprehensive engineering knowledge.",
          "MCP also supports tool composition. Claude can call architect_consult for design patterns, then compliance_verify to check the result — all within a single response. This is not possible with static rules files.",
        ],
      },
      {
        heading: "Best of Both Worlds",
        paragraphs: [
          "The optimal setup combines static and dynamic context. Use CLAUDE.md (or .cursorrules) for project-specific information: your tech stack, file structure, deployment process, team conventions. Use MCP servers for universal engineering knowledge: architecture patterns, security standards, testing workflows.",
          "If you use Cursor, you can still benefit from MCP indirectly — run AwesomeContext locally and reference its rules in your .cursorrules. But the native MCP integration in Claude Code makes this seamless.",
        ],
      },
      {
        heading: "Getting Started",
        paragraphs: [
          "For Claude Code: sign up at awesomecontext.awareness.market for a free API key, add it to your MCP settings, and Claude will automatically call get_rules when starting a new session. Create a CLAUDE.md for project-specific notes.",
          "For Cursor: create a .cursorrules file with your project conventions. Browse the AwesomeContext skills catalog for inspiration on what rules to include. Consider using Claude Code alongside Cursor for tasks that benefit from MCP integration.",
        ],
      },
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getAllSlugs(): string[] {
  return posts.map((p) => p.slug);
}
