/**
 * Tool 3: compliance_verify
 *
 * Check code against latent coding rules for style, security, performance,
 * and pattern compliance. Returns rule violations and suggestions.
 */

import type { LatentQueryResponse } from "../types.js";
import { queryLatentBackend } from "../client.js";

export async function handleComplianceVerify(args: {
  code: string;
  rules_filter?: string;
  session_id?: string;
}): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  const response: LatentQueryResponse = await queryLatentBackend({
    code: args.code,
    tool_name: "compliance_verify",
    module_type_filter: args.rules_filter || "rule",
    top_k: 5,
    session_id: args.session_id,
  });

  const rulesList = response.matched_modules
    .map(
      (m) =>
        `  - [${m.score.toFixed(2)}] **${m.name}**: ${m.description.slice(0, 80)}`
    )
    .join("\n");

  const text = [
    `## Compliance Check`,
    ``,
    response.dense_prompt,
    ``,
    `---`,
    `**Rules matched:**`,
    rulesList,
    `**Tokens saved:** ${response.metrics.tokens_saved} | **Time:** ${response.metrics.total_time_ms.toFixed(0)}ms`,
  ].join("\n");

  return { content: [{ type: "text", text }] };
}
