import type { MockBooking, MockDatabase, MockProvider } from "./types";
import { MOCK_DB_VERSION } from "./types";

function deriveResponseSpeed(mins: number): MockProvider["responseSpeed"] {
  if (mins <= 20) return "fast";
  if (mins <= 60) return "medium";
  return "slow";
}

function normalizeBooking(booking: MockBooking): MockBooking {
  const status = booking.status ?? "pending";
  let paymentStatus = booking.paymentStatus;
  if (!paymentStatus) {
    if (status === "completed") paymentStatus = "released";
    else if (status === "cancelled") paymentStatus = "refunded";
    else if (status === "confirmed") paymentStatus = "authorized";
    else paymentStatus = "none";
  }
  return { ...booking, status, paymentStatus };
}

export const DEFAULT_WEEK_AVAILABILITY = [true, true, true, true, true, false, false];

function normalizeWeekAvailability(
  provider: MockProvider,
  weekAvailability?: boolean[]
): boolean[] {
  if (weekAvailability?.length === 7) return weekAvailability;
  const d = new Date().getDay();
  const todayIdx = d === 0 ? 6 : d - 1;
  const tomorrowIdx = (todayIdx + 1) % 7;
  return DEFAULT_WEEK_AVAILABILITY.map((defaultVal, i) => {
    if (i === todayIdx) return provider.availableToday;
    if (i === tomorrowIdx) return provider.availableTomorrow;
    return defaultVal;
  });
}

function normalizeProvider(provider: MockProvider): MockProvider {
  return {
    ...provider,
    services: provider.services ?? [],
    tags: provider.tags ?? [],
    responseSpeed:
      provider.responseSpeed ??
      deriveResponseSpeed(provider.responseTimeMins ?? 60),
    weekAvailability: normalizeWeekAvailability(provider, provider.weekAvailability),
    blockedSlots: provider.blockedSlots ?? [],
    rejected: provider.rejected ?? false,
    ratingAvg: Number.isFinite(provider.ratingAvg) ? provider.ratingAvg : 0,
    reviewCount: provider.reviewCount ?? 0,
    jobsCompleted: provider.jobsCompleted ?? 0,
  };
}

/** Patch localStorage DBs to the current schema. */
export function normalizeMockDatabase(raw: MockDatabase): MockDatabase {
  return {
    version: MOCK_DB_VERSION,
    users: raw.users ?? [],
    providers: (raw.providers ?? []).map(normalizeProvider),
    bookings: (raw.bookings ?? []).map(normalizeBooking),
    reviews: raw.reviews ?? [],
    chatMessages: raw.chatMessages ?? [],
    notifications: raw.notifications ?? [],
    reports: raw.reports ?? [],
  };
}
