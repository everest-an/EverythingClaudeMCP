#!/usr/bin/env python3
"""Convenience script to run the latent compiler.

Usage:
    python scripts/compile.py                  # Full compilation
    python scripts/compile.py --delta          # Incremental
    python scripts/compile.py --dry-run        # Preview only
"""

import sys
from pathlib import Path

# Ensure project root is in path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.compiler.cli import main

if __name__ == "__main__":
    sys.exit(main())
