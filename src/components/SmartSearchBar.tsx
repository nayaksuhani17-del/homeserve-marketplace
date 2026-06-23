"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SmartSearchBar({ placeholder }: { placeholder?: string }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHint(null);

    try {
      const res = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setHint(data.summary);
      router.push(data.redirectUrl);
    } catch {
      router.push(`/customer/dashboard?q=${encodeURIComponent(query)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-green-500">
            ✨
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder ?? 'Try "cheap electrician near me available today"'}
            className="input-field pl-10"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary shrink-0 disabled:opacity-60">
          {loading ? "Searching…" : "Smart Search"}
        </button>
      </form>
      {hint && <p className="mt-2 text-xs text-green-600">{hint}</p>}
    </div>
  );
}
