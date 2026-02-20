/**
 * Tool 1: architect_consult
 *
 * Extract architecture rules, design patterns, and best practices from latent memory.
 * Use when planning features, reviewing architecture, or making technical decisions.
 */

import type { LatentQueryResponse } from "../types.js";
import { queryLatentBackend } from "../client.js";

export async function handleArchitectConsult(args: {
  intent: string;
  session_id?: string;
}): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  const response: LatentQueryResponse = await queryLatentBackend({
    intent: args.intent,
    session_id: args.session_id,
    tool_name: "architect_consult",
    top_k: 5,
  });

  const moduleList = response.matched_modules
    .map(
      (m) => `  - [${m.score.toFixed(2)}] **${m.name}** (${m.module_type})`
    )
    .join("\n");

  const text = [
    `## Architecture Guidance`,
    ``,
    response.dense_prompt,
    ``,
    `---`,
    `**Matched modules:**`,
    moduleList,
    `**Tokens saved:** ${response.metrics.tokens_saved} | **Time:** ${response.metrics.total_time_ms.toFixed(0)}ms`,
  ].join("\n");

  return { content: [{ type: "text", text }] };
}
