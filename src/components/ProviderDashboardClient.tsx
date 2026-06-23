"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ProviderProfileForm } from "@/components/ProviderProfileForm";
import { StatCard } from "@/components/StatCard";
import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";
import { BookingStatusBadge } from "@/components/BookingStatusBadge";
import { BookingChat } from "@/components/BookingChat";
import { ProviderScheduleManager } from "@/components/ProviderScheduleManager";
import { useMockApp } from "@/context/MockAppContext";
import { useToast } from "@/components/Toast";
import { getComparablePrice } from "@/lib/pricing";

export function ProviderDashboardClient() {
  const router = useRouter();
  const {
    user,
    ready,
    loading,
    getProviderForUser,
    getBookingsForProvider,
    completeBooking,
    respondToBooking,
    cancelBooking,
  } = useMockApp();
  const { toast } = useToast();
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace("/login?redirect=/provider/dashboard");
    else if (user.role === "customer") router.replace("/customer/dashboard");
    else if (user.role === "admin") router.replace("/admin");
  }, [ready, user, router]);

  if (!ready) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
      </div>
    );
  }

  if (!user || user.role !== "provider") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center text-gray-500">
        Loading…
      </div>
    );
  }

  const provider = getProviderForUser(user.id);
  const bookings = provider ? getBookingsForProvider(provider.id) : [];
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const totalJobs = provider?.jobsCompleted ?? 0;
  const price = provider?.price ?? 0;
  const avgRating = provider?.ratingAvg ?? 0;
  const fakeEarnings = Math.round(
    totalJobs * getComparablePrice(provider?.pricingType ?? "hourly", price) * 2.5
  );

  function handleComplete(bookingId: string) {
    startTransition(async () => {
      const result = await completeBooking(bookingId);
      if (result.error) {
        toast(result.error, "error");
        return;
      }
      toast("Job marked complete — payment released", "success");
    });
  }

  function handleRespond(bookingId: string, accepted: boolean) {
    startTransition(async () => {
      const result = await respondToBooking(bookingId, accepted);
      if (result.error) {
        toast(result.error, "error");
        return;
      }
      toast(accepted ? "Booking accepted" : "Booking declined", accepted ? "success" : "info");
    });
  }

  function handleCancel(bookingId: string) {
    startTransition(async () => {
      const result = await cancelBooking(bookingId);
      if (result.error) toast(result.error, "error");
      else toast("Booking cancelled for customer", "success");
    });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Provider Dashboard</h1>
      <p className="mt-1 text-gray-600">
        Welcome back, {user.name}. Manage your profile and track your business.
      </p>

      {provider ? (
        <>
          <div
            className={`mt-6 rounded-2xl border p-4 text-sm ${
              provider.approved
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            {provider.approved
              ? "✓ Your profile is verified and visible to customers."
              : "⏳ Your profile is pending admin approval — you won't appear in search until approved."}
          </div>

          {pendingCount > 0 && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {pendingCount} booking request{pendingCount === 1 ? "" : "s"} awaiting your response
              (simulated auto-accept/reject).
            </div>
          )}

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatCard label="Jobs completed" value={totalJobs} sub="All time" accent="primary" />
            <StatCard
              label="Average rating"
              value={avgRating.toFixed(1)}
              sub={`${provider.reviewCount} reviews`}
              accent="medium"
            />
            <StatCard
              label="Est. earnings"
              value={`$${fakeEarnings.toLocaleString()}`}
              sub="Based on completed jobs"
              accent="dark"
            />
          </div>

          <div className="mt-8">
            <AvailabilityCalendar
              availability={provider.availability}
              availableToday={provider.availableToday}
              availableTomorrow={provider.availableTomorrow}
            />
          </div>

          <ProviderScheduleManager />
        </>
      ) : (
        <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Complete your profile below to start receiving bookings.
        </p>
      )}

      <div className="mt-8">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Edit profile</h2>
        <ProviderProfileForm
          defaultValues={
            provider
              ? {
                  services: provider.services,
                  pricing_type: provider.pricingType,
                  price: provider.price,
                  base_price: provider.basePrice,
                  hourly_rate: provider.hourlyRate,
                  location: provider.location,
                  description: provider.description,
                  availability: provider.availability,
                  availableToday: provider.availableToday,
                  availableTomorrow: provider.availableTomorrow,
                }
              : undefined
          }
        />
      </div>

      {bookings.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-gray-900">Bookings</h2>
          <p className="text-sm text-gray-500">
            {confirmedCount} active · responses simulated automatically
          </p>
          <div className="mt-4 space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">
                      {booking.customerName} — {booking.service}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {booking.date}
                      {booking.time ? ` at ${booking.time}` : ""} · ${booking.estimatedCost} est.
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
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {booking.status === "pending" && (
                      <>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleRespond(booking.id, true)}
                          className="btn-primary px-3 py-1.5 text-sm disabled:opacity-60"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleRespond(booking.id, false)}
                          className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-60"
                        >
                          Decline
                        </button>
                      </>
                    )}
                    {booking.status === "confirmed" && (
                      <>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleComplete(booking.id)}
                          className="btn-primary shrink-0 px-4 py-2 text-sm disabled:opacity-60"
                        >
                          Mark job complete
                        </button>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleCancel(booking.id)}
                          className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-60"
                        >
                          Cancel job
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {(booking.status === "confirmed" || booking.status === "completed") && (
                  <div className="mt-4">
                    <BookingChat booking={booking} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
