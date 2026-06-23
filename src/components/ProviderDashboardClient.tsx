"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProviderProfileForm } from "@/components/ProviderProfileForm";
import { StatCard } from "@/components/StatCard";
import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";
import { useMockApp } from "@/context/MockAppContext";

export function ProviderDashboardClient() {
  const router = useRouter();
  const { user, ready, getProviderForUser, getBookingsForProvider } = useMockApp();

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
  const totalJobs = provider?.jobsCompleted ?? confirmedCount;
  const hourlyRate = provider?.hourlyRate ?? 0;
  const avgRating = provider?.ratingAvg ?? 0;
  const fakeEarnings = Math.round(totalJobs * hourlyRate * 2.5);

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

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatCard label="Jobs completed" value={totalJobs} sub="All time" accent="primary" />
            <StatCard label="Average rating" value={avgRating.toFixed(1)} sub={`${provider.reviewCount} reviews`} accent="medium" />
            <StatCard label="Est. earnings" value={`$${fakeEarnings.toLocaleString()}`} sub="Based on completed jobs" accent="dark" />
          </div>

          <div className="mt-8">
            <AvailabilityCalendar
              availability={provider.availability}
              availableToday={provider.availableToday}
              availableTomorrow={provider.availableTomorrow}
            />
          </div>
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
          <h2 className="text-xl font-bold text-gray-900">Upcoming bookings</h2>
          <p className="text-sm text-gray-500">Jobs from customers — synced from mock database</p>
          <div className="mt-4 space-y-3">
            {bookings.map((booking) => (
              <div key={booking.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900">
                    {booking.customerName} — {booking.service}
                  </p>
                  <span className={`tag-pill ${booking.status === "confirmed" ? "badge-verified" : "badge-pending"}`}>
                    {booking.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {booking.date}
                  {booking.time ? ` at ${booking.time}` : ""} · ${booking.estimatedCost} est.
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
