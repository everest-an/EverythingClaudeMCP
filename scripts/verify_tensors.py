#!/usr/bin/env python3
"""Validate all compiled safetensors files.

Checks:
- Tensor shapes match expected dimensions
- No NaN or Inf values
- Metadata fields are present
- Cross-checks with manifest.json
"""

import json
import sys
from pathlib import Path

import numpy as np
from safetensors import safe_open

project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Verify compiled safetensors files")
    parser.add_argument("--tensor-dir", default="data/tensors", help="Tensor directory")
    parser.add_argument("--index-dir", default="data/index", help="Index directory")
    args = parser.parse_args()

    tensor_dir = Path(args.tensor_dir)
    index_dir = Path(args.index_dir)

    if not tensor_dir.exists():
        print("ERROR: data/tensors/ not found. Run compilation first.")
        return 1

    errors = 0
    total = 0

    for sf_file in tensor_dir.rglob("*.safetensors"):
        total += 1
        module_id = str(sf_file.relative_to(tensor_dir).with_suffix("")).replace("\\", "/")
        print(f"Checking: {module_id}...", end=" ")

        try:
            with safe_open(str(sf_file), framework="pt", device="cpu") as f:
                keys = set(f.keys())
                metadata = dict(f.metadata()) if f.metadata() else {}

                # Check required tensors
                for required in ["mean_embedding", "layer_states", "latent_trajectory"]:
                    if required not in keys:
                        print(f"MISSING tensor: {required}")
                        errors += 1
                        continue

                # Check shapes (auto-detect hidden_size from first tensor)
                me = f.get_tensor("mean_embedding")
                hidden_size = me.shape[0]

                ls = f.get_tensor("layer_states")
                if ls.ndim != 2 or ls.shape[1] != hidden_size:
                    print(f"WRONG shape layer_states: {list(ls.shape)} (expected [N, {hidden_size}])")
                    errors += 1

                lt = f.get_tensor("latent_trajectory")
                if lt.ndim != 2 or lt.shape[1] != hidden_size:
                    print(f"WRONG shape latent_trajectory: {list(lt.shape)} (expected [N, {hidden_size}])")
                    errors += 1

                # Check for NaN/Inf
                for name in ["mean_embedding", "layer_states", "latent_trajectory"]:
                    t = f.get_tensor(name)
                    arr = t.numpy()
                    if np.any(np.isnan(arr)):
                        print(f"NaN detected in {name}")
                        errors += 1
                    if np.any(np.isinf(arr)):
                        print(f"Inf detected in {name}")
                        errors += 1

                # Check metadata
                for field in ["module_id", "module_type", "name", "content_hash"]:
                    if field not in metadata:
                        print(f"MISSING metadata: {field}")
                        errors += 1

                print("OK")

        except Exception as e:
            print(f"ERROR: {e}")
            errors += 1

    # Cross-check with manifest
    manifest_path = index_dir / "manifest.json"
    if manifest_path.exists():
        with open(manifest_path, encoding="utf-8") as f:
            manifest = json.load(f)
        indexed_count = manifest.get("count", 0)
        print(f"\nIndex manifest: {indexed_count} entries")
        if indexed_count != total:
            print(f"WARNING: index has {indexed_count} entries but found {total} tensor files")
    else:
        print("\nWARNING: manifest.json not found")

    print(f"\n{'='*40}")
    print(f"Total files: {total}")
    print(f"Errors: {errors}")

    return 1 if errors > 0 else 0


if __name__ == "__main__":
    sys.exit(main())
