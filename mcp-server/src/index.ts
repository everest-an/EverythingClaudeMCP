/**
 * AwesomeContext MCP Server — stdio transport (local mode)
 *
 * Registers 4 tools for Claude Code:
 * 1. get_rules           — Auto-load project rules at conversation start
 * 2. architect_consult   — Architecture guidance before writing code
 * 3. skill_injector      — Domain-specific skill retrieval
 * 4. compliance_verify   — Code compliance checking before commit
 *
 * Communicates with FastAPI backend over HTTP for tensor operations.
 * Uses stdio transport for Claude Code integration.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { appendFileSync } from "fs";
import { join } from "path";

import { handleGetRules } from "./tools/get_rules.js";
import { handleArchitectConsult } from "./tools/architect_consult.js";
import { handleSkillInjector } from "./tools/skill_injector.js";
import { handleComplianceVerify } from "./tools/compliance_verify.js";

const LOG_FILE = join(process.env.TEMP || "/tmp", "awesome-context-mcp.log");

function log(message: string) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${message}\n`;
  try { appendFileSync(LOG_FILE, line); } catch {}
  console.error(line.trimEnd());
}

const server = new McpServer({
  name: "awesome-context",
  version: "1.0.0",
});

// -------------------------------------------------------------------------
// Tool 0: Auto-load rules (called at conversation start)
// -------------------------------------------------------------------------
server.tool(
  "get_rules",
  "IMPORTANT: Call this tool at the START of every conversation to load project-specific " +
    "coding rules, security guidelines, and best practices. Detects the project's tech stack " +
    "(python, typescript, golang, react, django, etc.) and returns the most relevant rules " +
    "that should be followed throughout the session. This is your primary knowledge source " +
    "for coding standards.",
  {
    project_type: z
      .string()
      .describe(
        "The detected project tech stack. Examples: 'python', 'typescript', 'react', " +
          "'django', 'golang', 'nextjs', 'fastapi', 'fullstack', 'docker', 'api'"
      ),
  },
  async (args) => {
    log(`get_rules called: project_type="${args.project_type}"`);
    try {
      const result = await handleGetRules(args);
      log(`get_rules done: ${result.content[0]?.text?.length ?? 0} chars returned`);
      return result;
    } catch (err: any) {
      log(`get_rules ERROR: ${err.message}`);
      return {
        content: [{ type: "text" as const, text: `## Backend Unavailable\n\nError: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// -------------------------------------------------------------------------
// Tool 1: Architecture Consultation
// -------------------------------------------------------------------------
server.tool(
  "architect_consult",
  "ALWAYS call this tool BEFORE writing any code that involves design decisions, " +
    "new features, API design, database schema, or system architecture. Returns " +
    "production-grade patterns, security guidelines, and best practices from " +
    "internalized engineering rules. Do NOT skip this step — poor architecture " +
    "decisions are expensive to fix later.",
  {
    intent: z
      .string()
      .describe(
        "Architectural intent or question, e.g. 'design a REST API with auth' " +
          "or 'implement a React dashboard with state management'"
      ),
    session_id: z
      .string()
      .optional()
      .describe("Session ID for context continuity across queries"),
  },
  async (args) => {
    log(`architect_consult called: intent="${args.intent}"`);
    try {
      const result = await handleArchitectConsult(args);
      log(`architect_consult done: ${result.content[0]?.text?.length ?? 0} chars returned`);
      return result;
    } catch (err: any) {
      log(`architect_consult ERROR: ${err.message}`);
      return {
        content: [{ type: "text" as const, text: `## Backend Unavailable\n\nError: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// -------------------------------------------------------------------------
// Tool 2: Skill Injector
// -------------------------------------------------------------------------
server.tool(
  "skill_injector",
  "ALWAYS call when the task involves specific domains: testing (tdd-workflow), " +
    "security (security-review), Docker (docker-patterns), APIs (api-design), " +
    "database (database-migrations), code review (code-review), or any specialized " +
    "engineering practice. Has 40+ skills covering all major development areas. " +
    "Pass 'list' as skill_id to see all available skills.",
  {
    skill_id: z
      .string()
      .describe(
        "Skill identifier (e.g. 'skills/security-review', 'skills/tdd-workflow'). " +
          "Use 'list' to see all available skills."
      ),
    session_id: z
      .string()
      .optional()
      .describe("Session ID for context continuity"),
  },
  async (args) => {
    log(`skill_injector called: skill_id="${args.skill_id}"`);
    try {
      const result = await handleSkillInjector(args);
      log(`skill_injector done: ${result.content[0]?.text?.length ?? 0} chars returned`);
      return result;
    } catch (err: any) {
      log(`skill_injector ERROR: ${err.message}`);
      return {
        content: [{ type: "text" as const, text: `## Backend Unavailable\n\nError: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// -------------------------------------------------------------------------
// Tool 3: Compliance Verification
// -------------------------------------------------------------------------
server.tool(
  "compliance_verify",
  "ALWAYS call BEFORE finalizing or committing code changes. Checks code against " +
    "coding rules for style, security vulnerabilities, performance anti-patterns, " +
    "and project standards. Returns specific violations and fix suggestions. " +
    "Skipping this step risks shipping non-compliant code.",
  {
    code: z
      .string()
      .describe("Code snippet to verify against latent rules"),
    rules_filter: z
      .string()
      .optional()
      .describe("Optional filter: 'common', 'typescript', 'python', 'golang'"),
    session_id: z
      .string()
      .optional()
      .describe("Session ID for context continuity"),
  },
  async (args) => {
    log(`compliance_verify called: code=${args.code?.length ?? 0} chars, filter="${args.rules_filter ?? "none"}"`);
    try {
      const result = await handleComplianceVerify(args);
      log(`compliance_verify done: ${result.content[0]?.text?.length ?? 0} chars returned`);
      return result;
    } catch (err: any) {
      log(`compliance_verify ERROR: ${err.message}`);
      return {
        content: [{ type: "text" as const, text: `## Backend Unavailable\n\nError: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// Start server with stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log(`MCP server started (stdio). Log file: ${LOG_FILE}`);
}

main().catch((err) => {
  console.error("Failed to start MCP server:", err);
  process.exit(1);
});
