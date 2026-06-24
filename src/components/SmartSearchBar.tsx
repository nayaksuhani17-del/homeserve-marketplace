"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { SearchResultCard } from "./SearchResultCard";
import { useMockApp } from "@/context/MockAppContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { matchSearchSuggestions } from "@/lib/services";
import { detectUrgency } from "@/lib/smart";
import type { UnifiedSearchResult } from "@/lib/search/unified";

const DirectMessageModal = dynamic(
  () => import("./DirectMessagePanel").then((m) => m.DirectMessageModal),
  { ssr: false }
);
const HireModal = dynamic(
  () => import("./HireModal").then((m) => m.HireModal),
  { ssr: false }
);

export function SmartSearchBar({ placeholder }: { placeholder?: string }) {
  const { parseSearch, advancedSearch, ready, getProvider } = useMockApp();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [preview, setPreview] = useState<UnifiedSearchResult[]>([]);
  const [messageTarget, setMessageTarget] = useState<{ id: string; name: string } | null>(null);
  const [hireTarget, setHireTarget] = useState<UnifiedSearchResult | null>(null);
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
    if (!query.trim() || query.trim().length < 2 || !ready) {
      setPreview([]);
      setPreviewLoading(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    setPreviewLoading(true);
    debounceRef.current = setTimeout(() => {
      const results = advancedSearch(query).slice(0, 5);
      setPreview(results);
      setPreviewLoading(false);
      setShowDropdown(true);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, ready, advancedSearch]);

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
            placeholder={placeholder ?? 'Try "John", "Mike electrician", or "plumber near me"'}
            className="input-field"
            disabled={!ready}
            autoComplete="off"
          />
        </div>
        <button type="submit" disabled={loading || !ready} className="btn-primary flex shrink-0 items-center justify-center gap-2 disabled:opacity-60">
          {loading ? (
            <>
              <LoadingSpinner size="sm" className="border-white border-t-transparent" />
              <span>Searching…</span>
            </>
          ) : (
            "Search"
          )}
        </button>
      </form>

      {showDropdown && (suggestions.length > 0 || (query.trim() && (preview.length > 0 || previewLoading || query.trim().length >= 2))) && (
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
          {query.trim() && previewLoading && (
            <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 text-sm text-gray-500">
              <LoadingSpinner size="sm" />
              Searching people and services…
            </div>
          )}
          {query.trim() && !previewLoading && preview.length === 0 && query.trim().length >= 2 && (
            <p className="border-b border-gray-100 px-4 py-3 text-sm text-gray-500">
              No users found for &quot;{query}&quot;
            </p>
          )}
          {query.trim() && !previewLoading && preview.length > 0 && (
            <>
              <p className="border-b border-gray-100 px-4 py-2 text-xs font-medium text-gray-500">
                People &amp; services matching your search
              </p>
              <div className="max-h-96 space-y-1 overflow-y-auto p-2">
                {preview.map((item) => (
                  <SearchResultCard
                    key={item.resultId}
                    compact
                    name={item.name}
                    role={item.role}
                    services={item.services}
                    ratingAvg={item.ratingAvg}
                    reviewCount={item.reviewCount}
                    location={item.location}
                    matchedTerms={item.matchedTerms}
                    approved={item.approved}
                    onViewProfile={
                      item.providerId
                        ? () => {
                            setShowDropdown(false);
                            router.push(`/provider/${item.providerId}`);
                          }
                        : undefined
                    }
                    onMessage={() => {
                      setShowDropdown(false);
                      setMessageTarget({ id: item.userId, name: item.name });
                    }}
                    onHire={
                      item.providerId
                        ? () => {
                            setShowDropdown(false);
                            setHireTarget(item);
                          }
                        : undefined
                    }
                  />
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

      {messageTarget && (
        <DirectMessageModal
          open
          otherUserId={messageTarget.id}
          otherUserName={messageTarget.name}
          onClose={() => setMessageTarget(null)}
        />
      )}

      {hireTarget?.providerId && (
        <HireModal
          open
          onClose={() => setHireTarget(null)}
          providerId={hireTarget.providerId}
          providerName={hireTarget.name}
          pricingType={
            getProvider(hireTarget.providerId)?.pricingType ?? "hourly"
          }
          price={Number(getProvider(hireTarget.providerId)?.price ?? 50)}
          basePrice={Number(getProvider(hireTarget.providerId)?.basePrice ?? 0)}
          hourlyRate={Number(getProvider(hireTarget.providerId)?.hourlyRate ?? 50)}
          availableToday={Boolean(getProvider(hireTarget.providerId)?.availableToday)}
          defaultService={hireTarget.services[0] ?? "General"}
        />
      )}
    </div>
  );
}
