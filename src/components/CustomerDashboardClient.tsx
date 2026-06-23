"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ProviderCard } from "@/components/ProviderCard";
import { ProviderMarketplace } from "@/components/ProviderMarketplace";
import { CustomerBookingsPanel } from "@/components/customer/CustomerBookingsPanel";
import { ReportProviderModal } from "@/components/ReportProviderModal";
import { useMockApp } from "@/context/MockAppContext";
import { mockProviderToLegacy } from "@/lib/mock/operations";
import { assignRecommendationLabels } from "@/lib/recommendations";

export function CustomerDashboardClient() {
  const router = useRouter();
  const {
    user,
    ready,
    getStats,
    filterProviders,
    getBookingsForCustomer,
    getRecentlyViewedProviders,
    getSavedProviders,
  } = useMockApp();
  const [reportTarget, setReportTarget] = useState<{
    providerId: string;
    providerName: string;
    bookingId?: string;
  } | null>(null);

  useEffect(() => {
    if (!ready || !user) return;
    if (user.role === "provider") router.replace("/provider/dashboard");
    else if (user.role === "admin") router.replace("/admin");
  }, [ready, user, router]);

  const stats = getStats();
  const bookings = user?.role === "customer" ? getBookingsForCustomer(user.id) : [];
  const verifiedFeed = useMemo(
    () => filterProviders({ status: "verified", sort: "rating" }),
    [filterProviders]
  );
  const recommended = verifiedFeed.topRanked;
  const popular = useMemo(
    () =>
      [...verifiedFeed.list]
        .sort((a, b) => b.jobsCompleted - a.jobsCompleted)
        .slice(0, 3),
    [verifiedFeed.list]
  );
  const recent = user ? getRecentlyViewedProviders() : [];
  const savedCount = user ? getSavedProviders().length : 0;
  const greeting = user
    ? `Welcome back, ${user.name.split(" ")[0]} 👋`
    : "Find your perfect pro";

  const recLabels = assignRecommendationLabels(
    recommended.map(mockProviderToLegacy)
  );
  const popularLabels = assignRecommendationLabels(
    popular.map(mockProviderToLegacy)
  );

  if (!ready) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
        <div className="mt-8 h-12 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  if (user && user.role !== "customer") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center text-gray-500">
        Redirecting…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 animate-page-enter">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-green-700">Trusted local marketplace</p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{greeting}</h1>
          <p className="mt-1 text-gray-600">
            {stats.verifiedProviders} verified pros · {stats.jobsCompleted.toLocaleString()}+ jobs
            completed · Trusted by homeowners
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {user && (
            <Link href="/customer/saved" className="btn-secondary">
              ♥ Saved ({savedCount})
            </Link>
          )}
          {!user && (
            <Link href="/login" className="btn-primary">
              Log in to book
            </Link>
          )}
        </div>
      </div>

      {user && recommended.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recommended for you</h2>
            <span className="text-xs text-gray-500">Best Match highlighted</span>
          </div>
          <div className="mt-4 grid gap-5 sm:grid-cols-3">
            {recommended.map((p, i) => (
              <ProviderCard
                key={p.id}
                provider={mockProviderToLegacy(p)}
                showHire
                isBestMatch={i === 0}
                recommendationLabel={recLabels.get(p.id)}
              />
            ))}
          </div>
        </section>
      )}

      {popular.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900">Popular near you</h2>
          <p className="mt-1 text-sm text-gray-500">Most booked pros in your area this week</p>
          <div className="mt-4 grid gap-5 sm:grid-cols-3">
            {popular.map((p) => (
              <ProviderCard
                key={p.id}
                provider={mockProviderToLegacy(p)}
                showHire={!!user && user.role === "customer"}
                recommendationLabel={popularLabels.get(p.id)}
              />
            ))}
          </div>
        </section>
      )}

      {user && recent.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900">Recently viewed</h2>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
            {recent.map((p) => (
              <Link
                key={p.id}
                href={`/provider/${p.id}`}
                className="card card-hover shrink-0 px-4 py-3 text-sm transition hover:-translate-y-0.5"
              >
                <p className="font-medium text-gray-900">{p.name}</p>
                <p className="text-xs text-gray-500">{p.services[0]}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {user && (
        <CustomerBookingsPanel
          bookings={bookings}
          onReport={(target) => setReportTarget(target)}
        />
      )}

      <ProviderMarketplace />

      {reportTarget && (
        <ReportProviderModal
          open
          onClose={() => setReportTarget(null)}
          providerId={reportTarget.providerId}
          providerName={reportTarget.providerName}
          bookingId={reportTarget.bookingId}
        />
      )}
    </div>
  );
}
