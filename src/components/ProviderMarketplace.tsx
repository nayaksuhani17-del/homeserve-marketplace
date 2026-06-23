"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ProviderCard } from "./ProviderCard";
import { AdvancedFilters } from "./AdvancedFilters";
import { ProviderPagination } from "./ProviderPagination";
import { EmptyState } from "./EmptyState";
import { Skeleton } from "./Skeleton";
import { useMockApp } from "@/context/MockAppContext";
import { mockProviderToLegacy } from "@/lib/mock/operations";
import type { ProviderFilters } from "@/lib/mock/types";

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

export function ProviderMarketplace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { filterProviders, ready, user } = useMockApp();
  const [pending, startTransition] = useTransition();
  const skipQueryEffect = useRef(true);

  const filters = useMemo(
    () => filtersFromSearchParams(searchParams),
    [searchParams]
  );

  const [query, setQuery] = useState(filters.q ?? "");

  useEffect(() => {
    setQuery(filters.q ?? "");
    skipQueryEffect.current = true;
  }, [filters.q]);

  const result = ready
    ? filterProviders({ ...filters, q: query || undefined })
    : {
        list: [],
        total: 0,
        page: 1,
        pageSize: 24,
        totalPages: 1,
        topRanked: [],
        topRankMap: {},
      };

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

  useEffect(() => {
    if (skipQueryEffect.current) {
      skipQueryEffect.current = false;
      return;
    }
    const timer = setTimeout(() => {
      startTransition(() => {
        syncUrl({ ...filters, page: "1" }, query);
      });
    }, 280);
    return () => clearTimeout(timer);
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeFilters = [
    filters.service && `Service: ${filters.service}`,
    filters.status === "verified" && "Verified only",
    filters.status === "pending" && "Pending review",
    filters.status === "all" && "All providers",
    filters.minRating && `${filters.minRating}+ stars`,
    filters.maxPrice && Number(filters.maxPrice) < 120 && `Under $${filters.maxPrice}/hr`,
    filters.availability && `Available ${filters.availability}`,
    filters.maxDistance && `Within ${filters.maxDistance} mi`,
    query && `Search: "${query}"`,
  ].filter((f): f is string => Boolean(f));

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
    <>
      <div className="mt-8">
        <div className="input-with-icon">
          <span className="input-icon-slot text-base" aria-hidden>
            🔍
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search instantly — "cheap cleaner near me today"'
            className="input-field"
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          {pending
            ? "Updating results…"
            : `${result.total.toLocaleString()} providers match your search`}
        </p>
      </div>

      {activeFilters.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {activeFilters.map((f) => (
            <span key={f} className="badge-tag animate-fade-in">
              {f}
            </span>
          ))}
        </div>
      )}

      <div className="mt-6">
        <AdvancedFilters
          key={searchParams.toString()}
          service={filters.service}
          sort={filters.sort ?? "rating"}
          q={query}
          minPrice={filters.minPrice}
          maxPrice={filters.maxPrice}
          minRating={filters.minRating}
          maxDistance={filters.maxDistance}
          availability={filters.availability}
          status={filters.status ?? "verified"}
          instant
          onApply={(next) => {
            syncUrl({ ...filters, ...next, page: "1" }, query);
          }}
        />
      </div>

      {result.list.length > 0 ? (
        <>
          {Object.keys(result.topRankMap).length > 0 && !filters.sort && (
            <p className="mt-8 text-sm font-medium text-green-700">
              ⭐ Top picks highlighted below
            </p>
          )}
          <div
            className={`mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 transition-opacity duration-200 ${
              pending ? "opacity-60" : "opacity-100"
            }`}
          >
            {result.list.map((provider) => {
              const rank = result.topRankMap[provider.id];
              return (
                <ProviderCard
                  key={provider.id}
                  provider={mockProviderToLegacy(provider)}
                  selectedService={filters.service}
                  showHire={!!user && user.role === "customer"}
                  isTopRated={rank !== undefined && !filters.sort}
                  rank={rank}
                />
              );
            })}
          </div>
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
        </>
      ) : (
        <div className="mt-12">
          <EmptyState
            title="No providers found"
            description="Try adjusting your filters or search for a different service."
            icon="🏠"
            action={
              <Link href="/customer/dashboard" className="btn-primary inline-block">
                Clear filters
              </Link>
            }
          />
        </div>
      )}
    </>
  );
}
