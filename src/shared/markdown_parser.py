"""Parse markdown files with optional YAML frontmatter.

Handles the three distinct formats in everything-claude-code:
1. YAML frontmatter + body (agents, skills, commands)
2. Plain markdown (rules, contexts)
3. JSON files (hooks)
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

import frontmatter

from .types import ParsedModule

logger = logging.getLogger(__name__)


def parse_markdown_file(filepath: str | Path, module_type: str) -> ParsedModule | None:
    """Parse a single markdown file into a ParsedModule.

    Args:
        filepath: Path to the markdown file
        module_type: Type of module (agent, skill, rule, command, context)

    Returns:
        ParsedModule or None if parsing fails
    """
    filepath = Path(filepath)
    if not filepath.exists():
        logger.warning("File not found: %s", filepath)
        return None

    try:
        text = filepath.read_text(encoding="utf-8")
    except Exception as e:
        logger.error("Failed to read %s: %s", filepath, e)
        return None

    # Try parsing YAML frontmatter
    try:
        post = frontmatter.loads(text)
        metadata = dict(post.metadata) if post.metadata else {}
        content = post.content
    except Exception:
        # No frontmatter or parse error: treat entire file as content
        metadata = {}
        content = text

    # Extract name and description from metadata or derive from filename
    name = metadata.get("name", filepath.stem)
    description = metadata.get("description", "")

    # Build module_id from path
    module_id = _derive_module_id(filepath, module_type)

    if not content.strip():
        logger.warning("Empty content in %s", filepath)
        return None

    return ParsedModule(
        module_id=module_id,
        module_type=module_type,
        name=str(name),
        description=str(description),
        content=content.strip(),
        source_path=str(filepath),
        metadata=metadata,
    )


def parse_hooks_json(filepath: str | Path) -> list[ParsedModule]:
    """Parse hooks.json into multiple ParsedModule entries (one per hook).

    Args:
        filepath: Path to hooks.json

    Returns:
        List of ParsedModule, one per hook entry
    """
    filepath = Path(filepath)
    if not filepath.exists():
        return []

    try:
        data = json.loads(filepath.read_text(encoding="utf-8"))
    except Exception as e:
        logger.error("Failed to parse hooks.json: %s", e)
        return []

    modules = []
    hooks = data.get("hooks", data) if isinstance(data, dict) else data

    if isinstance(hooks, dict):
        # Handle {event_name: [hook_list]} structure
        for event_name, hook_list in hooks.items():
            if not isinstance(hook_list, list):
                hook_list = [hook_list]
            for i, hook in enumerate(hook_list):
                if isinstance(hook, dict):
                    matcher = hook.get("matcher", "*")
                    description = hook.get("description", "")
                    hook_id = f"hooks/{event_name}-{matcher}".replace("*", "all")
                    content = json.dumps(hook, indent=2, ensure_ascii=False)
                    modules.append(ParsedModule(
                        module_id=hook_id,
                        module_type="hook",
                        name=f"{event_name}/{matcher}",
                        description=description,
                        content=content,
                        source_path=str(filepath),
                        metadata={"event": event_name, "matcher": matcher},
                    ))
    elif isinstance(hooks, list):
        for i, hook in enumerate(hooks):
            if isinstance(hook, dict):
                event = hook.get("event", "unknown")
                matcher = hook.get("matcher", "*")
                description = hook.get("description", "")
                hook_id = f"hooks/{event}-{matcher}".replace("*", "all")
                content = json.dumps(hook, indent=2, ensure_ascii=False)
                modules.append(ParsedModule(
                    module_id=hook_id,
                    module_type="hook",
                    name=f"{event}/{matcher}",
                    description=description,
                    content=content,
                    source_path=str(filepath),
                    metadata=hook,
                ))

    return modules


def _derive_module_id(filepath: Path, module_type: str) -> str:
    """Derive a module_id from the file path.

    Examples:
        agents/architect.md           → agents/architect
        skills/security-review/SKILL.md → skills/security-review
        rules/common/coding-style.md  → rules/common--coding-style
        commands/plan.md              → commands/plan
        contexts/dev.md               → contexts/dev
    """
    parts = filepath.parts

    if module_type == "skill":
        # skills/security-review/SKILL.md → skills/security-review
        # Find 'skills' in the path and take the next directory name
        for i, part in enumerate(parts):
            if part == "skills" and i + 1 < len(parts):
                return f"skills/{parts[i + 1]}"
        return f"skills/{filepath.parent.name}"

    if module_type == "rule":
        # rules/common/coding-style.md → rules/common--coding-style
        for i, part in enumerate(parts):
            if part == "rules" and i + 1 < len(parts):
                subdir = parts[i + 1]
                return f"rules/{subdir}--{filepath.stem}"
        return f"rules/{filepath.stem}"

    if module_type == "agent":
        return f"agents/{filepath.stem}"

    if module_type == "command":
        return f"commands/{filepath.stem}"

    if module_type == "context":
        return f"contexts/{filepath.stem}"

    return f"{module_type}s/{filepath.stem}"
