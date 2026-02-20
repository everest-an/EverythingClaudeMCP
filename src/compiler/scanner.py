"""File scanner for everything-claude-code repository.

Traverses the repository structure and discovers all compilable modules:
- agents/*.md
- skills/*/SKILL.md
- rules/{common,typescript,python,golang}/*.md
- hooks/hooks.json
- commands/*.md
- contexts/*.md
"""

from __future__ import annotations

import logging
from pathlib import Path

from ..shared.markdown_parser import parse_hooks_json, parse_markdown_file
from ..shared.types import ParsedModule

logger = logging.getLogger(__name__)


def scan_repository(repo_root: str | Path) -> list[ParsedModule]:
    """Traverse everything-claude-code and return all compilable modules.

    Args:
        repo_root: Path to the everything-claude-code repository root

    Returns:
        List of ParsedModule sorted by module_id for deterministic compilation order.
    """
    root = Path(repo_root)
    if not root.exists():
        raise FileNotFoundError(f"Repository root not found: {root}")

    modules: list[ParsedModule] = []

    # 1. Agents: agents/*.md
    agents_dir = root / "agents"
    if agents_dir.exists():
        for md_file in sorted(agents_dir.glob("*.md")):
            module = parse_markdown_file(md_file, "agent")
            if module:
                modules.append(module)
        logger.info("Scanned %d agents", sum(1 for m in modules if m.module_type == "agent"))

    # 2. Skills: skills/*/SKILL.md
    skills_dir = root / "skills"
    if skills_dir.exists():
        for skill_dir in sorted(skills_dir.iterdir()):
            if skill_dir.is_dir():
                skill_file = skill_dir / "SKILL.md"
                if skill_file.exists():
                    module = parse_markdown_file(skill_file, "skill")
                    if module:
                        modules.append(module)
        logger.info("Scanned %d skills", sum(1 for m in modules if m.module_type == "skill"))

    # 3. Rules: rules/{common,typescript,python,golang}/*.md
    rules_dir = root / "rules"
    if rules_dir.exists():
        for lang_dir in sorted(rules_dir.iterdir()):
            if lang_dir.is_dir():
                for md_file in sorted(lang_dir.glob("*.md")):
                    module = parse_markdown_file(md_file, "rule")
                    if module:
                        modules.append(module)
        logger.info("Scanned %d rules", sum(1 for m in modules if m.module_type == "rule"))

    # 4. Hooks: hooks/hooks.json
    hooks_file = root / "hooks" / "hooks.json"
    if hooks_file.exists():
        hook_modules = parse_hooks_json(hooks_file)
        modules.extend(hook_modules)
        logger.info("Scanned %d hooks", len(hook_modules))

    # 5. Commands: commands/*.md
    commands_dir = root / "commands"
    if commands_dir.exists():
        for md_file in sorted(commands_dir.glob("*.md")):
            module = parse_markdown_file(md_file, "command")
            if module:
                modules.append(module)
        logger.info("Scanned %d commands", sum(1 for m in modules if m.module_type == "command"))

    # 6. Contexts: contexts/*.md
    contexts_dir = root / "contexts"
    if contexts_dir.exists():
        for md_file in sorted(contexts_dir.glob("*.md")):
            module = parse_markdown_file(md_file, "context")
            if module:
                modules.append(module)
        logger.info("Scanned %d contexts", sum(1 for m in modules if m.module_type == "context"))

    # Sort by module_id for deterministic order
    modules.sort(key=lambda m: m.module_id)
    logger.info("Total modules scanned: %d", len(modules))

    return modules
