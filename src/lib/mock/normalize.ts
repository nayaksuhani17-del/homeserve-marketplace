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

function normalizeProvider(provider: MockProvider): MockProvider {
  return {
    ...provider,
    responseSpeed:
      provider.responseSpeed ??
      deriveResponseSpeed(provider.responseTimeMins ?? 60),
    blockedSlots: provider.blockedSlots ?? [],
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
