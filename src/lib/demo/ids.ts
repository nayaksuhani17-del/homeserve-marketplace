/** Deterministic UUID v4-style id from a stable key (works in browser + Node). */
function hashHex(key: string): string {
  const input = `homeserve-demo:${key}`;
  if (typeof globalThis.crypto !== "undefined" && "subtle" in globalThis.crypto) {
    // Sync fallback for SSR/build — use simple hash when subtle unavailable sync
  }

  let h1 = 2166136261;
  let h2 = 2166136261 ^ 0x9e3779b9;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619);
    h2 = Math.imul(h2 ^ (c + i), 2246822519);
  }
  const p1 = (h1 >>> 0).toString(16).padStart(8, "0");
  const p2 = (h2 >>> 0).toString(16).padStart(8, "0");
  const p3 = (Math.imul(h1, h2) >>> 0).toString(16).padStart(8, "0");
  const p4 = (Math.imul(h2, h1) >>> 0).toString(16).padStart(8, "0");
  return (p1 + p2 + p3 + p4).slice(0, 32);
}

export function demoId(key: string): string {
  const hash = hashHex(key);
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    "4" + hash.slice(13, 16),
    ((parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0") +
      hash.slice(18, 20),
    hash.slice(20, 32),
  ].join("-");
}
