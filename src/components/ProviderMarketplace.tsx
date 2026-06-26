"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ProviderCard } from "./ProviderCard";
import { ProviderPagination } from "./ProviderPagination";
import { AdvancedFilters } from "./AdvancedFilters";
import { EmptyState } from "./EmptyState";
import { Skeleton } from "./Skeleton";
import { SmartSearchBar } from "./SmartSearchBar";
import { SmartAssistant } from "./SmartAssistant";
import { useMockApp } from "@/context/MockAppContext";
import { hasCustomerRole } from "@/lib/user-capabilities";
import { mockProviderToLegacy } from "@/lib/mock/operations";
import { getServiceMeta, similarServices } from "@/lib/services";
import type { ProviderFilters } from "@/lib/mock/types";
import type { RecommendationLabel } from "@/lib/recommendations";
import type { MockProvider } from "@/lib/mock/types";

function filtersFromSearchParams(searchParams: URLSearchParams): ProviderFilters {
  return {
    service: searchParams.get("service") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    minPrice: searchParams.get("minPrice") ?? undefined,
    maxPrice: searchParams.get("maxPrice") ?? undefined,
    minRating: searchParams.get("minRating") ?? undefined,
    maxDistance: searchParams.get("maxDistance") ?? undefined,
    availability: searchParams.get("availability") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    page: searchParams.get("page") ?? undefined,
  };
}

export function ProviderMarketplace({ showAssistant = false }: { showAssistant?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { filterProviders, ready, user, activeMode } = useMockApp();
  const [pending, startTransition] = useTransition();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filters = useMemo(
    () => filtersFromSearchParams(searchParams),
    [searchParams]
  );

  const query = filters.q ?? "";

  const emptyResult = {
    list: [] as MockProvider[],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
    topRanked: [] as MockProvider[],
    topRankMap: {} as Record<string, number>,
    recommendationMap: {} as Record<string, RecommendationLabel>,
    bestMatchId: undefined as string | undefined,
    urgent: false,
  };

  const result = ready
    ? filterProviders({ ...filters, q: query || undefined })
    : emptyResult;

  const syncUrl = useCallback(
    (next: ProviderFilters, q: string) => {
      const params = new URLSearchParams();
      const merged = { ...next, q: q || undefined };
      Object.entries(merged).forEach(([key, val]) => {
        if (val) params.set(key, val);
      });
      router.replace(`/customer/dashboard?${params.toString()}`, { scroll: false });
    },
    [router]
  );

  const activeFilters = [
    filters.service && `Service: ${filters.service}`,
    filters.status === "verified" && "Verified only",
    filters.status === "pending" && "Pending review",
    filters.status === "all" && "All providers",
    filters.minRating && `${filters.minRating}+ stars`,
    filters.minPrice && Number(filters.minPrice) > 15 && `From $${filters.minPrice}/hr`,
    filters.maxPrice && Number(filters.maxPrice) < 120 && `Under $${filters.maxPrice}`,
    filters.availability && `Available ${filters.availability}`,
    filters.maxDistance && `Within ${filters.maxDistance} mi`,
    query && `Search: "${query}"`,
  ].filter((f): f is string => Boolean(f));

  function applyFiltersFromPanel(patch: {
    service?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    minRating?: string;
    maxDistance?: string;
    availability?: string;
    status?: string;
  }) {
    startTransition(() => {
      syncUrl({ ...filters, ...patch, page: "1" }, query);
    });
  }

  if (!ready) {
    return (
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div id="marketplace" className="section-divider">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="section-title">
            {filters.service ? `${filters.service} providers` : "Browse providers"}
          </h2>
          <p className="section-desc">
            {pending
              ? "Updating results…"
              : `${result.total} result${result.total === 1 ? "" : "s"} · search, filter, and book`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {result.urgent && (
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 ring-1 ring-red-100">
              Urgent — fast responders first
            </span>
          )}
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className="btn-secondary text-sm"
          >
            {filtersOpen ? "Hide filters" : "Filters"}
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <SmartSearchBar
          defaultQuery={query}
          placeholder='Search by name or service — e.g. "Marcus" or "plumber"'
        />
        {showAssistant && <SmartAssistant compact />}
      </div>

      {activeFilters.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {activeFilters.map((f) => (
            <span key={f} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
              {f}
            </span>
          ))}
        </div>
      )}

      <div className="mt-5 grid gap-6 lg:grid-cols-4">
        <aside className={`lg:col-span-1 ${filtersOpen ? "block" : "hidden"}`}>
          <AdvancedFilters
            key={[
              filters.service,
              filters.sort,
              filters.minPrice,
              filters.maxPrice,
              filters.minRating,
              filters.maxDistance,
              filters.availability,
              filters.status,
            ].join("-")}
            instant
            service={filters.service}
            sort={filters.sort ?? "rating"}
            minPrice={filters.minPrice}
            maxPrice={filters.maxPrice}
            minRating={filters.minRating}
            maxDistance={filters.maxDistance}
            availability={filters.availability}
            status={filters.status ?? "verified"}
            onApply={applyFiltersFromPanel}
          />
        </aside>

        <div className="lg:col-span-3">
          {result.list.length > 0 ? (
            <>
              {(result.bestMatchId || Object.keys(result.topRankMap).length > 0) &&
                !filters.sort && (
                  <p className="text-xs text-gray-500">Best match highlighted for this search</p>
                )}
              <div
                className={`mt-4 grid gap-5 sm:grid-cols-2 transition-opacity duration-200 ${
                  pending ? "opacity-60" : "opacity-100"
                }`}
              >
                {result.list.map((provider) => {
                  const rank = result.topRankMap[provider.id];
                  const legacy = mockProviderToLegacy(provider);
                  return (
                    <ProviderCard
                      key={provider.id}
                      provider={legacy}
                      selectedService={filters.service}
                      showHire={
                        !!user &&
                        hasCustomerRole(user) &&
                        activeMode === "customer"
                      }
                      isTopRated={rank !== undefined && !filters.sort}
                      rank={rank}
                      recommendationLabel={result.recommendationMap[provider.id]}
                      isBestMatch={provider.id === result.bestMatchId}
                    />
                  );
                })}
              </div>
              {result.totalPages > 1 && (
                <ProviderPagination
                  page={result.page}
                  totalPages={result.totalPages}
                  total={result.total}
                  searchParams={{
                    service: filters.service,
                    sort: filters.sort,
                    q: query || undefined,
                    minPrice: filters.minPrice,
                    maxPrice: filters.maxPrice,
                    minRating: filters.minRating,
                    maxDistance: filters.maxDistance,
                    availability: filters.availability,
                    status: filters.status,
                  }}
                />
              )}
            </>
          ) : (
            <div className="mt-8">
              <EmptyState
                title={query.trim() ? "No users found" : "No providers found — try another search"}
                description={
                  query.trim()
                    ? `No providers or people matched "${query}". Try a partial name or service keyword.`
                    : "We couldn't find a match. Broaden your filters or browse a popular category."
                }
                icon="🔍"
                suggestions={similarServices(filters.service).map(
                  (s) => `${getServiceMeta(s).icon} Browse ${s}`
                )}
                action={
                  <div className="flex flex-wrap justify-center gap-3">
                    <Link href="/customer/dashboard" className="btn-primary inline-block">
                      View all providers
                    </Link>
                    {similarServices(filters.service).slice(0, 2).map((s) => (
                      <Link
                        key={s}
                        href={`/customer/dashboard?service=${encodeURIComponent(s)}`}
                        className="btn-secondary inline-block"
                      >
                        {getServiceMeta(s).icon} {s}
                      </Link>
                    ))}
                  </div>
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
