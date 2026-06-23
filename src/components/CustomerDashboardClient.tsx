"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProviderCard } from "@/components/ProviderCard";
import { ReviewForm } from "@/components/ReviewForm";
import { ProviderMarketplace } from "@/components/ProviderMarketplace";
import { useMockApp } from "@/context/MockAppContext";
import { mockProviderToLegacy } from "@/lib/mock/operations";

export function CustomerDashboardClient() {
  const router = useRouter();
  const { user, ready, getStats, filterProviders, getBookingsForCustomer } = useMockApp();

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
  const greeting = user
    ? `Welcome back, ${user.name.split(" ")[0]} 👋`
    : "Find your perfect pro";

  if (user && user.role !== "customer") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center text-gray-500">
        Redirecting…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-green-700">Your marketplace</p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{greeting}</h1>
          <p className="mt-1 text-gray-600">
            {stats.verifiedProviders.toLocaleString()} verified pros ·{" "}
            {stats.totalBookings.toLocaleString()} bookings on platform
          </p>
        </div>
        {!user && (
          <Link href="/login" className="btn-primary">
            Log in to book
          </Link>
        )}
      </div>

      {user && recommended.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">Recommended for you</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-3">
            {recommended.map((p) => (
              <ProviderCard
                key={p.id}
                provider={mockProviderToLegacy(p)}
                showHire
                isTopRated
              />
            ))}
          </div>
        </section>
      )}

      {user && bookings.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-gray-900">Recent bookings</h2>
          <div className="mt-4 space-y-3">
            {bookings.slice(0, 5).map((booking) => (
              <div key={booking.id} className="card p-5">
                <p className="font-semibold text-gray-900">
                  {booking.providerName} — {booking.service}
                </p>
                <p className="text-sm text-gray-500">
                  {booking.date}
                  {booking.time ? ` at ${booking.time}` : ""} · ${booking.estimatedCost} est. ·{" "}
                  <span className={booking.status === "confirmed" ? "text-green-600" : "text-amber-500"}>
                    {booking.status}
                  </span>
                </p>
                <div className="mt-4">
                  <ReviewForm providerId={booking.providerId} bookingId={booking.id} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <ProviderMarketplace />
    </div>
  );
}
