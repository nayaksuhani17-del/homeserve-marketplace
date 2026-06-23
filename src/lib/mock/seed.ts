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
import { demoId } from "@/lib/demo/ids";
import { enrichProviderQuoteFields } from "@/lib/quotes";
import { estimateBookingCost } from "@/lib/pricing";
import type { MockBooking, MockDatabase, MockProvider, MockReview, MockUser } from "./types";
import { MOCK_DB_VERSION } from "./types";

function toMockUser(u: (typeof DEMO_USERS)[0]): MockUser {
  return {
    id: userId(u.key),
    name: u.name,
    email: u.email,
    password: DEMO_PASSWORD,
    role: u.role,
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
    blockedSlots: [],
  };
}

function deriveResponseSpeed(mins: number): MockProvider["responseSpeed"] {
  if (mins <= 20) return "fast";
  if (mins <= 60) return "medium";
  return "slow";
}

export function buildInitialDatabase(): MockDatabase {
  const users = DEMO_USERS.map(toMockUser);
  const providers = buildDemoProviders().map(toMockProvider);

  const userNameById = new Map(users.map((u) => [u.id, u.name]));
  const providerNameById = new Map(providers.map((p) => [p.id, p.name]));

  const bookings: MockBooking[] = DEMO_BOOKINGS.map((b, i) => {
    const pid = providerId(b.providerKey);
    const cid = userId(b.customerKey);
    const provider = providers.find((p) => p.id === pid);
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
      status: b.status === "confirmed" ? "completed" : "confirmed",
      paymentStatus: b.status === "confirmed" ? "released" : "authorized",
      respondedAt: new Date(Date.now() - i * 86400000 * 3 - 3600000).toISOString(),
      completedAt:
        b.status === "confirmed"
          ? new Date(Date.now() - i * 86400000 * 2).toISOString()
          : undefined,
      createdAt: new Date(Date.now() - i * 86400000 * 3).toISOString(),
    };
  });

  const linkedBookingIds = new Set<string>();
  const reviews: MockReview[] = DEMO_REVIEWS.map((r, i) => {
    const cid = userId(r.customerKey);
    const pid = providerId(r.providerKey);
    const linkedBooking = bookings.find(
      (b) =>
        b.customerId === cid &&
        b.providerId === pid &&
        b.status === "completed" &&
        !linkedBookingIds.has(b.id)
    );
    if (linkedBooking) linkedBookingIds.add(linkedBooking.id);

    return {
      id: reviewId(i),
      customerId: cid,
      customerName: userNameById.get(cid) ?? "Customer",
      providerId: pid,
      bookingId: linkedBooking?.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: new Date(Date.now() - i * 86400000 * 5).toISOString(),
    };
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

  return {
    version: MOCK_DB_VERSION,
    users,
    providers: syncedProviders,
    bookings,
    reviews,
    chatMessages: [],
    notifications: [],
    reports: [],
  };
}

export function newGuestUser(input: {
  name: string;
  email: string;
  password: string;
  role: "customer" | "provider";
}): MockUser {
  return {
    id: demoId(`guest-user:${input.email.toLowerCase()}`),
    name: input.name,
    email: input.email.toLowerCase(),
    password: input.password,
    role: input.role,
    banned: false,
    avatarUrl: `https://i.pravatar.cc/150?u=${encodeURIComponent(input.email)}`,
    createdAt: new Date().toISOString(),
  };
}

export function newGuestProvider(user: MockUser): MockProvider {
  return {
    id: demoId(`guest-provider:${user.id}`),
    userId: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    services: ["House Cleaning"],
    pricingType: "fixed",
    price: 95,
    basePrice: 95,
    hourlyRate: 0,
    servicePackages: [
      { label: "Standard home clean", price: 95 },
      { label: "Deep house cleaning", price: 150 },
    ],
    location: "Your City",
    description: "Tell customers about your experience and services.",
    availability: "Mon-Fri: 9am-5pm",
    ratingAvg: 4.5,
    approved: false,
    distanceMiles: 3,
    jobsCompleted: 0,
    yearsExperience: 1,
    tags: [],
    availableToday: true,
    availableTomorrow: true,
    responseTimeMins: 30,
    responseSpeed: "fast",
    reviewCount: 0,
    blockedSlots: [],
  };
}

export function newId(prefix: string): string {
  return demoId(`${prefix}:${Date.now()}:${Math.random()}`);
}
