"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ProviderCard } from "@/components/ProviderCard";
import { ReviewForm } from "@/components/ReviewForm";
import { ProviderMarketplace } from "@/components/ProviderMarketplace";
import { BookingStatusBadge } from "@/components/BookingStatusBadge";
import { BookingChat } from "@/components/BookingChat";
import { ReportProviderModal } from "@/components/ReportProviderModal";
import { useToast } from "@/components/Toast";
import { useMockApp } from "@/context/MockAppContext";
import { hasReviewForBooking } from "@/lib/mock/operations";
import { mockProviderToLegacy } from "@/lib/mock/operations";
import { assignRecommendationLabels } from "@/lib/recommendations";

export function CustomerDashboardClient() {
  const router = useRouter();
  const {
    user,
    ready,
    db,
    getStats,
    filterProviders,
    getBookingsForCustomer,
    getRecentlyViewedProviders,
    getSavedProviders,
    cancelBooking,
  } = useMockApp();
  const { toast } = useToast();
  const [, startTransition] = useTransition();
  const [reportTarget, setReportTarget] = useState<{
    providerId: string;
    providerName: string;
    bookingId?: string;
  } | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !user) return;
    if (user.role === "provider") router.replace("/provider/dashboard");
    else if (user.role === "admin") router.replace("/admin");
  }, [ready, user, router]);

  if (!ready) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
        <div className="mt-8 h-12 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  const stats = getStats();
  const bookings = user?.role === "customer" ? getBookingsForCustomer(user.id) : [];
  const recommended = filterProviders({ status: "verified" }).topRanked;
  const recent = user ? getRecentlyViewedProviders() : [];
  const savedCount = user ? getSavedProviders().length : 0;
  const greeting = user
    ? `Welcome back, ${user.name.split(" ")[0]} 👋`
    : "Find your perfect pro";

  const recLabels = assignRecommendationLabels(
    recommended.map(mockProviderToLegacy)
  );

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
            <h2 className="text-lg font-semibold text-gray-900">Top picks for you</h2>
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

      {user && recent.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900">Recently viewed</h2>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
            {recent.map((p) => (
              <Link
                key={p.id}
                href={`/provider/${p.id}`}
                className="card card-hover shrink-0 px-4 py-3 text-sm"
              >
                <p className="font-medium text-gray-900">{p.name}</p>
                <p className="text-xs text-gray-500">{p.services[0]}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {user && bookings.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-gray-900">Your bookings</h2>
          <div className="mt-4 space-y-4">
            {bookings.slice(0, 8).map((booking) => {
              const canReview =
                booking.status === "completed" &&
                db != null &&
                !hasReviewForBooking(db, booking.id);
              const showChat =
                booking.status === "confirmed" || booking.status === "completed";

              return (
                <div key={booking.id} className="card p-5 transition hover:shadow-md">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {booking.providerName} — {booking.service}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {booking.date}
                        {booking.time ? ` at ${booking.time}` : ""} · ~{booking.hours}h · $
                        {booking.estimatedCost} est.
                      </p>
                      <div className="mt-2">
                        <BookingStatusBadge
                          status={booking.status}
                          paymentStatus={booking.paymentStatus}
                          showPayment={
                            booking.status === "confirmed" ||
                            booking.status === "completed"
                          }
                        />
                      </div>
                      {booking.status === "pending" && (
                        <p className="mt-2 text-xs text-amber-600">
                          Waiting for provider response…
                        </p>
                      )}
                      {booking.status === "declined" && (
                        <p className="mt-2 text-xs text-red-600">
                          This provider is no longer available at that time.
                        </p>
                      )}
                      {booking.status === "cancelled" && (
                        <p className="mt-2 text-xs text-gray-600">
                          This booking was cancelled
                          {booking.paymentStatus === "refunded" ? " — payment refunded." : "."}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col gap-2">
                      {(booking.status === "pending" ||
                        booking.status === "confirmed") && (
                        <button
                          type="button"
                          disabled={cancellingId === booking.id}
                          onClick={() =>
                            startTransition(async () => {
                              setCancellingId(booking.id);
                              const result = await cancelBooking(booking.id);
                              if (result.error) toast(result.error, "error");
                              else toast("Booking cancelled", "success");
                              setCancellingId(null);
                            })
                          }
                          className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-60"
                        >
                          {cancellingId === booking.id ? "Cancelling…" : "Cancel booking"}
                        </button>
                      )}
                      {booking.status === "completed" && (
                        <Link
                          href={`/provider/${booking.providerId}?service=${encodeURIComponent(booking.service)}&rebook=1&quick=1`}
                          className="btn-primary px-3 py-1.5 text-center text-sm"
                        >
                          Quick rebook
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setReportTarget({
                            providerId: booking.providerId,
                            providerName: booking.providerName,
                            bookingId: booking.id,
                          })
                        }
                        className="text-xs text-gray-500 underline hover:text-red-600"
                      >
                        Report issue
                      </button>
                    </div>
                  </div>

                  {showChat && (
                    <div className="mt-4">
                      <BookingChat booking={booking} />
                    </div>
                  )}

                  {canReview && (
                    <div className="mt-4">
                      <ReviewForm
                        providerId={booking.providerId}
                        bookingId={booking.id}
                      />
                    </div>
                  )}
                  {!canReview &&
                    booking.status === "completed" &&
                    db != null &&
                    hasReviewForBooking(db, booking.id) && (
                    <p className="mt-4 text-sm text-green-600">
                      ✓ You reviewed this job
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
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
