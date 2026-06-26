"use client";

import Link from "next/link";
import { useMemo, useState, useTransition, useEffect } from "react";
import { BookingStatusBadge } from "@/components/BookingStatusBadge";
import { BookingChat } from "@/components/BookingChat";
import { ReviewEligibilityPanel } from "@/components/ReviewEligibilityPanel";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/Toast";
import { useMockApp } from "@/context/MockAppContext";
import { canReviewBooking } from "@/lib/mock/operations";
import type { MockBooking } from "@/lib/mock/types";

type Tab = "upcoming" | "past";

function sortUpcoming(a: MockBooking, b: MockBooking) {
  const da = `${a.date}T${a.time ?? "00:00"}`;
  const db = `${b.date}T${b.time ?? "00:00"}`;
  return da.localeCompare(db);
}

function sortPast(a: MockBooking, b: MockBooking) {
  const ta = new Date(a.completedAt ?? a.date).getTime();
  const tb = new Date(b.completedAt ?? b.date).getTime();
  return tb - ta;
}

type CustomerBookingsPanelProps = {
  bookings: MockBooking[];
  initialTab?: Tab;
  onReport: (target: {
    providerId: string;
    providerName: string;
    bookingId: string;
  }) => void;
};

export function CustomerBookingsPanel({
  bookings,
  initialTab,
  onReport,
}: CustomerBookingsPanelProps) {
  const { db, cancelBooking, user } = useMockApp();
  const { toast } = useToast();
  const [, startTransition] = useTransition();
  const [tab, setTab] = useState<Tab>(initialTab ?? "upcoming");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  const { upcoming, past } = useMemo(() => {
    const up = bookings
      .filter((b) => b.status === "pending" || b.status === "confirmed")
      .sort(sortUpcoming);
    const pa = bookings
      .filter((b) => b.status === "completed" || b.status === "declined" || b.status === "cancelled")
      .sort(sortPast);
    return { upcoming: up, past: pa };
  }, [bookings]);

  const visible = tab === "upcoming" ? upcoming : past;

  return (
    <section id="your-bookings" className="scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="section-title">Your bookings</h2>
          <p className="section-desc">
            {upcoming.length} upcoming · {past.length} past
          </p>
        </div>
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
          {(
            [
              { id: "upcoming" as const, label: "Upcoming", count: upcoming.length },
              { id: "past" as const, label: "Past", count: past.length },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                tab === t.id
                  ? "bg-white text-green-800 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className="ml-1.5 text-xs text-gray-400">({t.count})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title={tab === "upcoming" ? "No upcoming bookings" : "No past bookings yet"}
            description={
              tab === "upcoming"
                ? "Browse providers below and book your first service — it only takes a minute."
                : "Completed jobs will appear here after your first booking."
            }
            icon={tab === "upcoming" ? "📅" : "✅"}
            action={
              tab === "upcoming" ? (
                <a href="#marketplace" className="btn-primary inline-block">
                  Find a provider
                </a>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {visible.map((booking) => {
            const canReview =
              user != null &&
              db != null &&
              canReviewBooking(db, booking, user.id);
            const showChat =
              booking.status === "confirmed" || booking.status === "completed";

            return (
              <div
                key={booking.id}
                className="card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {booking.service}
                    </p>
                    <p className="mt-1 text-sm text-gray-700">
                      <span className="text-gray-500">Provider:</span>{" "}
                      <Link
                        href={`/provider/${booking.providerId}`}
                        className="font-medium text-green-700 hover:underline"
                      >
                        {booking.providerName}
                      </Link>
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
                          booking.status === "confirmed" || booking.status === "completed"
                        }
                      />
                    </div>
                    {booking.status === "pending" && (
                      <p className="mt-2 text-xs text-amber-600">
                        Waiting for provider to accept…
                      </p>
                    )}
                    {booking.status === "declined" && (
                      <p className="mt-2 text-xs text-red-600">
                        Provider declined — try another time or pro.
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    {(booking.status === "pending" || booking.status === "confirmed") && (
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
                        {cancellingId === booking.id ? "Cancelling…" : "Cancel"}
                      </button>
                    )}
                    {booking.status === "completed" && (
                      <Link
                        href={`/provider/${booking.providerId}?service=${encodeURIComponent(booking.service)}&rebook=1&quick=1`}
                        className="btn-primary px-3 py-1.5 text-center text-sm"
                      >
                        Book again
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        onReport({
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
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <BookingChat booking={booking} />
                  </div>
                )}

                <ReviewEligibilityPanel
                  booking={booking}
                  providerId={booking.providerId}
                  className="mt-4 border-t border-gray-100 pt-4"
                />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
