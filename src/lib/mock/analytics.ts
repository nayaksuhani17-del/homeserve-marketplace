import type { MarketplaceAnalytics, MockDatabase } from "./types";

export function getMarketplaceAnalytics(db: MockDatabase): MarketplaceAnalytics {
  const bookings = db.bookings;
  const pending = bookings.filter((b) => b.status === "pending").length;
  const confirmed = bookings.filter((b) => b.status === "confirmed").length;
  const completed = bookings.filter((b) => b.status === "completed").length;
  const cancelled = bookings.filter((b) => b.status === "cancelled").length;
  const declined = bookings.filter((b) => b.status === "declined").length;

  const responded = bookings.filter((b) =>
    ["confirmed", "declined", "completed", "cancelled"].includes(b.status)
  );
  const accepted = bookings.filter((b) =>
    ["confirmed", "completed", "cancelled"].includes(b.status)
  );
  const acceptanceRate =
    responded.length > 0 ? Math.round((accepted.length / responded.length) * 100) : 0;

  const confirmedOrDone = bookings.filter((b) =>
    ["confirmed", "completed"].includes(b.status)
  );
  const completionRate =
    confirmedOrDone.length > 0
      ? Math.round((completed / confirmedOrDone.length) * 100)
      : 0;

  const cancellationRate =
    bookings.length > 0 ? Math.round((cancelled / bookings.length) * 100) : 0;

  const revenueBookings = bookings.filter((b) =>
    ["confirmed", "completed"].includes(b.status)
  );
  const estimatedGmv = revenueBookings.reduce((s, b) => s + b.estimatedCost, 0);
  const avgBookingValue =
    revenueBookings.length > 0
      ? Math.round(estimatedGmv / revenueBookings.length)
      : 0;

  const weekAgo = Date.now() - 7 * 86400000;
  const bookingsLast7Days = bookings.filter(
    (b) => new Date(b.createdAt).getTime() >= weekAgo
  ).length;

  const openReports = (db.reports ?? []).filter((r) => r.status === "open").length;
  const activeJobs = pending + confirmed;

  const serviceCounts = new Map<string, number>();
  for (const b of bookings) {
    serviceCounts.set(b.service, (serviceCounts.get(b.service) ?? 0) + 1);
  }
  const popularServices = [...serviceCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([service, count]) => ({ service, count }));

  const topProviders = [...db.providers]
    .filter((p) => p.approved)
    .sort((a, b) => b.jobsCompleted - a.jobsCompleted || b.ratingAvg - a.ratingAvg)
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      name: p.name,
      rating: p.ratingAvg,
      jobsCompleted: p.jobsCompleted,
    }));

  const bookingsPerDay = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split("T")[0]!;
    const label = d.toLocaleDateString("en-US", { weekday: "short" });
    const count = bookings.filter((b) => b.createdAt.startsWith(key)).length;
    return { label, count };
  });

  return {
    totalBookings: bookings.length,
    pendingBookings: pending,
    confirmedBookings: confirmed,
    completedBookings: completed,
    cancelledBookings: cancelled,
    declinedBookings: declined,
    acceptanceRate,
    completionRate,
    cancellationRate,
    estimatedGmv,
    avgBookingValue,
    openReports,
    bookingsLast7Days,
    activeJobs,
    popularServices,
    topProviders,
    bookingsPerDay,
  };
}
