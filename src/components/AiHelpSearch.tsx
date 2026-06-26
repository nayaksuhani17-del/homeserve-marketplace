"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AiMatchCard } from "@/components/ai/AiMatchCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useMockApp } from "@/context/MockAppContext";
import {
  buildAssistantMessage,
  buildIntentChips,
  buildRedirectParams,
  parseSearchDetailed,
} from "@/lib/ai/parse-search";
import { mockProviderToLegacy } from "@/lib/mock/operations";
import { assignRecommendationLabels } from "@/lib/recommendations";
import type { MockProvider } from "@/lib/mock/types";

const HireModal = dynamic(
  () => import("@/components/HireModal").then((m) => m.HireModal),
  { ssr: false }
);

const EXAMPLES = [
  "My sink is leaking and I need help",
  "Looking for someone to clean my house today",
  "Need an affordable electrician nearby",
  "My yard is overgrown, need help",
] as const;

const LOADING_STEPS = [
  "Analyzing your request",
  "Matching verified professionals",
  "Ranking top recommendations",
] as const;

const ANALYSIS_MS = 520;

function AssistantIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z"
      />
    </svg>
  );
}

function collectMatches(
  topRanked: MockProvider[],
  list: MockProvider[],
  limit = 4
): MockProvider[] {
  const seen = new Set<string>();
  const out: MockProvider[] = [];
  for (const p of [...topRanked, ...list]) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
    if (out.length >= limit) break;
  }
  return out;
}

function avgRating(providers: MockProvider[]): string {
  if (providers.length === 0) return "—";
  const avg =
    providers.reduce((s, p) => s + p.ratingAvg, 0) / providers.length;
  return avg.toFixed(1);
}

export function AiHelpSearch() {
  const { filterProviders, ready } = useMockApp();
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [searched, setSearched] = useState(false);
  const [matches, setMatches] = useState<MockProvider[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [intentChips, setIntentChips] = useState<string[]>([]);
  const [dashboardHref, setDashboardHref] = useState("/customer/dashboard");
  const [detectedService, setDetectedService] = useState<string | undefined>();
  const [isFallback, setIsFallback] = useState(false);
  const [hireTarget, setHireTarget] = useState<MockProvider | null>(null);

  useEffect(() => {
    if (!loading) {
      setLoadingStep(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1));
    }, Math.floor(ANALYSIS_MS / LOADING_STEPS.length));
    return () => clearInterval(interval);
  }, [loading]);

  async function runAsk(text: string) {
    const q = text.trim();
    if (!q || !ready) return;

    setQuery(q);
    setLoading(true);
    setSearched(false);
    setMatches([]);
    setSummary(null);
    setIntentChips([]);
    setIsFallback(false);

    await new Promise((r) => setTimeout(r, ANALYSIS_MS));

    const parsed = parseSearchDetailed(q);
    const unclear = parsed.serviceConfidence === "unclear" || !parsed.service;

    const result = filterProviders(
      unclear
        ? {
            status: "all",
            sort: parsed.intent.priceSensitive
              ? "price"
              : parsed.intent.qualityFocus
                ? "rating"
                : undefined,
            maxPrice: parsed.maxPrice ? String(parsed.maxPrice) : undefined,
            minRating: parsed.minRating ? String(parsed.minRating) : undefined,
            maxDistance: parsed.maxDistance ? String(parsed.maxDistance) : undefined,
            availability: parsed.intent.urgency ? "today" : parsed.availability,
          }
        : {
            service: parsed.service,
            sort: parsed.sort,
            maxPrice: parsed.maxPrice ? String(parsed.maxPrice) : undefined,
            minRating: parsed.minRating ? String(parsed.minRating) : undefined,
            maxDistance: parsed.maxDistance ? String(parsed.maxDistance) : undefined,
            availability: parsed.intent.urgency ? "today" : parsed.availability,
            q: q,
            status: "all",
          }
    );

    const found = collectMatches(result.topRanked, result.list);
    setMatches(found);
    setDetectedService(parsed.service);
    setIsFallback(unclear);
    setIntentChips(buildIntentChips(parsed));
    setDashboardHref(
      `/customer/dashboard?${buildRedirectParams(q, parsed).toString()}`
    );
    setSummary(buildAssistantMessage(parsed));
    setSearched(true);
    setLoading(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void runAsk(query);
  }

  const labels =
    matches.length > 0
      ? assignRecommendationLabels(matches.map(mockProviderToLegacy))
      : new Map();

  return (
    <section className="mb-10" aria-label="Smart match assistant">
      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="ai-panel-collapsed group flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
        >
          <span className="flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white shadow-md">
              <AssistantIcon />
            </span>
            <span>
              <span className="block text-sm font-semibold text-green-800">
                Smart match assistant
              </span>
              <span className="mt-0.5 block text-sm text-gray-600">
                Describe your need — we&apos;ll find matching pros
              </span>
            </span>
          </span>
          <span className="shrink-0 rounded-lg bg-white/80 px-4 py-2 text-sm font-semibold text-green-700 shadow-sm ring-1 ring-green-200 transition-all group-hover:bg-white group-hover:shadow">
            Open
          </span>
        </button>
      ) : (
        <div className="ai-panel-expanded animate-slide-up overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                  What do you need help with?
                </h2>
                <p className="mt-1 max-w-xl text-sm text-gray-600">
                  Plain-language search — we match your request to verified pros instantly.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:bg-white/80 hover:text-gray-800"
              >
                Minimize
              </button>
            </div>
          </div>

          <div className="bg-gray-50 px-5 py-5 sm:px-6 sm:py-6">
            <form onSubmit={handleSubmit}>
              <label htmlFor="ai-help-input" className="sr-only">
                Describe your issue
              </label>
              <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row">
                <input
                  id="ai-help-input"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Describe your issue..."
                  disabled={!ready || loading}
                  autoComplete="off"
                  className="flex-1 rounded-2xl border border-gray-200 bg-white px-5 py-4 text-base text-gray-900 shadow-sm outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-500/15 disabled:opacity-60 sm:text-lg"
                />
                <button
                  type="submit"
                  disabled={!ready || loading || !query.trim()}
                  className="btn-primary flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-base font-semibold shadow-md transition-all duration-200 hover:shadow-lg disabled:opacity-60 sm:shrink-0"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" className="border-white border-t-transparent" />
                      <span className="hidden sm:inline">Analyzing…</span>
                    </>
                  ) : (
                    "Ask"
                  )}
                </button>
              </div>
            </form>

            <p className="mt-4 text-center text-xs font-medium uppercase tracking-wide text-gray-500">
              Try an example
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  disabled={loading || !ready}
                  onClick={() => void runAsk(example)}
                  className="rounded-full border border-green-200/80 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm transition-all duration-200 hover:border-green-300 hover:text-green-800 hover:shadow-md disabled:opacity-50"
                >
                  {example}
                </button>
              ))}
            </div>

            {loading && (
              <div className="mx-auto mt-10 max-w-md animate-fade-in text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-sm font-semibold text-gray-900">
                  {LOADING_STEPS[loadingStep]}
                </p>
                <p className="mt-1 text-xs text-gray-500">Finding best matches…</p>
                <div className="mt-4 flex justify-center gap-1.5">
                  {LOADING_STEPS.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i <= loadingStep ? "w-8 bg-green-600" : "w-4 bg-green-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {!loading && searched && matches.length === 0 && (
              <div className="mx-auto mt-8 max-w-lg animate-fade-in rounded-2xl border border-amber-200/80 bg-white px-6 py-5 text-center shadow-sm">
                <p className="font-semibold text-gray-900">No exact matches found</p>
                <p className="mt-1 text-sm text-gray-600">
                  Try rephrasing your request or browse services by category below.
                </p>
              </div>
            )}

            {!loading && matches.length > 0 && (
              <div className="mt-10 animate-scale-in">
                <div className="mx-auto max-w-3xl rounded-2xl border border-green-100 bg-white px-5 py-4 shadow-sm">
                  <p className="text-sm leading-relaxed text-gray-700 sm:text-base">
                    {summary}
                  </p>
                  {intentChips.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {intentChips.map((chip) => (
                        <span
                          key={chip}
                          className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-800 ring-1 ring-green-100"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex flex-col items-center justify-between gap-2 sm:flex-row">
                  <h3 className="text-xl font-bold tracking-tight text-gray-900">
                    {isFallback ? "Recommended Professionals" : "Top Matches for You"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {matches.length} verified match{matches.length !== 1 ? "es" : ""} · avg{" "}
                    {avgRating(matches)}★
                  </p>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {matches.map((p, i) => (
                    <AiMatchCard
                      key={p.id}
                      provider={p}
                      rank={i + 1}
                      recommendationLabel={labels.get(p.id)}
                      selectedService={detectedService}
                      onHire={setHireTarget}
                    />
                  ))}
                </div>

                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  <Link
                    href={dashboardHref}
                    className="inline-flex items-center justify-center rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-green-700 hover:shadow-lg"
                  >
                    View full marketplace
                  </Link>
                  <Link
                    href={dashboardHref}
                    className="text-sm font-medium text-green-700 underline-offset-2 hover:underline"
                  >
                    Apply these filters in browse →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {hireTarget && (
        <HireModal
          open
          onClose={() => setHireTarget(null)}
          providerId={hireTarget.id}
          providerName={hireTarget.name}
          pricingType={hireTarget.pricingType}
          price={hireTarget.price}
          basePrice={hireTarget.basePrice}
          hourlyRate={hireTarget.hourlyRate}
          availableToday={hireTarget.availableToday}
          defaultService={detectedService || hireTarget.services[0] || "General"}
        />
      )}
    </section>
  );
}
