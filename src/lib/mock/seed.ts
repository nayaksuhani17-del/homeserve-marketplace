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
  return {
    id: p.id,
    userId: p.user_id,
    name: p.users.name,
    email: p.users.email,
    avatarUrl: p.users.avatar_url ?? undefined,
    services: p.services,
    hourlyRate: Number(p.hourly_rate),
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
    reviewCount: Number(p.review_count ?? 0),
  };
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
      estimatedCost: (provider?.hourlyRate ?? 40) * 2,
      status: b.status,
      createdAt: new Date(Date.now() - i * 86400000 * 3).toISOString(),
    };
  });

  const reviews: MockReview[] = DEMO_REVIEWS.map((r, i) => {
    const cid = userId(r.customerKey);
    return {
      id: reviewId(i),
      customerId: cid,
      customerName: userNameById.get(cid) ?? "Customer",
      providerId: providerId(r.providerKey),
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
    hourlyRate: 35,
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
    reviewCount: 0,
  };
}

export function newId(prefix: string): string {
  return demoId(`${prefix}:${Date.now()}:${Math.random()}`);
}
