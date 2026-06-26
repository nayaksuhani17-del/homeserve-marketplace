"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CustomerJobSidebar } from "@/components/customer/dashboard/CustomerJobSidebar";
import {
  CustomerCenterPanel,
  type CenterView,
} from "@/components/customer/dashboard/CustomerCenterPanel";
import { useMockApp } from "@/context/MockAppContext";
import { parseSearchFallback } from "@/lib/ai/parse-search";
import {
  hasCustomerRole,
  hasProviderRole,
  isAdmin,
} from "@/lib/user-capabilities";

export function CustomerDashboardClient() {
  const searchParams = useSearchParams();
  const bookingsTabParam = searchParams.get("bookings");
  const router = useRouter();

  const {
    user,
    ready,
    db,
    dbRevision,
    activeMode,
    enableProviderRole,
    filterProviders,
  } = useMockApp();

  const [centerView, setCenterView] = useState<CenterView>({ type: "search" });
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
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

  const bookings = useMemo(() => {
    if (!user || !db) return [];
    if (!hasCustomerRole(user)) return [];
    return [...db.bookings.filter((b) => b.customerId === user.id)].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [user, db, dbRevision]);

  const pending = useMemo(
    () => bookings.filter((b) => b.status === "pending"),
    [bookings]
  );
  const active = useMemo(
    () => bookings.filter((b) => b.status === "confirmed"),
    [bookings]
  );
  const completed = useMemo(
    () => bookings.filter((b) => b.status === "completed"),
    [bookings]
  );

  const hasReview = useCallback(
    (bookingId: string) =>
      Boolean(db?.reviews.some((r) => r.bookingId === bookingId)),
    [db]
  );

  useEffect(() => {
    if (!ready || !isCustomerMode || bookings.length === 0) return;
    if (bookingsTabParam === "past") {
      const job = completed[0] ?? bookings.find((b) => b.status === "declined");
      if (job) {
        setSelectedJobId(job.id);
        setCenterView({ type: "job", bookingId: job.id });
      }
      return;
    }
    if (bookingsTabParam === "upcoming") {
      const job = active[0] ?? pending[0];
      if (job) {
        setSelectedJobId(job.id);
        setCenterView({ type: "job", bookingId: job.id });
      }
    }
  }, [ready, isCustomerMode, bookingsTabParam, bookings, completed, active, pending]);

  function handleNewRequest() {
    setSelectedJobId(null);
    setCenterView({ type: "search" });
  }

  function handleSelectJob(bookingId: string) {
    setSelectedJobId(bookingId);
    setCenterView({ type: "job", bookingId });
  }

  function handleSearch(query: string) {
    const parsed = parseSearchFallback(query);
    const feed = filterProviders({
      q: query,
      service: parsed.service,
      status: "verified",
      sort: parsed.sort ?? "rating",
      availability: parsed.availability,
      maxPrice: parsed.maxPrice ? String(parsed.maxPrice) : undefined,
      minRating: parsed.minRating ? String(parsed.minRating) : undefined,
    });
    setSelectedJobId(null);
    setCenterView({
      type: "results",
      query,
      providers: feed.list.slice(0, 8),
    });
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

  if (!ready) {
    return (
      <div className="flex min-h-[calc(100dvh-9rem)] items-center justify-center bg-white">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-9rem)] w-full flex-col md:flex-row">
      {isCustomerMode && (
        <CustomerJobSidebar
          pending={pending}
          active={active}
          completed={completed}
          selectedId={selectedJobId}
          onNewRequest={handleNewRequest}
          onSelectJob={handleSelectJob}
          showBecomeProvider={showBecomeProvider}
          onBecomeProvider={handleBecomeProvider}
          becomingProvider={becomingProvider}
        />
      )}

      <CustomerCenterPanel
        view={centerView}
        bookings={bookings}
        canBook={canBook}
        isLoggedIn={Boolean(user)}
        hasReview={hasReview}
        onSearch={handleSearch}
        onReset={handleNewRequest}
      />
    </div>
  );
}
