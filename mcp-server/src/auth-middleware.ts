import { Request, Response, NextFunction } from "express";

// Public mode: skip API key auth entirely.
// Set AC_PUBLIC_MODE=true for initial deployment or open-access instances.
const PUBLIC_MODE = process.env.AC_PUBLIC_MODE === "true";
// Strict mode: when true, missing/invalid keys return 401/503.
// Default is fail-open to avoid blocking users on auth wiring issues.
const STRICT_AUTH = process.env.AC_STRICT_AUTH === "true";

// In-memory cache: apiKey -> { userId, apiKeyId, expiresAt }
const keyCache = new Map<
  string,
  { userId: string; apiKeyId: string; expiresAt: number }
>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const VALIDATE_URL =
  process.env.AC_VALIDATE_KEY_URL || "http://localhost:3001/api/validate-key";
const LOG_USAGE_URL =
  process.env.AC_LOG_USAGE_URL || "http://localhost:3001/api/log-usage";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || "";

export interface AuthInfo {
  userId: string;
  apiKeyId: string;
}

// Augment Express Request
declare global {
  namespace Express {
    interface Request {
      authInfo?: AuthInfo;
    }
  }
}

export function authMiddleware(skipPaths: string[] = ["/health"]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (skipPaths.some((p) => req.path === p || req.path.startsWith(p))) {
      return next();
    }

    // Public mode — no API key required
    if (PUBLIC_MODE) {
      req.authInfo = { userId: "public", apiKeyId: "public" };
      return next();
    }

    const authHeader = req.headers.authorization;
    let apiKey: string | undefined;

    if (authHeader?.startsWith("Bearer ")) {
      apiKey = authHeader.slice(7);
    }

    // Header fallback for clients that cannot set Authorization.
    if (!apiKey) {
      const headerToken = req.headers["x-api-key"] as string | undefined;
      apiKey = headerToken;
      if (apiKey?.startsWith("Bearer ")) {
        apiKey = apiKey.slice(7);
      }
    }

    // Query fallback for browser/EventSource style clients.
    // Accepted on MCP transport routes only.
    if (
      !apiKey &&
      (req.path === "/sse" || req.path === "/messages" || req.path === "/mcp")
    ) {
      const queryToken =
        (req.query.access_token as string | undefined) ||
        (req.query.api_key as string | undefined);
      apiKey = queryToken;

      if (apiKey?.startsWith("Bearer ")) {
        apiKey = apiKey.slice(7);
      }
    }

    if (!apiKey) {
      if (!STRICT_AUTH) {
        req.authInfo = { userId: "public", apiKeyId: "public" };
        return next();
      }
      res
        .status(401)
        .json({
          error:
            "Missing API key. Use Authorization: Bearer ac_... (or x-api-key / access_token / api_key on /mcp, /sse, /messages)",
        });
      return;
    }

    // Check cache
    const cached = keyCache.get(apiKey);
    if (cached && cached.expiresAt > Date.now()) {
      req.authInfo = { userId: cached.userId, apiKeyId: cached.apiKeyId };
      return next();
    }

    // Validate against Next.js API
    try {
      const response = await fetch(VALIDATE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });

      const data = (await response.json()) as {
        valid: boolean;
        userId?: string;
        apiKeyId?: string;
      };

      if (!data.valid) {
        if (!STRICT_AUTH) {
          req.authInfo = { userId: "public", apiKeyId: "public" };
          return next();
        }
        res.status(401).json({ error: "Invalid or revoked API key" });
        return;
      }

      keyCache.set(apiKey, {
        userId: data.userId!,
        apiKeyId: data.apiKeyId!,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });

      req.authInfo = { userId: data.userId!, apiKeyId: data.apiKeyId! };
      next();
    } catch (err) {
      console.error("Key validation error:", err);
      if (!STRICT_AUTH) {
        req.authInfo = { userId: "public", apiKeyId: "public" };
        return next();
      }
      res.status(503).json({ error: "Auth service unavailable" });
    }
  };
}

/**
 * Log usage asynchronously after a tool call completes.
 * Fire-and-forget — does not block the response.
 */
export function logUsageAsync(
  authInfo: AuthInfo,
  toolName: string,
  latencyMs: number,
) {
  fetch(LOG_USAGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": INTERNAL_SECRET,
    },
    body: JSON.stringify({
      apiKeyId: authInfo.apiKeyId,
      userId: authInfo.userId,
      toolName,
      latencyMs,
    }),
  }).catch((err: Error) => {
    console.error("Failed to log usage:", err.message);
  });
}
