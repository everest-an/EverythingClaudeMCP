/**
 * Tool: get_rules
 *
 * Auto-invoked at the start of every conversation to load project-specific
 * coding rules, security guidelines, and best practices.
 *
 * Detects the project's tech stack and returns the most relevant rules.
 */

import type { LatentQueryResponse } from "../types.js";
import { queryLatentBackend, listModules } from "../client.js";

/** Map user-friendly project types to search intents */
const STACK_INTENTS: Record<string, string> = {
  python: "python coding standards security testing best practices",
  typescript: "typescript coding standards security testing patterns",
  javascript: "typescript javascript coding standards patterns",
  react: "react typescript frontend component patterns testing",
  nextjs: "react nextjs typescript frontend server components",
  django: "django python REST API security database patterns",
  fastapi: "python fastapi REST API security async patterns",
  golang: "golang coding standards security testing concurrency",
  go: "golang coding standards security testing concurrency",
  rust: "rust coding standards security memory safety patterns",
  docker: "docker containerization deployment security patterns",
  api: "REST API design authentication security patterns",
  database: "database migrations security SQL patterns",
  fullstack: "typescript react API security testing database patterns",
};

export async function handleGetRules(args: {
  project_type: string;
}): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  const stackKey = args.project_type.toLowerCase().trim();
  const intent = STACK_INTENTS[stackKey] || `${stackKey} coding standards security best practices`;

  // Fetch rules (coding standards, security, testing guidelines)
  const rulesResponse: LatentQueryResponse = await queryLatentBackend({
    intent,
    tool_name: "get_rules",
    top_k: 5,
    module_type_filter: "rule",
  });

  // Fetch relevant skills (patterns, workflows)
  const skillsResponse: LatentQueryResponse = await queryLatentBackend({
    intent,
    tool_name: "get_rules",
    top_k: 3,
  });

  // Build a condensed rules summary
  const sections: string[] = [];

  sections.push(`# Active Rules for: ${args.project_type}\n`);
  sections.push(
    `> These rules were automatically loaded based on your project type. ` +
      `Follow them when writing, reviewing, and committing code.\n`
  );

  // Rules section
  if (rulesResponse.matched_modules.length > 0) {
    sections.push(`## Coding Rules\n`);
    sections.push(rulesResponse.dense_prompt);
  }

  // Skills section (condensed)
  if (skillsResponse.matched_modules.length > 0) {
    const skillNames = skillsResponse.matched_modules
      .map((m) => `- **${m.name}** (${m.module_type}): ${m.description.slice(0, 120)}`)
      .join("\n");
    sections.push(`\n## Available Skills\n`);
    sections.push(
      `The following skills are available. Use \`skill_injector\` to load full details when needed:\n`
    );
    sections.push(skillNames);
  }

  // Reminder about other tools
  sections.push(`\n---\n`);
  sections.push(`## Auto-Invocation Reminders\n`);
  sections.push(
    `- **Before writing code**: Call \`architect_consult\` with your design intent\n` +
      `- **Before committing**: Call \`compliance_verify\` with your code changes\n` +
      `- **For specific domains**: Call \`skill_injector\` (e.g., 'skills/security-review', 'skills/tdd-workflow')\n`
  );

  const text = sections.join("\n");

  return { content: [{ type: "text", text }] };
}
