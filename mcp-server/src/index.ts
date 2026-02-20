/**
 * Latent-Link MCP Server
 *
 * Registers 3 tools for Claude Code:
 * 1. architect_consult - Architecture rule extraction from latent memory
 * 2. skill_injector - Specific skill context retrieval
 * 3. compliance_verify - Code compliance checking against latent rules
 *
 * Communicates with FastAPI backend over HTTP for tensor operations.
 * Uses stdio transport for Claude Code integration.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { handleArchitectConsult } from "./tools/architect_consult.js";
import { handleSkillInjector } from "./tools/skill_injector.js";
import { handleComplianceVerify } from "./tools/compliance_verify.js";

const server = new McpServer({
  name: "latent-link-gateway",
  version: "1.0.0",
});

// Tool 1: Architecture Consultation
server.tool(
  "architect_consult",
  "Extract architecture rules, design patterns, and best practices from latent memory. " +
    "Use BEFORE designing features, refactoring code, or making technical decisions. " +
    "Returns compressed, high-density guidance from internalized coding rules.",
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
  async (args) => handleArchitectConsult(args)
);

// Tool 2: Skill Injector
server.tool(
  "skill_injector",
  "Retrieve specific skill knowledge as dense context. " +
    "Skills include: security-review, tdd-workflow, coding-standards, docker-patterns, " +
    "api-design, database-migrations, and 40+ more. " +
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
  async (args) => handleSkillInjector(args)
);

// Tool 3: Compliance Verification
server.tool(
  "compliance_verify",
  "Check code against latent coding rules for style, security, performance, " +
    "and pattern compliance. Use BEFORE committing code to verify it meets " +
    "project standards. Returns specific violations and fix suggestions.",
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
  async (args) => handleComplianceVerify(args)
);

// Start server with stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Log to stderr (stdout is reserved for MCP JSON-RPC)
  console.error("Latent-Link MCP server started on stdio");
}

main().catch((err) => {
  console.error("Failed to start MCP server:", err);
  process.exit(1);
});
