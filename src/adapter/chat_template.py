"""ChatML prompt builders for Qwen3/Qwen2.5 models.

Three prompt types:
1. Rule encoding (compilation): embed a rule/skill into latent space
2. Intent query (runtime): encode a user intent for retrieval
3. Decode (runtime): decode latent states back to dense instructions
"""

from __future__ import annotations


def build_rule_encoding_prompt(
    module_type: str, module_name: str, content: str
) -> list[dict[str, str]]:
    """Build ChatML messages for encoding a rule/skill/agent into latent space.

    The system prompt establishes the model as a code assistant that has internalized
    the given rule. The user message contains the rule content. This framing causes
    the model's hidden states to encode the rule's semantics deeply.
    """
    system_msg = (
        f"You are a code assistant that has deeply internalized the following "
        f"{module_type} named '{module_name}'. When reasoning about code, "
        f"these principles are part of your core understanding."
    )
    user_msg = (
        f"Study and internalize this {module_type}:\n\n{content}\n\n"
        f"Summarize the key principles and rules you must always follow."
    )
    return [
        {"role": "system", "content": system_msg},
        {"role": "user", "content": user_msg},
    ]


def build_intent_query_prompt(intent: str) -> list[dict[str, str]]:
    """Build ChatML prompt for encoding a user intent into latent space for retrieval.

    Uses the same framing as module encoding (build_rule_encoding_prompt) so that
    the resulting hidden states live in the same embedding subspace as compiled modules.
    """
    system_msg = (
        "You are a code assistant that has deeply internalized the following "
        "rule named 'query'. When reasoning about code, "
        "these principles are part of your core understanding."
    )
    user_msg = (
        f"Study and internalize this rule:\n\n{intent}\n\n"
        f"Summarize the key principles and rules you must always follow."
    )
    return [
        {"role": "system", "content": system_msg},
        {"role": "user", "content": user_msg},
    ]


def build_decode_prompt(
    module_type: str, module_name: str
) -> list[dict[str, str]]:
    """Build ChatML prompt for decoding latent states back to dense instructions."""
    system_msg = (
        "You are a code assistant. Based on your deep understanding, "
        "provide concise, actionable instructions."
    )
    user_msg = (
        f"Based on the {module_type} '{module_name}' you have internalized, "
        f"provide the most critical implementation rules as a numbered list. "
        f"Be extremely concise."
    )
    return [
        {"role": "system", "content": system_msg},
        {"role": "user", "content": user_msg},
    ]


def build_compliance_decode_prompt() -> list[dict[str, str]]:
    """Build ChatML prompt for compliance verification decoding."""
    system_msg = (
        "You are a code compliance checker. Based on the coding rules you have "
        "internalized, evaluate the code and report violations."
    )
    user_msg = (
        "Based on the rules you have internalized, check the code for violations. "
        "Report: 1) Whether the code is compliant (yes/no), "
        "2) Specific violations found, 3) Suggested fixes. Be concise."
    )
    return [
        {"role": "system", "content": system_msg},
        {"role": "user", "content": user_msg},
    ]
