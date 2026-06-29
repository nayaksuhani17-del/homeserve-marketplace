import { buildDemoProviders } from "@/lib/demo/providers";
import { DEMO_PASSWORD } from "@/lib/demo/constants";
import {
  DEMO_BOOKINGS,
  DEMO_PROVIDERS,
  DEMO_REVIEWS,
  DEMO_USERS,
  bookingId,
  providerId,
  reviewId,
  userId,
} from "@/lib/demo/seed-data";
import { enrichProviderQuoteFields } from "@/lib/quotes";
import { estimateBookingCost } from "@/lib/pricing";
import { ensureUserProfileFields, publicDisplayName } from "@/lib/user-profile";
import { DEFAULT_WEEKLY_SCHEDULE } from "@/lib/availability";
import { defaultAvailabilityConfig } from "@/lib/availability-config";
import { normalizeLocation } from "@/lib/location";
import {
  buildMarcusWorkspaceBookings,
  buildMarcusWorkspaceNotifications,
} from "./provider-demo-bookings";
import { buildAdminDemoReports } from "./admin-demo-reports";
import {
  buildSarahWorkspaceBookings,
  buildSarahWorkspaceNotifications,
} from "./customer-demo-bookings";
import {
  buildCatalogMockUsersAndProviders,
  buildSyntheticBookings,
  buildSyntheticCustomers,
  buildSyntheticReviews,
  syncProviderMarketplaceStats,
} from "./marketplace-population";
import type { MockBooking, MockDatabase, MockProvider, MockReview, MockUser } from "./types";

function toMockUser(u: (typeof DEMO_USERS)[0]): MockUser {
  const isAdmin = u.role === "admin";
  const customerRole = u.role === "customer";
  const providerRole = u.role === "provider";
  return ensureUserProfileFields({
    id: userId(u.key),
    name: u.name,
    firstName: "",
    lastName: "",
    email: u.email,
    phoneNumber: "",
    address: "",
    password: DEMO_PASSWORD,
    role: isAdmin ? "admin" : providerRole ? "provider" : "customer",
    customerRole,
    providerRole,
    banned: false,
    avatarUrl: u.avatarUrl,
    createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
  });
}

function toMockProvider(p: ReturnType<typeof buildDemoProviders>[0]): MockProvider {
  const quote = enrichProviderQuoteFields({
    id: p.id,
    pricingType: p.pricing_type,
    price: Number(p.price),
    services: p.services,
    basePrice: p.base_price,
    hourlyRate: p.hourly_rate,
    servicePackages: p.service_packages,
  });

  return {
    id: p.id,
    userId: p.user_id,
    name: p.users.name,
    email: p.users.email ?? "",
    avatarUrl: p.users.avatar_url ?? undefined,
    services: p.services,
    pricingType: p.pricing_type,
    price: Number(p.price),
    basePrice: quote.basePrice,
    hourlyRate: quote.hourlyRate,
    servicePackages: quote.servicePackages,
    location: p.location,
    address: normalizeLocation(p.location),
    description: p.description,
    availability: p.availability,
    ratingAvg: Number(p.rating_avg),
    verified: Boolean(p.approved),
    approved: Boolean(p.approved),
    distanceMiles: Number(p.distance_miles ?? 5),
    jobsCompleted: Number(p.jobs_completed ?? 0),
    yearsExperience: Number(p.years_experience ?? 3),
    tags: p.tags ?? [],
    availableToday: Boolean(p.available_today),
    availableTomorrow: Boolean(p.available_tomorrow),
    responseTimeMins: Number(p.response_time_mins ?? 60),
    responseSpeed: deriveResponseSpeed(Number(p.response_time_mins ?? 60)),
    reviewCount: Number(p.review_count ?? 0),
    rejected: false,
    weekAvailability: [...DEFAULT_WEEK_AVAILABILITY],
    weeklySchedule: DEFAULT_WEEKLY_SCHEDULE.map((entry) => ({ ...entry })),
    availabilityConfig: defaultAvailabilityConfig(),
    blockedSlots: [],
  };
}

import { MOCK_DB_VERSION } from "./types";
import { DEFAULT_WEEK_AVAILABILITY } from "./normalize";

function deriveResponseSpeed(mins: number): MockProvider["responseSpeed"] {
  if (mins <= 20) return "fast";
  if (mins <= 60) return "medium";
  return "slow";
}

function mapDemoBookingStatus(
  status: (typeof DEMO_BOOKINGS)[0]["status"]
): MockBooking["status"] {
  if (status === "confirmed") return "completed";
  if (status === "pending") return "pending";
  return "confirmed";
}

let initialDbCache: MockDatabase | null = null;

export function buildInitialDatabase(): MockDatabase {
  if (initialDbCache) return initialDbCache;

  const seedUsers = DEMO_USERS.map(toMockUser);
  const syntheticCustomers = buildSyntheticCustomers();
  const { users: catalogUsers, providers: catalogProviders } =
    buildCatalogMockUsersAndProviders();

  const users = [...seedUsers, ...syntheticCustomers, ...catalogUsers];
  const dedupedUsers = users.filter(
    (u, i, arr) => arr.findIndex((x) => x.id === u.id) === i
  );
  const userIds = new Set(dedupedUsers.map((u) => u.id));

  const seedProviderIds = new Set(DEMO_PROVIDERS.map((p) => providerId(p.userKey)));
  const seedProviders = buildDemoProviders()
    .filter((p) => seedProviderIds.has(p.id))
    .map(toMockProvider)
    .map((p) => {
      const user = dedupedUsers.find((u) => u.id === p.userId);
      return user ? { ...p, name: publicDisplayName(user) } : p;
    });

  const providers = [...seedProviders, ...catalogProviders].filter((p) =>
    userIds.has(p.userId)
  );

  const userNameById = new Map(dedupedUsers.map((u) => [u.id, u.name]));
  const providerNameById = new Map(providers.map((p) => [p.id, p.name]));
  const bookingCustomers = dedupedUsers.filter((u) => u.customerRole);

  const bookings: MockBooking[] = DEMO_BOOKINGS.filter(
    (b) => b.providerKey !== "provider-marcus" && b.customerKey !== "customer-sarah"
  ).map((b, i) => {
    const pid = providerId(b.providerKey);
    const cid = userId(b.customerKey);
    const provider = providers.find((p) => p.id === pid);
    const mappedStatus = mapDemoBookingStatus(b.status);
    return {
      id: bookingId(i),
      customerId: cid,
      customerName: userNameById.get(cid) ?? "Customer",
      providerId: pid,
      providerName: providerNameById.get(pid) ?? provider?.name ?? "Provider",
      service: b.service,
      date: b.date,
      time: "10:00",
      hours: 2,
      estimatedCost: estimateBookingCost(
        provider?.pricingType ?? "hourly",
        provider?.pricingType === "hourly"
          ? (provider?.hourlyRate ?? provider?.price ?? 40)
          : (provider?.price ?? 40),
        2
      ),
      status: mappedStatus,
      paymentStatus: mappedStatus === "completed" ? "released" : mappedStatus === "pending" ? "none" : "authorized",
      respondedAt: new Date(Date.now() - i * 86400000 * 3 - 3600000).toISOString(),
      completedAt:
        mappedStatus === "completed"
          ? new Date(Date.now() - i * 86400000 * 2).toISOString()
          : undefined,
      createdAt: new Date(Date.now() - i * 86400000 * 3).toISOString(),
    };
  });

  const marcusWorkspaceBookings = buildMarcusWorkspaceBookings(providers, dedupedUsers);
  const sarahWorkspaceBookings = buildSarahWorkspaceBookings(providers, dedupedUsers);
  const syntheticBookings = buildSyntheticBookings(
    bookingCustomers,
    providers
  );
  const allBookings = [
    ...bookings,
    ...marcusWorkspaceBookings,
    ...sarahWorkspaceBookings,
    ...syntheticBookings,
  ];

  const linkedBookingIds = new Set<string>();
  const seedReviews: MockReview[] = DEMO_REVIEWS.flatMap((r, i) => {
    const cid = userId(r.customerKey);
    const pid = providerId(r.providerKey);
    const linkedBooking = allBookings.find(
      (b) =>
        b.customerId === cid &&
        b.providerId === pid &&
        b.status === "completed" &&
        !linkedBookingIds.has(b.id)
    );
    if (!linkedBooking) return [];
    linkedBookingIds.add(linkedBooking.id);

    return [
      {
        id: reviewId(i),
        customerId: cid,
        customerName: userNameById.get(cid) ?? "Customer",
        providerId: pid,
        bookingId: linkedBooking.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: new Date(Date.now() - i * 86400000 * 5).toISOString(),
      },
    ];
  });

  const syntheticReviews = buildSyntheticReviews(
    allBookings,
    bookingCustomers,
    undefined,
    linkedBookingIds
  );

  const reviews = [...seedReviews, ...syntheticReviews];

  const syncedProviders = syncProviderMarketplaceStats(
    providers,
    allBookings,
    reviews
  );

  const marcusUser = dedupedUsers.find((u) => u.email === "marcus.reed@demo.com");
  const sarahUser = dedupedUsers.find((u) => u.email === "sarah.mitchell@demo.com");
  const seedNotifications = [
    ...(marcusUser ? buildMarcusWorkspaceNotifications(marcusUser.id) : []),
    ...(sarahUser ? buildSarahWorkspaceNotifications(sarahUser.id) : []),
  ];

  const marcusBlockedSlots = marcusWorkspaceBookings
    .filter((b) => b.status === "confirmed" && b.date && b.time)
    .map((b) => `${b.date}:${b.time}`);

  const providersWithSchedule = syncedProviders.map((p) => {
    if (p.email === "marcus.reed@demo.com") {
      return {
        ...p,
        blockedSlots: [...new Set([...(p.blockedSlots ?? []), ...marcusBlockedSlots])],
      };
    }
    return p;
  });

  initialDbCache = {
    version: MOCK_DB_VERSION,
    users: dedupedUsers,
    providers: providersWithSchedule,
    bookings: allBookings,
    reviews,
    chatMessages: [],
    directMessages: [],
    notifications: seedNotifications,
    reports: buildAdminDemoReports(),
  };
  return initialDbCache;
}

export { newGuestUser, newGuestProvider, newGuestUserFromName, newId } from "./guest";
