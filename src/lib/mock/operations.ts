import { DEMO_MODE, DEMO_PROVIDER_PAGE_SIZE } from "@/lib/demo/mode";
import { estimateBookingCost, getComparablePrice } from "@/lib/pricing";
import { computeProviderRatingStats } from "@/lib/ratings";
import { isProviderVerified } from "@/lib/provider-verification";
import { rankProviders } from "@/lib/providers";
import { detectUrgency } from "@/lib/smart";
import { isSlotBlocked, isSlotTaken, slotKey } from "./simulation";
import type { ProviderWithUser } from "@/lib/types";
import type {
  MockBooking,
  MockDatabase,
  MockProvider,
  MockReview,
  MockUser,
  ProviderFilters,
} from "./types";
import {
  REVIEW_ALREADY_SUBMITTED_MESSAGE,
  REVIEW_AVAILABLE_AFTER_COMPLETION_MESSAGE,
  sanitizeStoredReviews,
  validateReviewSubmission,
} from "./review-guard";

export {
  REVIEW_ALREADY_SUBMITTED_MESSAGE,
  REVIEW_AVAILABLE_AFTER_COMPLETION_MESSAGE,
  REVIEW_BOOKING_NOT_FOUND_MESSAGE,
  REVIEW_BOOKING_REQUIRED_MESSAGE,
  REVIEW_INVALID_RATING_MESSAGE,
  REVIEW_WRONG_CUSTOMER_MESSAGE,
  REVIEW_WRONG_PROVIDER_MESSAGE,
  isPersistedReviewValid,
  normalizeReviewRecord,
  sanitizeStoredReviews,
  validateReviewSubmission,
} from "./review-guard";

export function simulateDelay(ms = 600): Promise<void> {
  if (DEMO_MODE) return Promise.resolve();
  const jitter = Math.floor(Math.random() * 400);
  return new Promise((resolve) => setTimeout(resolve, ms + jitter));
}

export function recalculateProviderRating(
  providerId: string,
  providers: MockProvider[],
  reviews: MockReview[]
): MockProvider[] {
  const stats = computeProviderRatingStats(reviews, providerId);
  return providers.map((p) => {
    if (p.id !== providerId) return p;
    if (!stats) return { ...p, ratingAvg: 0, reviewCount: 0 };
    return {
      ...p,
      ratingAvg: stats.ratingAvg,
      reviewCount: stats.reviewCount,
    };
  });
}

export { computeProviderRatingStats, roundRatingAverage } from "@/lib/ratings";

export function mockProviderToLegacy(p: MockProvider): ProviderWithUser {
  return {
    id: p.id,
    user_id: p.userId,
    services: p.services,
    pricing_type: p.pricingType,
    price: p.price,
    base_price: p.basePrice,
    hourly_rate: p.hourlyRate,
    service_packages: p.servicePackages,
    location: p.location,
    description: p.description,
    availability: p.availability,
    rating_avg: p.ratingAvg,
    approved: p.approved,
    verified: p.verified,
    distance_miles: p.distanceMiles,
    jobs_completed: p.jobsCompleted,
    years_experience: p.yearsExperience,
    tags: p.tags,
    available_today: p.availableToday,
    available_tomorrow: p.availableTomorrow,
    response_time_mins: p.responseTimeMins,
    review_count: p.reviewCount,
    users: {
      name: p.name,
      email: p.email,
      avatar_url: p.avatarUrl,
    },
  };
}

export function applyProviderFilters(
  db: MockDatabase,
  filters: ProviderFilters,
  source?: MockProvider[]
): MockProvider[] {
  let list = [...(source ?? db.providers)];

  const activeUserIds = new Set(db.users.map((u) => u.id));
  list = list.filter((p) => activeUserIds.has(p.userId));

  const bannedUserIds = new Set(db.users.filter((u) => u.banned).map((u) => u.id));
  list = list.filter((p) => !bannedUserIds.has(p.userId));
  list = list.filter((p) => !p.rejected);

  if (filters.status === "pending") {
    list = list.filter((p) => !isProviderVerified(p));
  } else if (filters.status === "verified") {
    list = list.filter((p) => isProviderVerified(p));
  }

  if (filters.service) {
    list = list.filter((p) => p.services.includes(filters.service!));
  }

  if (filters.q) {
    const q = filters.q.toLowerCase();
    const tokens = q.split(/[\s,]+/).map((t) => t.trim()).filter(Boolean);
    const matchesProvider = (p: (typeof list)[0]) =>
      p.location.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.services.some((s) => s.toLowerCase().includes(q)) ||
      tokens.some(
        (t) =>
          t.length >= 2 &&
          (p.name.toLowerCase().includes(t) ||
            p.services.some((s) => s.toLowerCase().includes(t)))
      );

    list = list.filter(matchesProvider);
  }

  if (filters.minPrice) {
    list = list.filter(
      (p) => getComparablePrice(p.pricingType, p.price) >= Number(filters.minPrice)
    );
  }
  if (filters.maxPrice && Number(filters.maxPrice) < 120) {
    list = list.filter(
      (p) => getComparablePrice(p.pricingType, p.price) <= Number(filters.maxPrice)
    );
  }
  if (filters.minRating) {
    list = list.filter((p) => p.ratingAvg >= Number(filters.minRating));
  }
  if (filters.maxDistance) {
    list = list.filter((p) => p.distanceMiles <= Number(filters.maxDistance));
  }
  if (filters.availability === "today") {
    list = list.filter((p) => p.availableToday);
  }
  if (filters.availability === "tomorrow") {
    list = list.filter((p) => p.availableTomorrow);
  }

  const urgent = detectUrgency(filters.q ?? "");
  if (urgent && !filters.availability) {
    list = list.filter((p) => p.availableToday || p.availableTomorrow);
  }

  const legacy = list.map(mockProviderToLegacy);

  if (filters.sort === "price") {
    list.sort(
      (a, b) =>
        getComparablePrice(a.pricingType, a.price) -
        getComparablePrice(b.pricingType, b.price)
    );
  } else if (filters.sort === "distance") {
    list.sort((a, b) => a.distanceMiles - b.distanceMiles);
  } else {
    const ranked = rankProviders(legacy, filters.service, urgent);
    const order = new Map(ranked.map((p, i) => [p.id, i]));
    list.sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
  }

  return list;
}

export function filterMockProviders(
  db: MockDatabase,
  filters: ProviderFilters
): { list: MockProvider[]; total: number; page: number; pageSize: number; totalPages: number } {
  const pageSize = DEMO_PROVIDER_PAGE_SIZE;
  let list = applyProviderFilters(db, filters);

  if (list.length === 0 && DEMO_MODE) {
    const relaxed = applyProviderFilters(db, {
      ...filters,
      minPrice: undefined,
      maxPrice: undefined,
      minRating: undefined,
      maxDistance: undefined,
      availability: undefined,
      q: undefined,
      status: "verified",
    });
    list =
      relaxed.length > 0
        ? relaxed
        : applyProviderFilters(db, { status: "verified" });
  }

  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, Number(filters.page) || 1), totalPages);
  const start = (page - 1) * pageSize;

  return {
    list: list.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export function getTopRankedProviders(
  db: MockDatabase,
  filters: ProviderFilters,
  limit = 3
): MockProvider[] {
  const verified = applyProviderFilters(db, {
    ...filters,
    status: "verified",
    page: undefined,
  });
  return verified.slice(0, limit);
}

export function createBookingRecord(
  db: MockDatabase,
  input: {
    customerId: string;
    providerId: string;
    service: string;
    date: string;
    time?: string | null;
    hours: number;
  },
  bookingId: string
): { db: MockDatabase; error?: string } {
  const customer = db.users.find((u) => u.id === input.customerId);
  const provider = db.providers.find((p) => p.id === input.providerId);
  if (!customer || !provider) return { db, error: "Provider not found." };

  if (input.time && isSlotTaken(db, input.providerId, input.date, input.time)) {
    return {
      db,
      error: "This provider is no longer available at that time. Please choose another slot.",
    };
  }

  if (input.time && isSlotBlocked(provider, input.date, input.time)) {
    return {
      db,
      error: "This time slot is blocked by the provider. Please choose another slot.",
    };
  }

  const booking: MockBooking = {
    id: bookingId,
    customerId: customer.id,
    customerName: customer.name,
    providerId: provider.id,
    providerName: provider.name,
    service: input.service,
    date: input.date,
    time: input.time,
    hours: input.hours,
    estimatedCost: estimateBookingCost(
      provider.pricingType,
      provider.pricingType === "hourly" ? provider.hourlyRate : provider.price,
      input.hours
    ),
    status: "pending",
    paymentStatus: "none",
    createdAt: new Date().toISOString(),
  };

  return {
    db: {
      ...db,
      bookings: [booking, ...db.bookings],
    },
  };
}

export function resolveBookingRecord(
  db: MockDatabase,
  bookingId: string,
  accepted: boolean
): MockDatabase {
  const booking = db.bookings.find((b) => b.id === bookingId);
  if (!booking || booking.status !== "pending") return db;

  const now = new Date().toISOString();

  if (!accepted) {
    return {
      ...db,
      bookings: db.bookings.map((b) =>
        b.id === bookingId
          ? { ...b, status: "declined", respondedAt: now }
          : b
      ),
    };
  }

  const slot =
    booking.date && booking.time ? slotKey(booking.date, booking.time) : null;

  return {
    ...db,
    bookings: db.bookings.map((b) =>
      b.id === bookingId
        ? {
            ...b,
            status: "confirmed",
            paymentStatus: "authorized",
            respondedAt: now,
          }
        : b
    ),
    providers: slot
      ? db.providers.map((p) => {
          if (p.id !== booking.providerId) return p;
          const blocked = p.blockedSlots ?? [];
          if (blocked.includes(slot)) return p;
          return { ...p, blockedSlots: [...blocked, slot] };
        })
      : db.providers,
  };
}

export function completeBookingRecord(
  db: MockDatabase,
  bookingId: string
): MockDatabase {
  const booking = db.bookings.find((b) => b.id === bookingId);
  if (!booking || booking.status !== "confirmed") return db;

  const now = new Date().toISOString();

  return {
    ...db,
    bookings: db.bookings.map((b) =>
      b.id === bookingId
        ? {
            ...b,
            status: "completed",
            paymentStatus: "released",
            completedAt: now,
          }
        : b
    ),
    providers: db.providers.map((p) =>
      p.id === booking.providerId
        ? { ...p, jobsCompleted: p.jobsCompleted + 1 }
        : p
    ),
  };
}

export function addChatMessageRecord(
  db: MockDatabase,
  message: {
    id: string;
    bookingId: string;
    senderRole: "customer" | "provider";
    senderName: string;
    text: string;
  }
): MockDatabase {
  return {
    ...db,
    chatMessages: [
      ...(db.chatMessages ?? []),
      { ...message, createdAt: new Date().toISOString() },
    ],
  };
}

export function removeReviewRecord(db: MockDatabase, reviewId: string): MockDatabase {
  const review = db.reviews.find((r) => r.id === reviewId);
  if (!review) return db;

  const reviews = db.reviews.filter((r) => r.id !== reviewId);
  const providers = recalculateProviderRating(review.providerId, db.providers, reviews);

  return { ...db, reviews, providers };
}

export function findReviewForBooking(
  db: MockDatabase,
  bookingId: string
): MockReview | undefined {
  return db.reviews.find((r) => r.bookingId === bookingId);
}

export function hasReviewForBooking(db: MockDatabase, bookingId: string): boolean {
  return findReviewForBooking(db, bookingId) !== undefined;
}

export function validateReview(
  db: MockDatabase,
  input: {
    customerId: string;
    bookingId?: string;
    providerId?: string;
    rating?: number;
  }
): string | undefined {
  return validateReviewSubmission(db, input);
}

/** Customer may leave a review for this booking (completed, owned, not yet reviewed). */
export function canReviewBooking(
  db: MockDatabase,
  booking: MockBooking,
  customerId: string
): boolean {
  return (
    booking.status === "completed" &&
    booking.customerId === customerId &&
    !findReviewForBooking(db, booking.id)
  );
}

/** True when the customer may submit a review for this booking + provider pair. */
export function canLeaveReview(
  db: MockDatabase,
  input: { customerId: string; bookingId: string; providerId: string }
): boolean {
  const booking = db.bookings.find((b) => b.id === input.bookingId);
  if (!booking || booking.providerId !== input.providerId) return false;
  return canReviewBooking(db, booking, input.customerId);
}

export type AddReviewRecordResult = {
  db: MockDatabase;
  review?: MockReview;
  error?: string;
};

export function addReviewRecord(
  db: MockDatabase,
  input: {
    customerId: string;
    providerId: string;
    bookingId: string;
    rating: number;
    comment: string;
  },
  reviewId: string
): AddReviewRecordResult {
  const validationError = validateReviewSubmission(db, {
    customerId: input.customerId,
    bookingId: input.bookingId,
    providerId: input.providerId,
    rating: input.rating,
  });
  if (validationError) return { db, error: validationError };

  if (findReviewForBooking(db, input.bookingId)) {
    return { db, error: REVIEW_ALREADY_SUBMITTED_MESSAGE };
  }

  const booking = db.bookings.find((b) => b.id === input.bookingId);
  if (!booking || booking.status !== "completed") {
    return { db, error: REVIEW_AVAILABLE_AFTER_COMPLETION_MESSAGE };
  }
  if (booking.customerId !== input.customerId) {
    return { db, error: "You can only review jobs you booked." };
  }

  const customer = db.users.find((u) => u.id === input.customerId);
  if (!customer) return { db, error: "Customer not found." };

  const timestamp = new Date().toISOString();
  const review: MockReview = {
    id: reviewId,
    customerId: customer.id,
    customerName: customer.name,
    providerId: input.providerId,
    bookingId: input.bookingId,
    rating: Math.round(input.rating),
    comment: input.comment.trim(),
    createdAt: timestamp,
  };

  const reviews = [review, ...db.reviews];
  const providers = recalculateProviderRating(input.providerId, db.providers, reviews);

  return { db: { ...db, reviews, providers }, review };
}

export function updateProviderRecord(
  db: MockDatabase,
  userId: string,
  patch: Partial<
    Pick<
      MockProvider,
      | "services"
      | "pricingType"
      | "price"
      | "basePrice"
      | "hourlyRate"
      | "servicePackages"
      | "location"
      | "description"
      | "availability"
      | "availableToday"
      | "availableTomorrow"
      | "weekAvailability"
      | "blockedSlots"
      | "autoReplyEnabled"
    >
  >
): MockDatabase {
  return {
    ...db,
    providers: db.providers.map((p) =>
      p.userId === userId ? { ...p, ...patch } : p
    ),
  };
}

export function approveProviderRecord(
  db: MockDatabase,
  providerId: string,
  approved: boolean
): MockDatabase {
  return {
    ...db,
    providers: db.providers.map((p) =>
      p.id === providerId
        ? {
            ...p,
            verified: approved,
            approved,
            rejected: approved ? false : p.rejected,
          }
        : p
    ),
  };
}

export function rejectProviderRecord(
  db: MockDatabase,
  providerId: string
): MockDatabase {
  return {
    ...db,
    providers: db.providers.map((p) =>
      p.id === providerId
        ? { ...p, verified: false, approved: false, rejected: true }
        : p
    ),
  };
}

export function banUserRecord(
  db: MockDatabase,
  userId: string,
  banned: boolean
): { db: MockDatabase; error?: string } {
  const target = db.users.find((u) => u.id === userId);
  if (!target) return { db, error: "User not found." };
  if (banned && target.role === "admin") {
    const activeAdmins = db.users.filter((u) => u.role === "admin" && !u.banned);
    if (activeAdmins.length <= 1 && activeAdmins[0]?.id === userId) {
      return { db, error: "Cannot ban the last active admin." };
    }
  }
  return {
    db: {
      ...db,
      users: db.users.map((u) => (u.id === userId ? { ...u, banned } : u)),
    },
  };
}

export function countAdmins(db: MockDatabase): number {
  return db.users.filter((u) => u.role === "admin").length;
}

export function updateUserRoleRecord(
  db: MockDatabase,
  userId: string,
  role: MockUser["role"]
): { db: MockDatabase; error?: string } {
  const target = db.users.find((u) => u.id === userId);
  if (!target) return { db, error: "User not found." };
  if (target.role === role) return { db };

  if (target.role === "admin" && role !== "admin" && countAdmins(db) <= 1) {
    return { db, error: "At least one admin must remain on the platform." };
  }

  return {
    db: {
      ...db,
      users: db.users.map((u) => (u.id === userId ? { ...u, role } : u)),
    },
  };
}

export function registerUserRecord(
  db: MockDatabase,
  user: MockUser,
  provider?: MockProvider
): { db: MockDatabase; error?: string } {
  const emailKey = user.email.toLowerCase();
  const duplicate = db.users.find(
    (u) => u.email.toLowerCase() === emailKey && u.id !== user.id
  );
  if (duplicate) {
    return { db, error: "An account with this email already exists." };
  }
  const normalizedUser = { ...user, email: emailKey };
  const users = [
    ...db.users.filter((u) => u.email.toLowerCase() !== emailKey),
    normalizedUser,
  ];
  let providers = db.providers;
  if (provider) {
    providers = [...providers.filter((p) => p.userId !== user.id), provider];
  }
  return { db: { ...db, users, providers } };
}

export function getStats(db: MockDatabase) {
  const verified = db.providers.filter((p) => isProviderVerified(p));
  const jobsCompleted = verified.reduce((s, p) => s + (p.jobsCompleted ?? 0), 0);
  const avgRating =
    verified.length > 0
      ? verified.reduce((s, p) => s + p.ratingAvg, 0) / verified.length
      : 0;

  return {
    totalUsers: db.users.length,
    totalProviders: db.providers.length,
    verifiedProviders: verified.length,
    pendingProviders: db.providers.filter(
      (p) => !isProviderVerified(p) && !p.rejected
    ).length,
    totalBookings: db.bookings.length,
    activeJobs: db.bookings.filter((b) =>
      b.status === "pending" || b.status === "confirmed"
    ).length,
    jobsCompleted,
    avgRating: Math.round(avgRating * 10) / 10,
    adminCount: db.users.filter((u) => u.role === "admin").length,
  };
}

export function getReviewsForProvider(db: MockDatabase, providerId: string) {
  return db.reviews
    .filter((r) => r.providerId === providerId)
    .map((r) => ({
      rating: r.rating,
      comment: r.comment,
      created_at: r.createdAt,
      users: { name: r.customerName },
    }));
}

export function cancelBookingRecord(
  db: MockDatabase,
  bookingId: string,
  cancelledBy: "customer" | "provider" | "admin"
): { db: MockDatabase; error?: string } {
  const booking = db.bookings.find((b) => b.id === bookingId);
  if (!booking) return { db, error: "Booking not found." };
  if (["completed", "declined", "cancelled"].includes(booking.status)) {
    return { db, error: "This booking cannot be cancelled." };
  }

  const now = new Date().toISOString();
  const paymentStatus =
    booking.paymentStatus === "authorized" ? "refunded" : booking.paymentStatus;

  return {
    db: {
      ...db,
      bookings: db.bookings.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              status: "cancelled",
              paymentStatus,
              cancelledAt: now,
              cancelledBy,
            }
          : b
      ),
    },
  };
}

export function submitReportRecord(
  db: MockDatabase,
  input: {
    reporterId: string;
    providerId: string;
    bookingId?: string;
    reason: string;
    details: string;
  },
  reportId: string
): { db: MockDatabase; error?: string } {
  const reporter = db.users.find((u) => u.id === input.reporterId);
  const provider = db.providers.find((p) => p.id === input.providerId);
  if (!reporter || !provider) return { db, error: "Could not submit report." };

  const report = {
    id: reportId,
    reporterId: reporter.id,
    reporterName: reporter.name,
    providerId: provider.id,
    providerName: provider.name,
    bookingId: input.bookingId,
    reason: input.reason,
    details: input.details,
    status: "open" as const,
    createdAt: new Date().toISOString(),
  };

  return {
    db: {
      ...db,
      reports: [report, ...(db.reports ?? [])],
    },
  };
}

export function resolveReportRecord(
  db: MockDatabase,
  reportId: string
): MockDatabase {
  return {
    ...db,
    reports: (db.reports ?? []).map((r) =>
      r.id === reportId ? { ...r, status: "resolved" as const } : r
    ),
  };
}

export function dismissReportRecord(
  db: MockDatabase,
  reportId: string
): MockDatabase {
  return {
    ...db,
    reports: (db.reports ?? []).map((r) =>
      r.id === reportId ? { ...r, status: "dismissed" as const } : r
    ),
  };
}

export function addNotificationRecord(
  db: MockDatabase,
  notification: {
    id: string;
    userId: string;
    type: "booking" | "payment" | "message" | "system" | "report";
    title: string;
    message: string;
    href?: string;
  }
): MockDatabase {
  return {
    ...db,
    notifications: [
      {
        ...notification,
        read: false,
        createdAt: new Date().toISOString(),
      },
      ...(db.notifications ?? []),
    ].slice(0, 200),
  };
}

export function markNotificationsReadRecord(
  db: MockDatabase,
  userId: string,
  notificationIds?: string[]
): MockDatabase {
  return {
    ...db,
    notifications: (db.notifications ?? []).map((n) => {
      if (n.userId !== userId) return n;
      if (notificationIds && !notificationIds.includes(n.id)) return n;
      return { ...n, read: true };
    }),
  };
}

export function toggleProviderBlockedSlotRecord(
  db: MockDatabase,
  userId: string,
  date: string,
  time: string
): { db: MockDatabase; error?: string } {
  const provider = db.providers.find((p) => p.userId === userId);
  if (!provider) return { db, error: "Provider profile not found." };

  const key = `${date}:${time}`;
  const blocked = provider.blockedSlots ?? [];
  const nextBlocked = blocked.includes(key)
    ? blocked.filter((s) => s !== key)
    : [...blocked, key];

  return {
    db: {
      ...db,
      providers: db.providers.map((p) =>
        p.userId === userId ? { ...p, blockedSlots: nextBlocked } : p
      ),
    },
  };
}

export function addDirectMessageRecord(
  db: MockDatabase,
  message: {
    id: string;
    senderId: string;
    receiverId: string;
    senderName: string;
    text: string;
  }
): MockDatabase {
  return {
    ...db,
    directMessages: [
      ...(db.directMessages ?? []),
      { ...message, createdAt: new Date().toISOString() },
    ],
  };
}

/** Remove records that reference deleted or missing users/providers. */
export function scrubDatabaseIntegrity(db: MockDatabase): MockDatabase {
  const users = db.users ?? [];
  const userIds = new Set(users.map((u) => u.id));
  const providers = (db.providers ?? []).filter((p) => userIds.has(p.userId));
  const providerIds = new Set(providers.map((p) => p.id));
  const bookings = (db.bookings ?? []).filter(
    (b) => userIds.has(b.customerId) && providerIds.has(b.providerId)
  );
  const bookingIds = new Set(bookings.map((b) => b.id));
  const base = { ...db, users, providers, bookings };
  const reviews = sanitizeStoredReviews(base, db.reviews ?? []);
  const directMessages = (db.directMessages ?? []).filter(
    (m) => userIds.has(m.senderId) && userIds.has(m.receiverId)
  );
  const notifications = (db.notifications ?? []).filter((n) => userIds.has(n.userId));
  const chatMessages = (db.chatMessages ?? []).filter((m) => bookingIds.has(m.bookingId));
  const reports = (db.reports ?? []).filter(
    (r) => userIds.has(r.reporterId) && providerIds.has(r.providerId)
  );

  let nextProviders = providers;
  const touchedProviderIds = new Set([
    ...reviews.map((r) => r.providerId),
    ...providers.map((p) => p.id),
  ]);
  for (const providerId of touchedProviderIds) {
    nextProviders = recalculateProviderRating(providerId, nextProviders, reviews);
  }

  return {
    ...db,
    users,
    providers: nextProviders,
    bookings,
    reviews,
    directMessages,
    notifications,
    chatMessages,
    reports,
  };
}

export function deleteUserRecord(
  db: MockDatabase,
  userId: string,
  opts?: { forbidSelf?: boolean; actorId?: string }
): { db: MockDatabase; error?: string; purgedProviderIds?: string[] } {
  const target = db.users.find((u) => u.id === userId);
  if (!target) return { db, error: "User not found." };
  if (opts?.forbidSelf && opts.actorId === userId) {
    return { db, error: "You cannot delete your own account while logged in as admin." };
  }
  if (target.role === "admin" && countAdmins(db) <= 1) {
    return { db, error: "Cannot delete the last admin account." };
  }

  const providerIds = db.providers
    .filter((p) => p.userId === userId)
    .map((p) => p.id);
  const bookingIds = db.bookings
    .filter(
      (b) =>
        b.customerId === userId || providerIds.includes(b.providerId)
    )
    .map((b) => b.id);

  const deletedName = target.name.toLowerCase();
  const deletedEmail = target.email.toLowerCase();
  const nameTokens = deletedName.split(/\s+/).filter((t) => t.length >= 2);

  function referencesDeletedUser(text: string): boolean {
    const hay = text.toLowerCase();
    if (hay.includes(deletedEmail)) return true;
    if (hay.includes(deletedName)) return true;
    if (nameTokens.some((t) => hay.includes(t))) return true;
    if (providerIds.some((pid) => hay.includes(pid))) return true;
    if (hay.includes(userId)) return true;
    return false;
  }

  const users = db.users.filter((u) => u.id !== userId);
  const providers = db.providers.filter((p) => p.userId !== userId);
  const bookings = db.bookings.filter((b) => !bookingIds.includes(b.id));
  const reviews = db.reviews.filter(
    (r) =>
      r.customerId !== userId &&
      !providerIds.includes(r.providerId) &&
      !referencesDeletedUser(`${r.customerName} ${r.comment}`)
  );
  const notifications = (db.notifications ?? []).filter((n) => {
    if (n.userId === userId) return false;
    return !referencesDeletedUser(`${n.title} ${n.message} ${n.href ?? ""}`);
  });
  const directMessages = (db.directMessages ?? []).filter(
    (m) => m.senderId !== userId && m.receiverId !== userId
  );
  const chatMessages = (db.chatMessages ?? []).filter(
    (m) =>
      !bookingIds.includes(m.bookingId) &&
      !referencesDeletedUser(m.senderName) &&
      !referencesDeletedUser(m.text)
  );
  const reports = (db.reports ?? []).filter(
    (r) =>
      r.reporterId !== userId &&
      !providerIds.includes(r.providerId) &&
      !referencesDeletedUser(`${r.reporterName} ${r.providerName} ${r.details}`)
  );

  return {
    db: scrubDatabaseIntegrity({
      ...db,
      users,
      providers,
      bookings,
      reviews,
      notifications,
      directMessages,
      chatMessages,
      reports,
    }),
    purgedProviderIds: providerIds,
  };
}
