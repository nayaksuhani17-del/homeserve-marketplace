import { buildDemoProviders } from "@/lib/demo/providers";
import { DEMO_PASSWORD } from "@/lib/demo/constants";
import {
  DEMO_BOOKINGS,
  DEMO_REVIEWS,
  DEMO_USERS,
  bookingId,
  providerId,
  reviewId,
  userId,
} from "@/lib/demo/seed-data";
import { enrichProviderQuoteFields } from "@/lib/quotes";
import { estimateBookingCost } from "@/lib/pricing";
import {
  buildMarcusWorkspaceBookings,
  buildMarcusWorkspaceNotifications,
} from "./provider-demo-bookings";
import { buildAdminDemoReports } from "./admin-demo-reports";
import {
  buildSarahWorkspaceBookings,
  buildSarahWorkspaceNotifications,
} from "./customer-demo-bookings";
import type { MockBooking, MockDatabase, MockProvider, MockReview, MockUser } from "./types";

function toMockUser(u: (typeof DEMO_USERS)[0]): MockUser {
  const isAdmin = u.role === "admin";
  const customerRole = u.role === "customer";
  const providerRole = u.role === "provider";
  return {
    id: userId(u.key),
    name: u.name,
    email: u.email,
    password: DEMO_PASSWORD,
    role: isAdmin ? "admin" : providerRole ? "provider" : "customer",
    customerRole,
    providerRole,
    banned: false,
    avatarUrl: u.avatarUrl,
    createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
  };
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
    email: p.users.email,
    avatarUrl: p.users.avatar_url ?? undefined,
    services: p.services,
    pricingType: p.pricing_type,
    price: Number(p.price),
    basePrice: quote.basePrice,
    hourlyRate: quote.hourlyRate,
    servicePackages: quote.servicePackages,
    location: p.location,
    description: p.description,
    availability: p.availability,
    ratingAvg: Number(p.rating_avg),
    verified: Boolean(p.approved),
    approved: p.approved,
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

  const users = DEMO_USERS.map(toMockUser);
  const providers = buildDemoProviders().map(toMockProvider);

  const userNameById = new Map(users.map((u) => [u.id, u.name]));
  const providerNameById = new Map(providers.map((p) => [p.id, p.name]));

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

  const marcusWorkspaceBookings = buildMarcusWorkspaceBookings(providers, users);
  const sarahWorkspaceBookings = buildSarahWorkspaceBookings(providers, users);
  const allBookings = [...bookings, ...marcusWorkspaceBookings, ...sarahWorkspaceBookings];

  const linkedBookingIds = new Set<string>();
  const reviews: MockReview[] = DEMO_REVIEWS.flatMap((r, i) => {
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

  // Sync review counts + ratings for seed providers from review data
  const syncedProviders = providers.map((p) => {
    const providerReviews = reviews.filter((rv) => rv.providerId === p.id);
    if (providerReviews.length === 0) return p;
    const avg =
      providerReviews.reduce((s, rv) => s + rv.rating, 0) / providerReviews.length;
    return {
      ...p,
      ratingAvg: Math.round(avg * 10) / 10,
      reviewCount: providerReviews.length,
    };
  });

  const marcusUser = users.find((u) => u.email === "marcus.reed@demo.com");
  const sarahUser = users.find((u) => u.email === "sarah.mitchell@demo.com");
  const seedNotifications = [
    ...(marcusUser ? buildMarcusWorkspaceNotifications(marcusUser.id) : []),
    ...(sarahUser ? buildSarahWorkspaceNotifications(sarahUser.id) : []),
  ];

  const marcusBlockedSlots = marcusWorkspaceBookings
    .filter((b) => b.status === "confirmed" && b.date && b.time)
    .map((b) => `${b.date}:${b.time}`);

  const providersWithSchedule = syncedProviders.map((p) =>
    p.email === "marcus.reed@demo.com"
      ? {
          ...p,
          blockedSlots: [...new Set([...(p.blockedSlots ?? []), ...marcusBlockedSlots])],
        }
      : p
  );

  initialDbCache = {
    version: MOCK_DB_VERSION,
    users,
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

export { newGuestUser, newGuestProvider, newId } from "./guest";
