/**
 * Tool 2: skill_injector
 *
 * Retrieve specific skill knowledge (e.g., security-review, tdd-workflow)
 * as dense context. Pass 'list' as skill_id to see available skills.
 */

import type { LatentQueryResponse } from "../types.js";
import { queryLatentBackend, listModules } from "../client.js";

export async function handleSkillInjector(args: {
  skill_id: string;
  session_id?: string;
}): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  // Special case: list all available skills
  if (args.skill_id === "list") {
    const moduleList = await listModules("skill");
    const lines = moduleList.modules.map(
      (m) => `- **${m.module_id}**: ${m.name} — ${m.description.slice(0, 100)}`
    );
    return {
      content: [
        {
          type: "text",
          text: [
            `## Available Skills (${moduleList.total})`,
            ``,
            ...lines,
            ``,
            `Use any module_id above as the skill_id parameter.`,
          ].join("\n"),
        },
      ],
    };
  }

  const response: LatentQueryResponse = await queryLatentBackend({
    skill_id: args.skill_id,
    tool_name: "skill_injector",
    session_id: args.session_id,
  });

  const matchedName =
    response.matched_modules[0]?.name || args.skill_id;

  const text = [
    `## Skill: ${matchedName}`,
    ``,
    response.dense_prompt,
    ``,
    `---`,
    `**Tokens saved:** ${response.metrics.tokens_saved} | **Time:** ${response.metrics.total_time_ms.toFixed(0)}ms`,
  ].join("\n");

  return { content: [{ type: "text", text }] };
}
