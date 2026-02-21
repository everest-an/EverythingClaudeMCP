import { randomBytes, createHash } from "crypto";

const KEY_PREFIX = "ac_";
const KEY_BYTES = 32;

/**
 * Generate a new API key.
 * Returns the full plaintext key (shown once), its SHA-256 hash (stored), and a display prefix.
 */
export function generateApiKey(): {
  key: string;
  hash: string;
  prefix: string;
} {
  const rawBytes = randomBytes(KEY_BYTES);
  const keyBody = rawBytes.toString("base64url");
  const key = `${KEY_PREFIX}${keyBody}`;
  const hash = hashApiKey(key);
  const prefix = key.slice(0, 11);

  return { key, hash, prefix };
}

/**
 * Hash an API key with SHA-256 for storage/lookup.
 */
export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}
