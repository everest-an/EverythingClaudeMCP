"""CLI entry point for the latent compiler.

Usage:
    python -m src.compiler.cli --repo-root vendor/everything-claude-code --output data/tensors
    python -m src.compiler.cli --delta  # Only recompile changed files
    python -m src.compiler.cli --dry-run  # Show what would be compiled
"""

from __future__ import annotations

import argparse
import logging
import sys
import time

from tqdm import tqdm

from ..adapter.config import DEFAULT_MODEL_NAME, get_profile
from ..adapter.model_wrapper import AdaptedModelWrapper
from .delta import DeltaCompiler
from .encoder import LatentEncoder
from .indexer import NumpyIndex
from .persistence import delete_module, save_encoded_module
from .scanner import scan_repository

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="AwesomeContext Compiler: compile markdown rules into latent tensors"
    )
    parser.add_argument(
        "--repo-root",
        default="vendor/everything-claude-code",
        help="Path to everything-claude-code repository",
    )
    parser.add_argument(
        "--output",
        default="data/tensors",
        help="Output directory for compiled .safetensors files",
    )
    parser.add_argument(
        "--index-dir",
        default="data/index",
        help="Output directory for the similarity index",
    )
    parser.add_argument(
        "--cache-dir",
        default="data/cache",
        help="Directory for delta compilation cache",
    )
    parser.add_argument(
        "--delta",
        action="store_true",
        help="Only recompile changed files (incremental build)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be compiled without actually compiling",
    )
    parser.add_argument(
        "--latent-steps",
        type=int,
        default=None,
        help="Number of latent reasoning steps (default: auto from model profile, e.g. 8 for Qwen3-4B)",
    )
    parser.add_argument(
        "--module-type",
        choices=["agent", "skill", "rule", "hook", "command", "context"],
        help="Only compile modules of this type",
    )
    parser.add_argument(
        "--model-name",
        default=None,
        help=f"Override model name (default: auto-detect → {DEFAULT_MODEL_NAME}). "
             "Supported: Qwen/Qwen3-4B, Qwen/Qwen3-14B, Qwen/Qwen2.5-Coder-1.5B-Instruct",
    )

    args = parser.parse_args(argv)

    t_start = time.time()

    # Step 1: Scan repository
    logger.info("Scanning repository: %s", args.repo_root)
    all_modules = scan_repository(args.repo_root)

    if args.module_type:
        all_modules = [m for m in all_modules if m.module_type == args.module_type]
        logger.info("Filtered to %d %s modules", len(all_modules), args.module_type)

    # Step 2: Determine what to compile
    if args.delta:
        delta = DeltaCompiler(hash_file=f"{args.cache_dir}/content_hashes.json")
        delta.load_previous_hashes()

        to_compile = [m for m in all_modules if delta.needs_recompile(m)]
        deleted = delta.get_deleted_modules(all_modules)

        logger.info(
            "Delta analysis: %d changed, %d deleted, %d unchanged",
            len(to_compile),
            len(deleted),
            len(all_modules) - len(to_compile),
        )

        # Remove deleted modules
        for module_id in deleted:
            delete_module(args.output, module_id)
    else:
        to_compile = all_modules
        delta = None
        deleted = []

    if args.dry_run:
        logger.info("=== DRY RUN ===")
        for m in to_compile:
            logger.info(
                "  Would compile: [%s] %s (%d chars)",
                m.module_type,
                m.module_id,
                len(m.content),
            )
        if deleted:
            for mid in deleted:
                logger.info("  Would delete: %s", mid)
        logger.info("Total: %d to compile, %d to delete", len(to_compile), len(deleted))
        return 0

    if not to_compile:
        logger.info("Nothing to compile (all modules up to date)")
        # Still rebuild index in case of deletions
        if deleted:
            _rebuild_index(args.output, args.index_dir)
        return 0

    # Step 3: Load model (auto-selects Qwen3-4B on GPU, or Qwen2.5-1.5B on CPU)
    model_name = args.model_name or None
    profile = get_profile(model_name)
    logger.info(
        "Using model: %s (device=%s, dtype=%s, latent_steps=%d)",
        profile.model_name,
        profile.recommended_device,
        profile.recommended_dtype,
        args.latent_steps or profile.latent_steps_compile,
    )
    wrapper_kwargs = {}
    if model_name:
        wrapper_kwargs["model_name"] = model_name
    wrapper = AdaptedModelWrapper(**wrapper_kwargs)
    encoder = LatentEncoder(wrapper)

    # Step 4: Compile modules
    compiled = []
    failed = []
    for module in tqdm(to_compile, desc="Compiling", unit="module"):
        try:
            encoded = encoder.encode_module(module, latent_steps=args.latent_steps)
            save_encoded_module(encoded, args.output)
            compiled.append(encoded)
        except Exception as e:
            logger.error("Failed to compile %s: %s", module.module_id, e)
            failed.append((module.module_id, str(e)))

    # Step 5: Rebuild index from all compiled modules
    logger.info("Rebuilding similarity index...")
    _rebuild_index_from_encoded(compiled, all_modules, args.output, args.index_dir, wrapper)

    # Step 6: Save delta hashes
    if delta:
        delta.save_hashes()

    # Step 7: Cleanup
    wrapper.cleanup()

    elapsed = time.time() - t_start
    logger.info(
        "Compilation complete: %d compiled, %d failed, %d deleted in %.1fs",
        len(compiled),
        len(failed),
        len(deleted),
        elapsed,
    )
    if failed:
        logger.warning("Failed modules:")
        for mid, err in failed:
            logger.warning("  %s: %s", mid, err)
        return 1

    return 0


def _rebuild_index_from_encoded(
    newly_compiled, all_modules, tensor_dir, index_dir, wrapper
):
    """Rebuild the full index incorporating newly compiled and existing modules."""
    from .persistence import load_module_metadata, load_module_tensor, list_compiled_modules

    index = NumpyIndex()
    all_encoded = []

    # Use newly compiled modules directly
    compiled_ids = {m.module_id for m in newly_compiled}
    all_encoded.extend(newly_compiled)

    # Load existing modules from disk that weren't just compiled
    existing_ids = list_compiled_modules(tensor_dir)
    for module_id in existing_ids:
        if module_id not in compiled_ids:
            try:
                mean_emb = load_module_tensor(tensor_dir, module_id, "mean_embedding")
                meta = load_module_metadata(tensor_dir, module_id)
                # Create a minimal EncodedModule for indexing
                from ..shared.types import EncodedModule
                import torch

                encoded = EncodedModule(
                    module_id=module_id,
                    module_type=meta.get("module_type", "unknown"),
                    name=meta.get("name", module_id),
                    description=meta.get("description", ""),
                    mean_embedding=mean_emb,
                    layer_states=torch.zeros(1),  # Not needed for index
                    latent_trajectory=torch.zeros(1),  # Not needed for index
                    content_hash=meta.get("content_hash", ""),
                    token_count=int(meta.get("token_count", "0")),
                )
                all_encoded.append(encoded)
            except Exception as e:
                logger.warning("Failed to load existing module %s: %s", module_id, e)

    index.build(all_encoded)
    index.save(index_dir)


def _rebuild_index(tensor_dir, index_dir):
    """Rebuild index entirely from disk (for deletion-only updates)."""
    from .persistence import list_compiled_modules, load_module_metadata, load_module_tensor
    from ..shared.types import EncodedModule
    import torch

    index = NumpyIndex()
    all_encoded = []

    for module_id in list_compiled_modules(tensor_dir):
        try:
            mean_emb = load_module_tensor(tensor_dir, module_id, "mean_embedding")
            meta = load_module_metadata(tensor_dir, module_id)
            encoded = EncodedModule(
                module_id=module_id,
                module_type=meta.get("module_type", "unknown"),
                name=meta.get("name", module_id),
                description=meta.get("description", ""),
                mean_embedding=mean_emb,
                layer_states=torch.zeros(1),
                latent_trajectory=torch.zeros(1),
                content_hash=meta.get("content_hash", ""),
                token_count=int(meta.get("token_count", "0")),
            )
            all_encoded.append(encoded)
        except Exception as e:
            logger.warning("Failed to load %s: %s", module_id, e)

    index.build(all_encoded)
    index.save(index_dir)


if __name__ == "__main__":
    sys.exit(main())
