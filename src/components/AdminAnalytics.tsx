"use client";

import { useMockApp } from "@/context/MockAppContext";
import { StatCard } from "./StatCard";

export function AdminAnalytics() {
  const analytics = useMockApp().getAnalytics();

  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-gray-900">Marketplace analytics</h2>
      <p className="mt-1 text-sm text-gray-500">
        Simulated platform metrics — updates as bookings and reports change.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Est. GMV"
          value={`$${analytics.estimatedGmv.toLocaleString()}`}
          sub={`Avg $${analytics.avgBookingValue}/booking`}
          accent="primary"
        />
        <StatCard
          label="Acceptance rate"
          value={`${analytics.acceptanceRate}%`}
          sub={`${analytics.declinedBookings} declined`}
          accent="medium"
        />
        <StatCard
          label="Completion rate"
          value={`${analytics.completionRate}%`}
          sub={`${analytics.completedBookings} completed`}
          accent="dark"
        />
        <StatCard
          label="Cancellation rate"
          value={`${analytics.cancellationRate}%`}
          sub={`${analytics.cancelledBookings} cancelled`}
          accent="light"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Active pipeline"
          value={analytics.pendingBookings + analytics.confirmedBookings}
          sub={`${analytics.pendingBookings} pending · ${analytics.confirmedBookings} confirmed`}
          accent="light"
        />
        <StatCard
          label="Bookings (7 days)"
          value={analytics.bookingsLast7Days}
          sub={`${analytics.totalBookings} all time`}
          accent="medium"
        />
        <StatCard
          label="Open reports"
          value={analytics.openReports}
          sub="Trust & safety queue"
          accent="dark"
        />
      </div>
    </section>
  );
}
