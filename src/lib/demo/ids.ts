import { createHash } from "crypto";

/** Deterministic UUID v4-style id from a stable key (idempotent seeding). */
export function demoId(key: string): string {
  const hash = createHash("sha256").update(`homeserve-demo:${key}`).digest("hex");
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    "4" + hash.slice(13, 16),
    ((parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0") +
      hash.slice(18, 20),
    hash.slice(20, 32),
  ].join("-");
}
