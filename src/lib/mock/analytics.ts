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
  };
}
