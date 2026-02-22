/**
 * AwesomeContext MCP Server — HTTP Transport (Cloud Mode)
 *
 * Exposes the same 4 tools as the stdio server, but over HTTP
 * so users can connect via a URL without installing anything.
 *
 * Supports both:
 *   - Streamable HTTP (POST /mcp)  — recommended, modern
 *   - SSE legacy      (GET  /sse + POST /messages)
 *
 * Usage:
 *   node dist/server-http.js                    # default port 3000
 *   MCP_PORT=8080 node dist/server-http.js      # custom port
 *
 * Claude Code config:
 *   { "mcpServers": { "awesome-context": { "url": "https://your-host/mcp" } } }
 */

import express, { Request, Response } from "express";
import cors from "cors";
import { randomUUID } from "crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";

import { handleGetRules } from "./tools/get_rules.js";
import { handleArchitectConsult } from "./tools/architect_consult.js";
import { handleSkillInjector } from "./tools/skill_injector.js";
import { handleComplianceVerify } from "./tools/compliance_verify.js";
import { authMiddleware, logUsageAsync, type AuthInfo } from "./auth-middleware.js";

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

function log(message: string) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${message}`);
}

// ---------------------------------------------------------------------------
// Server factory — creates a fresh McpServer with all 4 tools registered
// ---------------------------------------------------------------------------

function createMcpServer(authInfo?: AuthInfo): McpServer {
  const server = new McpServer({
    name: "awesome-context",
    version: "1.0.0",
  });

  // Tool 0: Auto-load rules (called at conversation start)
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
      const startTime = Date.now();
      log(`get_rules: project_type="${args.project_type}"`);
      try {
        const result = await handleGetRules(args);
        log(`get_rules done: ${result.content[0]?.text?.length ?? 0} chars`);
        if (authInfo) logUsageAsync(authInfo, "get_rules", Date.now() - startTime);
        return result;
      } catch (err: any) {
        log(`get_rules ERROR: ${err.message}`);
        return {
          content: [
            {
              type: "text" as const,
              text: `## Backend Unavailable\n\nError: ${err.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool 1: Architecture Consultation
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
          "Architectural intent or question, e.g. 'design a REST API with auth'"
        ),
      session_id: z
        .string()
        .optional()
        .describe("Session ID for context continuity across queries"),
    },
    async (args) => {
      const startTime = Date.now();
      log(`architect_consult: intent="${args.intent}"`);
      try {
        const result = await handleArchitectConsult(args);
        log(
          `architect_consult done: ${result.content[0]?.text?.length ?? 0} chars`
        );
        if (authInfo) logUsageAsync(authInfo, "architect_consult", Date.now() - startTime);
        return result;
      } catch (err: any) {
        log(`architect_consult ERROR: ${err.message}`);
        return {
          content: [
            {
              type: "text" as const,
              text: `## Backend Unavailable\n\nThe AwesomeContext backend is not reachable. Please ensure the service is running.\n\nError: ${err.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool 2: Skill Injector
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
      const startTime = Date.now();
      log(`skill_injector: skill_id="${args.skill_id}"`);
      try {
        const result = await handleSkillInjector(args);
        log(
          `skill_injector done: ${result.content[0]?.text?.length ?? 0} chars`
        );
        if (authInfo) logUsageAsync(authInfo, "skill_injector", Date.now() - startTime);
        return result;
      } catch (err: any) {
        log(`skill_injector ERROR: ${err.message}`);
        return {
          content: [
            {
              type: "text" as const,
              text: `## Backend Unavailable\n\nThe AwesomeContext backend is not reachable.\n\nError: ${err.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool 3: Compliance Verification
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
      const startTime = Date.now();
      log(
        `compliance_verify: code=${args.code?.length ?? 0} chars, filter="${args.rules_filter ?? "none"}"`
      );
      try {
        const result = await handleComplianceVerify(args);
        log(
          `compliance_verify done: ${result.content[0]?.text?.length ?? 0} chars`
        );
        if (authInfo) logUsageAsync(authInfo, "compliance_verify", Date.now() - startTime);
        return result;
      } catch (err: any) {
        log(`compliance_verify ERROR: ${err.message}`);
        return {
          content: [
            {
              type: "text" as const,
              text: `## Backend Unavailable\n\nThe AwesomeContext backend is not reachable.\n\nError: ${err.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  return server;
}

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------

const app = express();
app.use(cors());
app.use(express.json());

// API key auth middleware (skip /health)
app.use(authMiddleware(["/health"]));

// ---------------------------------------------------------------------------
// Transport A: Streamable HTTP  (POST/GET/DELETE  /mcp)
// ---------------------------------------------------------------------------

// Session store for Streamable HTTP
const streamableSessions = new Map<
  string,
  { transport: StreamableHTTPServerTransport; server: McpServer }
>();

// POST /mcp — initialize or send messages
app.post("/mcp", async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  // Existing session
  if (sessionId && streamableSessions.has(sessionId)) {
    const session = streamableSessions.get(sessionId)!;
    await session.transport.handleRequest(req, res, req.body);
    return;
  }

  // New session — create server + transport
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });
  const server = createMcpServer(req.authInfo);
  await server.connect(transport);

  // handleRequest sets the sessionId, so store AFTER it runs
  await transport.handleRequest(req, res, req.body);

  if (transport.sessionId) {
    streamableSessions.set(transport.sessionId, { transport, server });
    log(`New Streamable HTTP session: ${transport.sessionId}`);
  }
});

// GET /mcp — SSE stream for server-initiated notifications
app.get("/mcp", async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !streamableSessions.has(sessionId)) {
    res.status(400).json({ error: "Invalid or missing session ID" });
    return;
  }
  const session = streamableSessions.get(sessionId)!;
  await session.transport.handleRequest(req, res, req.body);
});

// DELETE /mcp — close session
app.delete("/mcp", async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (sessionId && streamableSessions.has(sessionId)) {
    const session = streamableSessions.get(sessionId)!;
    await session.transport.handleRequest(req, res, req.body);
    streamableSessions.delete(sessionId);
    log(`Session closed: ${sessionId}`);
  } else {
    res.status(404).json({ error: "Session not found" });
  }
});

// ---------------------------------------------------------------------------
// Transport B: SSE legacy  (GET /sse  +  POST /messages)
// ---------------------------------------------------------------------------

const sseSessions = new Map<
  string,
  { transport: SSEServerTransport; server: McpServer }
>();

// GET /sse — establish SSE connection
app.get("/sse", async (req: Request, res: Response) => {
  log("New SSE connection");
  const transport = new SSEServerTransport("/messages", res);
  const server = createMcpServer(req.authInfo);

  sseSessions.set(transport.sessionId, { transport, server });

  req.on("close", () => {
    sseSessions.delete(transport.sessionId);
    log(`SSE session closed: ${transport.sessionId}`);
  });

  await server.connect(transport);
});

// POST /messages — receive JSON-RPC messages from client
app.post("/messages", async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;
  const session = sseSessions.get(sessionId);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  await session.transport.handlePostMessage(req, res);
});

// ---------------------------------------------------------------------------
// Health / info endpoints
// ---------------------------------------------------------------------------

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    transport: ["streamable-http", "sse"],
    tools: ["get_rules", "architect_consult", "skill_injector", "compliance_verify"],
    sessions: {
      streamable: streamableSessions.size,
      sse: sseSessions.size,
    },
  });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const PORT = parseInt(process.env.MCP_PORT || "3000", 10);
const STRICT_AUTH = process.env.AC_STRICT_AUTH === "true";

app.listen(PORT, () => {
  log(`AwesomeContext MCP HTTP server listening on port ${PORT}`);
  log(`  Streamable HTTP: http://localhost:${PORT}/mcp`);
  log(`  SSE (legacy):    http://localhost:${PORT}/sse`);
  log(`  Health:          http://localhost:${PORT}/health`);
  log(`  Backend:         ${process.env.AC_BACKEND_URL || "http://127.0.0.1:8420"}`);
  if (process.env.AC_PUBLIC_MODE === "true") {
    log("  Auth mode:       PUBLIC (no key required)");
  } else if (STRICT_AUTH) {
    log("  Auth mode:       STRICT (missing/invalid key returns 401/503)");
  } else {
    log("  Auth mode:       FAIL-OPEN (missing/invalid key allowed as public)");
  }
});
