"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProviderCard } from "@/components/ProviderCard";
import { ProviderMarketplace } from "@/components/ProviderMarketplace";
import { CustomerBookingsPanel } from "@/components/customer/CustomerBookingsPanel";
import { BookingNotificationBanner } from "@/components/customer/BookingNotificationBanner";
import { ReportProviderModal } from "@/components/ReportProviderModal";
import { PageHeader, QuickNav, Section } from "@/components/ui/Section";
import { useMockApp } from "@/context/MockAppContext";
import { mockProviderToLegacy } from "@/lib/mock/operations";
import { assignRecommendationLabels } from "@/lib/recommendations";
import {
  hasCustomerRole,
  hasProviderRole,
  isAdmin,
} from "@/lib/user-capabilities";

type DiscoverTab = "recommended" | "popular";

export function CustomerDashboardClient() {
  const searchParams = useSearchParams();
  const bookingsTabParam = searchParams.get("bookings");
  const initialBookingsTab =
    bookingsTabParam === "past"
      ? "past"
      : bookingsTabParam === "upcoming"
        ? "upcoming"
        : undefined;

  const {
    user,
    ready,
    db,
    dbRevision,
    activeMode,
    enableProviderRole,
    getStats,
    filterProviders,
    getRecentlyViewedProviders,
    getSavedProviders,
  } = useMockApp();
  const router = useRouter();
  const [reportTarget, setReportTarget] = useState<{
    providerId: string;
    providerName: string;
    bookingId?: string;
  } | null>(null);
  const [discoverTab, setDiscoverTab] = useState<DiscoverTab>("recommended");

  const [becomingProvider, setBecomingProvider] = useState(false);

  const isCustomerMode =
    !!user && hasCustomerRole(user) && activeMode === "customer";
  const canBook = isCustomerMode;
  const showBecomeProvider =
    !!user && hasCustomerRole(user) && !hasProviderRole(user) && !isAdmin(user);

  useEffect(() => {
    if (!ready || !user || isAdmin(user)) return;
    if (hasProviderRole(user) && activeMode === "provider") {
      router.replace("/provider/dashboard");
    }
  }, [ready, user, activeMode, router]);

  const stats = getStats();
  const bookings = useMemo(() => {
    if (!isCustomerMode || !user || !db) return [];
    return db.bookings.filter((b) => b.customerId === user.id);
  }, [isCustomerMode, user, db, dbRevision]);
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
    ? isCustomerMode
      ? `Welcome back, ${user.name.split(" ")[0]}`
      : `Browse services, ${user.name.split(" ")[0]}`
    : "Find your perfect pro";

  useEffect(() => {
    if (!ready || !isCustomerMode) return;
    if (bookingsTabParam || window.location.hash === "#your-bookings") {
      const timer = window.setTimeout(() => {
        document
          .getElementById("your-bookings")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
      return () => window.clearTimeout(timer);
    }
  }, [ready, isCustomerMode, bookingsTabParam, dbRevision]);

  const recLabels = assignRecommendationLabels(
    recommended.map(mockProviderToLegacy)
  );
  const popularLabels = assignRecommendationLabels(
    popular.map(mockProviderToLegacy)
  );

  const discoverProviders =
    discoverTab === "recommended" ? recommended : popular;
  const discoverLabels =
    discoverTab === "recommended" ? recLabels : popularLabels;
  const hasDiscover = recommended.length > 0 || popular.length > 0;

  const quickLinks = [
    ...(isCustomerMode && user ? [{ href: "#your-bookings", label: "Bookings" }] : []),
    { href: "#marketplace", label: "Browse" },
    ...(hasDiscover ? [{ href: "#discover", label: "Suggestions" }] : []),
  ];

  if (!ready) {
    return (
      <div className="page-shell">
        <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
        <div className="mt-8 h-12 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  async function handleBecomeProvider() {
    setBecomingProvider(true);
    const result = await enableProviderRole();
    setBecomingProvider(false);
    if (result.redirect) {
      router.push(result.redirect);
      router.refresh();
    }
  }

  return (
    <div className="page-shell page-enter space-y-10">
      <PageHeader
        eyebrow="Browse & book local pros"
        title={greeting}
        description={`${stats.verifiedProviders} verified pros · ${stats.jobsCompleted.toLocaleString()}+ jobs completed`}
        actions={
          <>
            {showBecomeProvider && (
              <button
                type="button"
                onClick={handleBecomeProvider}
                disabled={becomingProvider}
                className="btn-secondary"
              >
                {becomingProvider ? "Setting up…" : "Become a Provider"}
              </button>
            )}
            {isCustomerMode && user && (
              <Link href="/customer/saved" className="btn-secondary">
                Saved ({savedCount})
              </Link>
            )}
            {!user && (
              <Link href="/login" className="btn-primary">
                Log in to book
              </Link>
            )}
          </>
        }
      />

      <QuickNav links={quickLinks} />

      {isCustomerMode && user && (
        <div className="space-y-4">
          <BookingNotificationBanner />
          <CustomerBookingsPanel
            key={`${dbRevision}-${initialBookingsTab ?? "default"}`}
            bookings={bookings}
            initialTab={initialBookingsTab}
            onReport={(target) => setReportTarget(target)}
          />
        </div>
      )}

      <ProviderMarketplace showAssistant={canBook} />

      {hasDiscover && (
        <Section
          id="discover"
          title="Suggested for you"
          description="Curated picks based on ratings and local demand"
          collapsible
          defaultOpen={false}
          className="section-divider"
        >
          <div className="mb-4 flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
            {(
              [
                { id: "recommended" as const, label: "Recommended" },
                { id: "popular" as const, label: "Popular" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setDiscoverTab(t.id)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  discoverTab === t.id
                    ? "bg-white text-green-800 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {discoverProviders.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {discoverProviders.map((p, i) => (
                <ProviderCard
                  key={p.id}
                  provider={mockProviderToLegacy(p)}
                  showHire={canBook}
                  isBestMatch={discoverTab === "recommended" && i === 0}
                  recommendationLabel={discoverLabels.get(p.id)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No {discoverTab === "recommended" ? "recommendations" : "popular picks"} right now.
            </p>
          )}
        </Section>
      )}

      {user && recent.length > 0 && (
        <Section
          title="Recently viewed"
          description="Pick up where you left off"
          collapsible
          defaultOpen={false}
        >
          <div className="flex flex-wrap gap-2">
            {recent.map((p) => (
              <Link
                key={p.id}
                href={`/provider/${p.id}`}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm transition hover:border-green-200 hover:bg-green-50/50"
              >
                <span className="font-medium text-gray-900">{p.name}</span>
                <span className="mx-1.5 text-gray-300">·</span>
                <span className="text-gray-500">{p.services[0]}</span>
              </Link>
            ))}
          </div>
        </Section>
      )}

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
