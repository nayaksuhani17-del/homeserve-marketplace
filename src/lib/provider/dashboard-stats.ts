import type { MockBooking, MockProvider, MockReview, ResponseSpeed } from "@/lib/mock/types";

export type ProviderEarningsJob = {
  id: string;
  customerName: string;
  service: string;
  date: string;
  amount: number;
};

export type ProviderEarnings = {
  total: number;
  weekTotal: number;
  perJob: ProviderEarningsJob[];
  weeklyChart: { label: string; amount: number }[];
  weekGrowthPercent: number;
};

export type ProviderInsight = {
  icon: string;
  text: string;
  accent?: "green" | "blue" | "amber";
};

export type SmartAlert = {
  id: string;
  icon: string;
  title: string;
  message: string;
  urgent?: boolean;
};

const STREETS = [
  "Oak Street",
  "Maple Avenue",
  "Cedar Lane",
  "Birch Road",
  "Willow Drive",
  "Pine Court",
  "Elm Street",
  "Lakeview Blvd",
];

function bookingTimestamp(booking: MockBooking): number {
  return new Date(booking.completedAt ?? booking.date).getTime();
}

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

export function getBookingAddress(booking: MockBooking, providerLocation?: string): string {
  const h = hashSeed(booking.id);
  const num = 100 + (h % 899);
  const street = STREETS[h % STREETS.length]!;
  const city = providerLocation?.split(",")[0]?.trim() || "Springfield";
  return `${num} ${street}, ${city}`;
}

export function getResponseSpeedLabel(speed?: ResponseSpeed, mins?: number): string {
  if (speed === "fast") return "Fast";
  if (speed === "medium") return "Medium";
  if (speed === "slow") return "Slow";
  if (!mins || mins <= 20) return "Fast";
  if (mins <= 60) return "Medium";
  return "Slow";
}

/** @deprecated Use getResponseSpeedLabel */
export function getResponseTimeLabel(mins?: number): string {
  return getResponseSpeedLabel(undefined, mins);
}

export function getProviderEarnings(bookings: MockBooking[]): ProviderEarnings {
  const completed = bookings.filter((b) => b.status === "completed");
  const weekAgo = Date.now() - 7 * 86400000;
  const twoWeeksAgo = Date.now() - 14 * 86400000;

  const total = completed.reduce((sum, b) => sum + b.estimatedCost, 0);
  const weekJobs = completed.filter((b) => bookingTimestamp(b) >= weekAgo);
  const prevWeekJobs = completed.filter((b) => {
    const t = bookingTimestamp(b);
    return t >= twoWeeksAgo && t < weekAgo;
  });
  const weekTotal = weekJobs.reduce((sum, b) => sum + b.estimatedCost, 0);
  const prevWeekTotal = prevWeekJobs.reduce((sum, b) => sum + b.estimatedCost, 0);
  const weekGrowthPercent =
    prevWeekTotal > 0
      ? Math.round(((weekTotal - prevWeekTotal) / prevWeekTotal) * 100)
      : weekTotal > 0
        ? 20
        : 0;

  const perJob = [...completed]
    .sort((a, b) => bookingTimestamp(b) - bookingTimestamp(a))
    .slice(0, 8)
    .map((b) => ({
      id: b.id,
      customerName: b.customerName,
      service: b.service,
      date: b.date,
      amount: b.estimatedCost,
    }));

  const weeklyChart = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split("T")[0]!;
    const label = d.toLocaleDateString("en-US", { weekday: "short" });
    const amount = completed
      .filter((b) => (b.completedAt ?? b.date).startsWith(key))
      .reduce((s, b) => s + b.estimatedCost, 0);
    return { label, amount };
  });

  return { total, weekTotal, perJob, weeklyChart, weekGrowthPercent };
}

/** Scales lifetime total when seed has fewer completed rows than jobsCompleted. */
export function getProviderDisplayEarnings(
  bookings: MockBooking[],
  provider: MockProvider
): ProviderEarnings {
  const base = getProviderEarnings(bookings);
  const completedInDb = bookings.filter((b) => b.status === "completed").length;
  if (completedInDb > 0 && provider.jobsCompleted > completedInDb) {
    const avg = base.total / completedInDb;
    const lifetimeTotal = Math.round(avg * provider.jobsCompleted);
    return { ...base, total: Math.max(base.total, lifetimeTotal) };
  }
  return base;
}

export function getTopService(bookings: MockBooking[]): string | null {
  const counts = new Map<string, number>();
  for (const b of bookings) {
    if (b.status === "completed" || b.status === "confirmed") {
      counts.set(b.service, (counts.get(b.service) ?? 0) + 1);
    }
  }
  let top: string | null = null;
  let max = 0;
  for (const [service, count] of counts) {
    if (count > max) {
      max = count;
      top = service;
    }
  }
  return top;
}

export function getProviderInsights(
  provider: MockProvider,
  bookings: MockBooking[],
  earnings: ProviderEarnings
): ProviderInsight[] {
  const weekAgo = Date.now() - 7 * 86400000;
  const jobsThisWeek = bookings.filter(
    (b) => b.status === "completed" && bookingTimestamp(b) >= weekAgo
  ).length;

  const insights: ProviderInsight[] = [];

  if (provider.ratingAvg >= 4.5) {
    insights.push({
      icon: "🏆",
      text: "You're among top-rated providers in your area.",
      accent: "green",
    });
  }

  insights.push({
    icon: "📈",
    text:
      jobsThisWeek > 0
        ? `You completed ${jobsThisWeek} job${jobsThisWeek === 1 ? "" : "s"} this week.`
        : "Accept new requests to build momentum this week.",
    accent: "blue",
  });

  const topService = getTopService(bookings);
  if (topService) {
    insights.push({
      icon: "🔧",
      text: `Most customers hire you for ${topService.toLowerCase()} jobs.`,
      accent: "amber",
    });
  }

  return insights.slice(0, 3);
}

export function getReviewForBooking(
  reviews: MockReview[],
  bookingId: string
): MockReview | undefined {
  return reviews.find((r) => r.bookingId === bookingId);
}

export function getSmartAlerts(
  bookings: MockBooking[],
  reviews: MockReview[],
  notifications: { id: string; title: string; message: string; read: boolean }[]
): SmartAlert[] {
  const alerts: SmartAlert[] = [];
  const now = Date.now();

  const pending = bookings.filter((b) => b.status === "pending");
  if (pending.length > 0) {
    alerts.push({
      id: "alert-pending",
      icon: "📥",
      title: "You have a new job request",
      message: `${pending.length} customer request${pending.length === 1 ? "" : "s"} waiting for your response.`,
      urgent: true,
    });
  }

  for (const b of bookings.filter((x) => x.status === "confirmed")) {
    if (!b.date || !b.time) continue;
    const slot = new Date(`${b.date}T${b.time}:00`);
    const diff = slot.getTime() - now;
    if (diff > 0 && diff <= 2 * 60 * 60 * 1000) {
      const mins = Math.max(1, Math.round(diff / 60000));
      alerts.push({
        id: `alert-soon-${b.id}`,
        icon: "⏰",
        title: mins <= 60 ? "Job starting in 1 hour" : "Upcoming job reminder",
        message: `${b.service} with ${b.customerName} at ${b.time} (${mins} min).`,
        urgent: true,
      });
      break;
    }
  }

  const recentReview = reviews[0];
  if (recentReview) {
    const reviewAge = Date.now() - new Date(recentReview.createdAt).getTime();
    if (reviewAge < 3 * 86400000) {
      alerts.push({
        id: "alert-review",
        icon: "⭐",
        title: "New review received",
        message: `${recentReview.customerName} left a ${recentReview.rating}-star review.`,
      });
    }
  }

  for (const n of notifications.filter((x) => !x.read).slice(0, 4)) {
    alerts.push({
      id: n.id,
      icon: "🔔",
      title: n.title,
      message: n.message,
    });
  }

  return alerts.slice(0, 6);
}

export function sortBookingsBySchedule(bookings: MockBooking[]): MockBooking[] {
  return [...bookings].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return (a.time ?? "").localeCompare(b.time ?? "");
  });
}
