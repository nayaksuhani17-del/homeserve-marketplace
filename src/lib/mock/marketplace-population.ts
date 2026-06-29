import { SERVICE_CATEGORIES } from "@/lib/constants";
import { DEMO_PASSWORD } from "@/lib/demo/constants";
import { getCatalogProviders } from "@/lib/demo/catalog";
import { demoId } from "@/lib/demo/ids";
import { enrichProviderQuoteFields } from "@/lib/quotes";
import { estimateBookingCost } from "@/lib/pricing";
import { DEFAULT_WEEKLY_SCHEDULE } from "@/lib/availability";
import { defaultAvailabilityConfig } from "@/lib/availability-config";
import { enrichCustomerLocation, normalizeLocation } from "@/lib/location";
import { ensureUserProfileFields, publicDisplayName } from "@/lib/user-profile";
import { recalculateProviderRating } from "./operations";
import type { MockBooking, MockProvider, MockReview, MockUser } from "./types";
import { DEFAULT_WEEK_AVAILABILITY } from "./normalize";

/** Extra customers beyond hand-crafted demo accounts. */
export const SYNTHETIC_CUSTOMER_COUNT = 45;
/** Extra providers from catalog (12 seed + 38 = 50). */
export const SYNTHETIC_PROVIDER_COUNT = 38;
export const SYNTHETIC_BOOKING_COUNT = 160;
export const SYNTHETIC_REVIEW_COUNT = 80;

const FIRST_NAMES = [
  "Alex", "Jordan", "Taylor", "Casey", "Morgan", "Riley", "Quinn", "Avery", "Blake", "Cameron",
  "Dana", "Elliot", "Finley", "Harper", "Jamie", "Kendall", "Logan", "Madison", "Noah", "Parker",
  "Reese", "Sydney", "Tanner", "Uma", "Violet", "Wesley", "Xander", "Yasmin", "Zoe", "Ben",
  "Claire", "Diego", "Eva", "Felix", "Gina", "Hugo", "Iris", "Jake", "Kara", "Leo",
  "Maya", "Nate", "Opal", "Paul", "Rosa",
];

const LAST_NAMES = [
  "Adams", "Baker", "Campbell", "Diaz", "Edwards", "Flores", "Grant", "Hayes", "Ingram", "Jensen",
  "Khan", "Lambert", "Morales", "Nash", "Owens", "Price", "Quinn", "Reyes", "Stone", "Tran",
  "Underwood", "Vargas", "Webb", "Xu", "Young", "Zimmerman", "Carter", "Brooks", "Coleman", "Dunn",
  "Ellis", "Fisher", "Gomez", "Howard", "Irving", "Jacobs", "Knox", "Lowe", "Marsh", "Nelson",
  "Ortiz", "Perry", "Ruiz", "Shaw", "Tucker",
];

const CITIES = [
  "Brooklyn, NY", "Austin, TX", "Denver, CO", "Miami, FL", "Seattle, WA", "Portland, OR",
  "Phoenix, AZ", "Chicago, IL", "Atlanta, GA", "Nashville, TN", "Boston, MA", "San Diego, CA",
  "Los Angeles, CA", "San Francisco, CA", "Dallas, TX", "Houston, TX", "Philadelphia, PA",
  "Charlotte, NC", "Minneapolis, MN", "Columbus, OH", "Indianapolis, IN", "Detroit, MI",
  "Las Vegas, NV", "Salt Lake City, UT", "Raleigh, NC", "Tampa, FL", "Orlando, FL", "Sacramento, CA",
];

const REVIEW_COMMENTS = [
  "Showed up on time and did excellent work.",
  "Fair price and very professional.",
  "Would hire again without hesitation.",
  "Fixed the issue quickly — highly recommend.",
  "Friendly, knowledgeable, and left everything clean.",
  "Great communication from start to finish.",
  "Exceeded my expectations for the price.",
  "Reliable and honest — no surprise fees.",
  "Quality work and respectful of our home.",
  "Quick response and solid results.",
  "",
  "Good experience overall.",
  "Very satisfied with the service.",
];

const TIME_SLOTS = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];

function rng(index: number, salt: number): number {
  const x = Math.sin(index * 9301 + salt * 49297) * 49297;
  return x - Math.floor(x);
}

function pick<T>(arr: readonly T[], index: number, salt: number): T {
  return arr[Math.floor(rng(index, salt) * arr.length)]!;
}

function syntheticCustomerId(index: number): string {
  return demoId(`synthetic-customer:${index}`);
}

function syntheticBookingId(index: number): string {
  return demoId(`synthetic-booking:${index}`);
}

function syntheticReviewId(index: number): string {
  return demoId(`synthetic-review:${index}`);
}

function formatPhone(index: number): string {
  const area = 200 + (index % 800);
  const mid = 100 + Math.floor(rng(index, 91) * 900);
  const last = 1000 + Math.floor(rng(index, 92) * 9000);
  return `(${area}) ${mid}-${last}`;
}

function avatar(email: string) {
  return `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`;
}

function deriveResponseSpeed(mins: number): MockProvider["responseSpeed"] {
  if (mins <= 20) return "fast";
  if (mins <= 60) return "medium";
  return "slow";
}

export function buildSyntheticCustomers(count = SYNTHETIC_CUSTOMER_COUNT): MockUser[] {
  return Array.from({ length: count }, (_, i) => {
    const first = pick(FIRST_NAMES, i, 1);
    const last = pick(LAST_NAMES, i, 2);
    const email = `${first.toLowerCase()}.${last.toLowerCase()}${i}@customer-demo.com`;
    const city = pick(CITIES, i, 3);
    const streetNum = 100 + Math.floor(rng(i, 4) * 8900);
    const street = pick(
      ["Oak St", "Maple Ave", "Cedar Ln", "Pine Rd", "Elm Dr", "Main St", "Park Blvd"],
      i,
      5
    );
    const address = `${streetNum} ${street}, ${city}`;
    const location = enrichCustomerLocation(address);

    return ensureUserProfileFields({
      id: syntheticCustomerId(i),
      name: `${first} ${last}`,
      firstName: first,
      lastName: last,
      email,
      phoneNumber: formatPhone(i),
      address,
      location,
      password: DEMO_PASSWORD,
      role: "customer",
      customerRole: true,
      providerRole: false,
      banned: false,
      avatarUrl: avatar(email),
      createdAt: new Date(Date.now() - rng(i, 6) * 86400000 * 365).toISOString(),
    });
  });
}

export function buildCatalogMockUsersAndProviders(
  count = SYNTHETIC_PROVIDER_COUNT
): { users: MockUser[]; providers: MockProvider[] } {
  const catalog = getCatalogProviders().slice(0, count);
  const users: MockUser[] = [];
  const providers: MockProvider[] = [];

  catalog.forEach((p, i) => {
    const verified = rng(i, 21) > 0.5;
    const email = p.users.email ?? `provider${i}@homeserve-demo.com`;
    const name = p.users.name;
    const parts = name.split(" ");
    const firstName = parts[0] ?? name;
    const lastName = parts.slice(1).join(" ") || "Pro";

    const user = ensureUserProfileFields({
      id: p.user_id,
      name,
      firstName,
      lastName,
      email,
      phoneNumber: formatPhone(1000 + i),
      address: normalizeLocation(p.location),
      location: enrichCustomerLocation(p.location),
      password: DEMO_PASSWORD,
      role: "provider",
      customerRole: false,
      providerRole: true,
      banned: false,
      avatarUrl: p.users.avatar_url ?? avatar(email),
      createdAt: new Date(Date.now() - rng(i, 7) * 86400000 * 400).toISOString(),
    });
    users.push(user);

    const quote = enrichProviderQuoteFields({
      id: p.id,
      pricingType: p.pricing_type,
      price: Number(p.price),
      services: p.services,
      basePrice: p.base_price,
      hourlyRate: p.hourly_rate,
      servicePackages: p.service_packages,
    });

    const activity = rng(i, 22);
    const jobsCompleted =
      activity > 0.75
        ? Math.floor(80 + rng(i, 23) * 220)
        : activity > 0.35
          ? Math.floor(20 + rng(i, 24) * 80)
          : Math.floor(1 + rng(i, 25) * 15);

    const reviewCount = Math.max(1, Math.floor(1 + rng(i, 26) * 50));
    const ratingAvg = Math.round((3.5 + rng(i, 27) * 1.5) * 10) / 10;

    providers.push({
      id: p.id,
      userId: p.user_id,
      name: publicDisplayName(user),
      email,
      avatarUrl: user.avatarUrl,
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
      ratingAvg,
      verified,
      approved: verified,
      distanceMiles: Number(p.distance_miles ?? 5),
      jobsCompleted,
      yearsExperience: Number(p.years_experience ?? 3),
      tags: p.tags ?? [],
      availableToday: Boolean(p.available_today),
      availableTomorrow: Boolean(p.available_tomorrow),
      responseTimeMins: Number(p.response_time_mins ?? 60),
      responseSpeed: deriveResponseSpeed(Number(p.response_time_mins ?? 60)),
      reviewCount,
      rejected: false,
      weekAvailability: [...DEFAULT_WEEK_AVAILABILITY],
      weeklySchedule: DEFAULT_WEEKLY_SCHEDULE.map((entry) => ({ ...entry })),
      availabilityConfig: defaultAvailabilityConfig(),
      blockedSlots: [],
    });
  });

  return { users, providers };
}

type BookingStatus = MockBooking["status"];

function pickBookingStatus(index: number): BookingStatus {
  const roll = rng(index, 30);
  if (roll < 0.12) return "pending";
  if (roll < 0.32) return "confirmed";
  if (roll < 0.78) return "completed";
  if (roll < 0.9) return "declined";
  return "cancelled";
}

function formatDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

export function buildSyntheticBookings(
  customers: MockUser[],
  providers: MockProvider[],
  count = SYNTHETIC_BOOKING_COUNT
): MockBooking[] {
  if (customers.length === 0 || providers.length === 0) return [];

  const customerNameById = new Map(customers.map((c) => [c.id, c.name]));
  const providerNameById = new Map(providers.map((p) => [p.id, p.name]));

  return Array.from({ length: count }, (_, i) => {
    const customer = pick(customers, i, 31);
    const provider = pick(providers, i, 32);
    const service = pick(
      provider.services.length > 0 ? provider.services : SERVICE_CATEGORIES,
      i,
      33
    );
    const status = pickBookingStatus(i);
    const daysOffset =
      status === "pending" || status === "confirmed"
        ? Math.floor(1 + rng(i, 34) * 14)
        : -Math.floor(1 + rng(i, 35) * 90);
    const date = formatDate(daysOffset);
    const time = pick(TIME_SLOTS, i, 36);
    const hours = 1 + Math.floor(rng(i, 37) * 4);
    const estimatedCost = estimateBookingCost(
      provider.pricingType,
      provider.pricingType === "hourly"
        ? (provider.hourlyRate ?? provider.price)
        : provider.price,
      hours
    );

    let paymentStatus: MockBooking["paymentStatus"] = "none";
    if (status === "confirmed") paymentStatus = "authorized";
    if (status === "completed") paymentStatus = "released";
    if (status === "cancelled" && rng(i, 38) > 0.4) paymentStatus = "refunded";

    const createdAt = new Date(
      Date.now() - Math.abs(daysOffset) * 86400000 - rng(i, 39) * 3600000
    ).toISOString();

    return {
      id: syntheticBookingId(i),
      customerId: customer.id,
      customerName: customerNameById.get(customer.id) ?? customer.name,
      providerId: provider.id,
      providerName: providerNameById.get(provider.id) ?? provider.name,
      service,
      date,
      time,
      hours,
      estimatedCost,
      status,
      paymentStatus,
      respondedAt:
        status !== "pending"
          ? new Date(new Date(createdAt).getTime() + 3600000).toISOString()
          : undefined,
      completedAt:
        status === "completed"
          ? new Date(new Date(createdAt).getTime() + 86400000 * 2).toISOString()
          : undefined,
      createdAt,
    };
  });
}

export function buildSyntheticReviews(
  bookings: MockBooking[],
  customers: MockUser[],
  targetCount = SYNTHETIC_REVIEW_COUNT,
  excludeBookingIds: Set<string> = new Set()
): MockReview[] {
  const completed = bookings.filter(
    (b) => b.status === "completed" && !excludeBookingIds.has(b.id)
  );
  const customerNameById = new Map(customers.map((c) => [c.id, c.name]));
  const usedBookingIds = new Set<string>();
  const reviews: MockReview[] = [];

  const shuffled = [...completed].sort((a, b) =>
    rng(completed.indexOf(a), 40).toString().localeCompare(rng(completed.indexOf(b), 41).toString())
  );

  for (let i = 0; reviews.length < targetCount && i < shuffled.length; i++) {
    const booking = shuffled[i]!;
    if (usedBookingIds.has(booking.id)) continue;
    usedBookingIds.add(booking.id);

    const rating =
      rng(i, 42) > 0.85 ? 3 : Math.min(5, Math.max(4, Math.round(3.5 + rng(i, 43) * 1.5)));
    const comment = pick(REVIEW_COMMENTS, i, 44);

    reviews.push({
      id: syntheticReviewId(reviews.length),
      customerId: booking.customerId,
      customerName: customerNameById.get(booking.customerId) ?? booking.customerName,
      providerId: booking.providerId,
      bookingId: booking.id,
      rating,
      comment,
      createdAt: new Date(
        new Date(booking.completedAt ?? booking.createdAt).getTime() + 86400000
      ).toISOString(),
    });
  }

  return reviews;
}

/** Recalculate provider ratings and jobs_completed from bookings + reviews. */
export function syncProviderMarketplaceStats(
  providers: MockProvider[],
  bookings: MockBooking[],
  reviews: MockReview[]
): MockProvider[] {
  let next = providers.map((p) => {
    const completed = bookings.filter(
      (b) => b.providerId === p.id && b.status === "completed"
    ).length;
    const pending = bookings.filter(
      (b) => b.providerId === p.id && (b.status === "pending" || b.status === "confirmed")
    ).length;
    const syntheticJobs = completed + Math.floor(pending * 0.3);
    const jobsCompleted = Math.max(p.jobsCompleted, syntheticJobs);
    const providerReviews = reviews.filter((r) => r.providerId === p.id);
    const reviewCount = Math.max(p.reviewCount, providerReviews.length);
    return { ...p, jobsCompleted, reviewCount };
  });

  const touched = new Set(reviews.map((r) => r.providerId));
  for (const providerId of touched) {
    next = recalculateProviderRating(providerId, next, reviews);
  }

  return next;
}
