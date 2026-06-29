import {
  formatAvailabilitySummary,
  weekAvailabilityFromSchedule,
} from "@/lib/availability";
import {
  configFromWeeklySchedule,
  formatAvailabilityConfigSummary,
  normalizeConfig,
  resolveWeeklySchedule,
} from "@/lib/availability-config";
import {
  ensureUserProfileFields,
  publicDisplayName,
} from "@/lib/user-profile";
import { normalizeLocation } from "@/lib/location";
import { buildAdminDemoReports } from "./admin-demo-reports";
import type { MockBooking, MockDatabase, MockProvider, MockUser } from "./types";
import { MOCK_DB_VERSION } from "./types";
import { scrubDatabaseIntegrity } from "./operations";

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
  const verified = provider.verified === true;
  const publicName = user ? publicDisplayName(user) : provider.name;
  const weekAvailability = normalizeWeekAvailability(provider, provider.weekAvailability);
  const weeklySchedule =
    provider.weeklySchedule?.length === 7
      ? provider.weeklySchedule.map((entry, i) => ({
          enabled: entry.enabled ?? weekAvailability[i] ?? false,
          start: entry.start || "09:00",
          end: entry.end || "17:00",
        }))
      : weekAvailability.map((enabled) => ({
          enabled,
          start: "09:00",
          end: "17:00",
        }));
  const availabilityConfig = normalizeConfig(
    provider.availabilityConfig ?? configFromWeeklySchedule(weeklySchedule)
  );
  const effectiveSchedule = resolveWeeklySchedule(availabilityConfig);
  const syncedWeek = weekAvailabilityFromSchedule(effectiveSchedule);
  const base = {
    ...provider,
    name: publicName,
    address: normalizeLocation(provider.address ?? provider.location),
    verified,
    approved: verified,
    services: provider.services ?? [],
    tags: provider.tags ?? [],
    responseSpeed:
      provider.responseSpeed ??
      deriveResponseSpeed(provider.responseTimeMins ?? 60),
    weekAvailability: syncedWeek,
    weeklySchedule: effectiveSchedule,
    availabilityConfig,
    availability:
      provider.availability?.trim() ||
      formatAvailabilityConfigSummary(availabilityConfig),
    blockedSlots: provider.blockedSlots ?? [],
    rejected: provider.rejected ?? false,
    autoReplyEnabled: provider.autoReplyEnabled === true,
    ratingAvg: Number.isFinite(provider.ratingAvg) ? provider.ratingAvg : 0,
    reviewCount: provider.reviewCount ?? 0,
    jobsCompleted: provider.jobsCompleted ?? 0,
  };
  return base;
}

function hasOrphanProviders(raw: MockDatabase): boolean {
  const userIds = new Set((raw.users ?? []).map((u) => u.id));
  return (raw.providers ?? []).some((p) => !userIds.has(p.userId));
}

function hasMissingRoleFlags(users: MockUser[]): boolean {
  return users.some(
    (u) =>
      u.role !== "admin" &&
      (typeof u.customerRole !== "boolean" || typeof u.providerRole !== "boolean")
  );
}

function hasDuplicateUserEmails(users: MockUser[]): boolean {
  const seen = new Set<string>();
  for (const user of users) {
    const key = user.email.toLowerCase();
    if (seen.has(key)) return true;
    seen.add(key);
  }
  return false;
}

function hasMissingProfileFields(users: MockUser[]): boolean {
  return users.some(
    (u) =>
      !u.firstName?.trim() ||
      !u.lastName?.trim() ||
      !u.phoneNumber?.trim() ||
      !u.address?.trim()
  );
}

function hasMissingWeeklySchedule(providers: MockProvider[]): boolean {
  return providers.some((p) => !p.weeklySchedule || p.weeklySchedule.length !== 7);
}

/** Skip full re-normalize on refresh when localStorage already matches schema. */
export function needsNormalization(raw: MockDatabase): boolean {
  if (raw.version !== MOCK_DB_VERSION) return true;
  const providers = raw.providers ?? [];
  const users = raw.users ?? [];
  if (hasMissingProfileFields(users)) return true;
  if (hasMissingWeeklySchedule(providers)) return true;
  if (providers.length === 0) return false;
  return (
    providers.some(
      (p) =>
        typeof p.verified !== "boolean" ||
        !p.responseSpeed ||
        !Array.isArray(p.weekAvailability) ||
        p.weekAvailability.length !== 7 ||
        !Array.isArray(p.blockedSlots) ||
        typeof p.rejected !== "boolean"
    ) ||
    !raw.reports?.length ||
    hasDuplicateUserEmails(raw.users ?? []) ||
    hasOrphanProviders(raw) ||
    hasMissingRoleFlags(raw.users ?? [])
  );
}

/** Patch localStorage DBs to the current schema. */
function dedupeUsers(users: MockUser[]): MockUser[] {
  const byEmail = new Map<string, MockUser>();
  for (const user of users) {
    const key = user.email.toLowerCase();
    const existing = byEmail.get(key);
    if (
      !existing ||
      new Date(user.createdAt).getTime() >= new Date(existing.createdAt).getTime()
    ) {
      byEmail.set(key, { ...user, email: key });
    }
  }
  return Array.from(byEmail.values());
}

function normalizeUser(user: MockUser): MockUser {
  const withProfile = ensureUserProfileFields(user);
  if (withProfile.role === "admin") {
    return { ...withProfile, customerRole: false, providerRole: false };
  }
  if (
    typeof withProfile.customerRole === "boolean" &&
    typeof withProfile.providerRole === "boolean"
  ) {
    const role =
      withProfile.providerRole && !withProfile.customerRole
        ? "provider"
        : withProfile.customerRole
          ? "customer"
          : withProfile.role;
    return { ...withProfile, role };
  }
  const customerRole = withProfile.role === "customer";
  const providerRole = withProfile.role === "provider";
  return {
    ...withProfile,
    customerRole,
    providerRole,
    role: providerRole ? "provider" : "customer",
  };
}

export function normalizeMockDatabase(raw: MockDatabase): MockDatabase {
  const users = dedupeUsers(raw.users ?? []).map(normalizeUser);
  const providers = (raw.providers ?? [])
    .filter((p) => users.some((u) => u.id === p.userId))
    .map((p) => normalizeProvider(p, users));

  const normalized: MockDatabase = {
    version: MOCK_DB_VERSION,
    users,
    providers,
    bookings: (raw.bookings ?? []).map(normalizeBooking),
    reviews: raw.reviews ?? [],
    chatMessages: raw.chatMessages ?? [],
    directMessages: raw.directMessages ?? [],
    notifications: raw.notifications ?? [],
    reports: raw.reports?.length ? raw.reports : buildAdminDemoReports(),
  };
  return scrubDatabaseIntegrity(normalized);
}
