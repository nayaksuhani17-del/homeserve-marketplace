import { isDemoAccount } from "@/lib/accounts";
import { buildAdminDemoReports } from "./admin-demo-reports";
import type { MockBooking, MockDatabase, MockProvider, MockUser } from "./types";
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

function normalizeProvider(provider: MockProvider, users: MockUser[]): MockProvider {
  const user = users.find((u) => u.id === provider.userId);
  const base = {
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
  if (user && !isDemoAccount(user) && !base.rejected) {
    return { ...base, approved: true };
  }
  return base;
}

/** Skip full re-normalize on refresh when localStorage already matches schema. */
export function needsNormalization(raw: MockDatabase): boolean {
  if (raw.version !== MOCK_DB_VERSION) return true;
  const providers = raw.providers ?? [];
  if (providers.length === 0) return false;
  return providers.some(
    (p) =>
      !p.responseSpeed ||
      !Array.isArray(p.weekAvailability) ||
      p.weekAvailability.length !== 7 ||
      !Array.isArray(p.blockedSlots) ||
      typeof p.rejected !== "boolean"
  ) || !raw.reports?.length;
}

/** Patch localStorage DBs to the current schema. */
export function normalizeMockDatabase(raw: MockDatabase): MockDatabase {
  return {
    version: MOCK_DB_VERSION,
    users: raw.users ?? [],
    providers: (raw.providers ?? []).map((p) => normalizeProvider(p, raw.users ?? [])),
    bookings: (raw.bookings ?? []).map(normalizeBooking),
    reviews: raw.reviews ?? [],
    chatMessages: raw.chatMessages ?? [],
    notifications: raw.notifications ?? [],
    reports: raw.reports?.length ? raw.reports : buildAdminDemoReports(),
  };
}
