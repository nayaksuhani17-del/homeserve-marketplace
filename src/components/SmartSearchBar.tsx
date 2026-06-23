"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChatProviderCard } from "./ChatProviderCard";
import { useMockApp } from "@/context/MockAppContext";
import { toProviderCardData } from "@/lib/providers";
import { mockProviderToLegacy } from "@/lib/mock/operations";
import { matchSearchSuggestions } from "@/lib/services";
import { detectUrgency } from "@/lib/smart";
import { assignRecommendationLabels } from "@/lib/recommendations";

export function SmartSearchBar({ placeholder }: { placeholder?: string }) {
  const { parseSearch, filterProviders, ready } = useMockApp();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [preview, setPreview] = useState<ReturnType<typeof toProviderCardData>[]>([]);
  const suggestions = useMemo(() => matchSearchSuggestions(query), [query]);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2 || !ready) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const parsed = parseSearch(query);
      const urgent = detectUrgency(query);
      const result = filterProviders({
        q: parsed.q,
        service: parsed.service,
        sort: parsed.sort,
        maxPrice: parsed.maxPrice ? String(parsed.maxPrice) : undefined,
        minRating: parsed.minRating ? String(parsed.minRating) : undefined,
        maxDistance: parsed.maxDistance ? String(parsed.maxDistance) : undefined,
        availability: urgent ? "today" : parsed.availability,
        status: "verified",
      });
      const legacy = result.list.slice(0, 3).map(mockProviderToLegacy);
      const labels = assignRecommendationLabels(legacy);
      setPreview(
        legacy.map((p) =>
          toProviderCardData(p, { recommendationLabel: labels.get(p.id) })
        )
      );
      setShowDropdown(true);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, ready, parseSearch, filterProviders]);

  async function runSearch(q: string) {
    if (!q.trim() || !ready) return;
    setQuery(q);
    setLoading(true);
    setHint(null);
    setShowDropdown(false);

    startTransition(() => {
      const parsed = parseSearch(q);
      const applied: string[] = [];
      if (parsed.service) applied.push(`Service: ${parsed.service}`);
      if (parsed.sort === "price") applied.push("Sorted by lowest price");
      if (parsed.minRating) applied.push(`${parsed.minRating}+ stars`);
      if (parsed.maxPrice) applied.push(`Under $${parsed.maxPrice}`);
      if (detectUrgency(q)) applied.push("Urgent — fast responders prioritized");
      setHint(
        applied.length ? `Applied: ${applied.join(" · ")}` : "Showing all available providers"
      );
      router.push(`/customer/dashboard?${parsed.redirectParams.toString()}`);
      setLoading(false);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await runSearch(query);
  }

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <div className="input-with-icon flex-1">
          <span className="input-icon-slot text-base" aria-hidden>
            🔍
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!e.target.value.trim()) setShowDropdown(false);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder={placeholder ?? 'Try "cheap electrician near me available today"'}
            className="input-field"
            disabled={!ready}
            autoComplete="off"
          />
        </div>
        <button type="submit" disabled={loading || !ready} className="btn-primary shrink-0 disabled:opacity-60">
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {showDropdown && (suggestions.length > 0 || (query.trim() && preview.length > 0)) && (
        <div className="animate-slide-up absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          {suggestions.length > 0 && !query.trim() && (
            <div className="border-b border-gray-100 p-2">
              <p className="px-2 py-1 text-xs font-medium text-gray-500">Popular searches</p>
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => runSearch(s)}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-green-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {query.trim() && suggestions.length > 0 && (
            <div className="border-b border-gray-100 px-2 py-1">
              {suggestions.slice(0, 4).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => runSearch(s)}
                  className="block w-full rounded-lg px-3 py-1.5 text-left text-xs text-green-700 hover:bg-green-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {query.trim() && preview.length > 0 && (
            <>
              <p className="border-b border-gray-100 px-4 py-2 text-xs font-medium text-gray-500">
                Top matches as you type
              </p>
              <div className="max-h-80 space-y-1 overflow-y-auto p-2">
                {preview.map((p) => (
                  <ChatProviderCard key={p.id} provider={p} compact />
                ))}
              </div>
            </>
          )}
          {query.trim() && (
            <button
              type="button"
              onClick={() => runSearch(query)}
              className="w-full border-t border-gray-100 px-4 py-2 text-left text-xs font-medium text-green-600 hover:bg-green-50"
            >
              View all results for &quot;{query}&quot; →
            </button>
          )}
        </div>
      )}

      {detectUrgency(query) && (
        <p className="mt-2 animate-fade-in text-xs font-medium text-red-600">
          🚨 Urgent service detected — we&apos;ll prioritize fast responders
        </p>
      )}

      {hint && <p className="mt-2 text-xs text-green-600">{hint}</p>}
    </div>
  );
}
