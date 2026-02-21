#!/usr/bin/env python3
"""Start the AwesomeContext FastAPI backend server.

Usage:
    python scripts/serve.py
    python scripts/serve.py --port 8420
    python scripts/serve.py --tensor-dir data/tensors-qwen3-4b --index-dir data/index-qwen3-4b
"""

import argparse
import sys
from pathlib import Path

# Ensure project root is in path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))


def main():
    parser = argparse.ArgumentParser(description="Start AwesomeContext FastAPI server")
    import os
    default_host = os.environ.get("HOST", os.environ.get("FASTAPI_HOST", "127.0.0.1"))
    default_port = int(os.environ.get("PORT", os.environ.get("FASTAPI_PORT", "8420")))
    parser.add_argument("--host", default=default_host, help="Bind host (env: HOST)")
    parser.add_argument("--port", type=int, default=default_port, help="Bind port (env: PORT)")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload")
    parser.add_argument("--tensor-dir", default=None, help="Override tensor directory (env: AC_TENSOR_DIR)")
    parser.add_argument("--index-dir", default=None, help="Override index directory (env: AC_INDEX_DIR)")
    args = parser.parse_args()

    if args.tensor_dir:
        os.environ["AC_TENSOR_DIR"] = args.tensor_dir
    if args.index_dir:
        os.environ["AC_INDEX_DIR"] = args.index_dir

    import uvicorn

    uvicorn.run(
        "src.api.app:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        log_level="info",
    )


if __name__ == "__main__":
    main()
