import { Request, Response, NextFunction } from "express";

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

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res
        .status(401)
        .json({ error: "Missing API key. Use Authorization: Bearer ac_..." });
      return;
    }

    const apiKey = authHeader.slice(7);

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
