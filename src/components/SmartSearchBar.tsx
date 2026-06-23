"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChatProviderCard } from "./ChatProviderCard";
import { useMockApp } from "@/context/MockAppContext";
import { simulateDelay } from "@/lib/mock/operations";
import { toProviderCardData } from "@/lib/providers";
import { mockProviderToLegacy } from "@/lib/mock/operations";

export function SmartSearchBar({ placeholder }: { placeholder?: string }) {
  const { parseSearch, filterProviders, ready } = useMockApp();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [preview, setPreview] = useState<ReturnType<typeof toProviderCardData>[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowPreview(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!query.trim() || !ready) {
      setPreview([]);
      setShowPreview(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const parsed = parseSearch(query);
      const result = filterProviders({
        q: parsed.q,
        service: parsed.service,
        sort: parsed.sort,
        maxPrice: parsed.maxPrice ? String(parsed.maxPrice) : undefined,
        minRating: parsed.minRating ? String(parsed.minRating) : undefined,
        maxDistance: parsed.maxDistance ? String(parsed.maxDistance) : undefined,
        availability: parsed.availability,
        status: "verified",
      });
      setPreview(result.list.slice(0, 3).map((p) => toProviderCardData(mockProviderToLegacy(p))));
      setShowPreview(true);
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, ready, parseSearch, filterProviders]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || !ready) return;

    setLoading(true);
    setHint(null);
    setShowPreview(false);

    startTransition(async () => {
      await simulateDelay(600);
      const parsed = parseSearch(query);
      const applied: string[] = [];
      if (parsed.service) applied.push(`Service: ${parsed.service}`);
      if (parsed.sort === "price") applied.push("Sorted by lowest price");
      if (parsed.minRating) applied.push(`${parsed.minRating}+ stars`);
      if (parsed.maxPrice) applied.push(`Under $${parsed.maxPrice}/hr`);
      setHint(
        applied.length ? `Applied: ${applied.join(" · ")}` : "Showing all available providers"
      );
      router.push(`/customer/dashboard?${parsed.redirectParams.toString()}`);
      setLoading(false);
    });
  }

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <div className="input-with-icon flex-1">
          <span className="input-icon-slot text-base" aria-hidden>
            ✨
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => preview.length > 0 && setShowPreview(true)}
            placeholder={placeholder ?? 'Try "cheap electrician near me available today"'}
            className="input-field"
            disabled={!ready}
          />
        </div>
        <button type="submit" disabled={loading || !ready} className="btn-primary shrink-0 disabled:opacity-60">
          {loading ? "Searching…" : "Smart Search"}
        </button>
      </form>

      {showPreview && preview.length > 0 && (
        <div className="animate-slide-up absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          <p className="border-b border-gray-100 px-4 py-2 text-xs font-medium text-gray-500">
            Top matches as you type
          </p>
          <div className="max-h-80 space-y-1 overflow-y-auto p-2">
            {preview.map((p) => (
              <ChatProviderCard key={p.id} provider={p} compact />
            ))}
          </div>
          <button
            type="button"
            onClick={() => router.push(`/customer/dashboard?q=${encodeURIComponent(query)}`)}
            className="w-full border-t border-gray-100 px-4 py-2 text-left text-xs font-medium text-green-600 hover:bg-green-50"
          >
            View all results for &quot;{query}&quot; →
          </button>
        </div>
      )}

      {hint && <p className="mt-2 text-xs text-green-600">{hint}</p>}
    </div>
  );
}
