/**
 * HTTP client for communicating with the FastAPI backend.
 */

import type { LatentQueryRequest, LatentQueryResponse, ModuleListResponse } from "./types.js";

const BACKEND_URL = process.env.AC_BACKEND_URL || "http://127.0.0.1:8420";

export async function queryLatentBackend(
  request: LatentQueryRequest
): Promise<LatentQueryResponse> {
  const response = await fetch(`${BACKEND_URL}/v1/latent/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Backend error ${response.status}: ${errorText}`);
  }

  return (await response.json()) as LatentQueryResponse;
}

export async function listModules(
  moduleType?: string
): Promise<ModuleListResponse> {
  const url = new URL(`${BACKEND_URL}/v1/modules/list`);
  if (moduleType) {
    url.searchParams.set("module_type", moduleType);
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Backend error ${response.status}: ${errorText}`);
  }

  return (await response.json()) as ModuleListResponse;
}

export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/v1/health`);
    return response.ok;
  } catch {
    return false;
  }
}
