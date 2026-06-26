import type { MockDatabase, MockReview } from "./types";

export const REVIEW_BOOKING_REQUIRED_MESSAGE =
  "A completed booking is required to leave a review.";
export const REVIEW_BOOKING_NOT_FOUND_MESSAGE = "Booking not found.";
export const REVIEW_WRONG_CUSTOMER_MESSAGE = "You can only review jobs you booked.";
export const REVIEW_WRONG_PROVIDER_MESSAGE =
  "This review does not match the provider for this booking.";
export const REVIEW_ALREADY_SUBMITTED_MESSAGE = "You have already reviewed this job";
export const REVIEW_AVAILABLE_AFTER_COMPLETION_MESSAGE =
  "Review available after job completion";
export const REVIEW_INVALID_RATING_MESSAGE = "Please select a rating between 1 and 5.";

/** Normalize a raw localStorage review into a structured object, or null if malformed. */
export function normalizeReviewRecord(raw: unknown): MockReview | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<MockReview>;
  if (
    typeof r.id !== "string" ||
    typeof r.customerId !== "string" ||
    typeof r.providerId !== "string" ||
    typeof r.bookingId !== "string"
  ) {
    return null;
  }
  const rating = Number(r.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) return null;

  return {
    id: r.id,
    customerId: r.customerId,
    customerName: typeof r.customerName === "string" ? r.customerName : "",
    providerId: r.providerId,
    bookingId: r.bookingId,
    rating: Math.round(rating),
    comment: typeof r.comment === "string" ? r.comment.trim() : "",
    createdAt:
      typeof r.createdAt === "string" && r.createdAt
        ? r.createdAt
        : new Date().toISOString(),
  };
}

/** True when a review already stored in the DB is consistent with bookings and ownership. */
export function isPersistedReviewValid(db: MockDatabase, review: MockReview): boolean {
  const booking = db.bookings.find((b) => b.id === review.bookingId);
  if (!booking) return false;
  if (booking.customerId !== review.customerId) return false;
  if (booking.providerId !== review.providerId) return false;
  if (booking.status !== "completed") return false;
  if (!db.users.some((u) => u.id === review.customerId)) return false;
  if (!db.providers.some((p) => p.id === review.providerId)) return false;
  return true;
}

/**
 * Drop invalid / duplicate reviews from localStorage.
 * Keeps the newest review per booking_id when duplicates exist.
 */
export function sanitizeStoredReviews(
  db: MockDatabase,
  rawReviews: unknown[]
): MockReview[] {
  const normalized: MockReview[] = [];
  for (const raw of rawReviews) {
    const review = normalizeReviewRecord(raw);
    if (review) normalized.push(review);
  }

  normalized.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const seenBookingIds = new Set<string>();
  const valid: MockReview[] = [];

  for (const review of normalized) {
    if (seenBookingIds.has(review.bookingId)) continue;
    if (!isPersistedReviewValid(db, review)) continue;
    seenBookingIds.add(review.bookingId);
    valid.push(review);
  }

  return valid;
}

export type ReviewValidationInput = {
  customerId: string;
  bookingId?: string;
  providerId?: string;
  rating?: number;
};

/** Gate all review submissions — must pass before insert. */
export function validateReviewSubmission(
  db: MockDatabase,
  input: ReviewValidationInput
): string | undefined {
  if (!input.bookingId) {
    return REVIEW_BOOKING_REQUIRED_MESSAGE;
  }
  const booking = db.bookings.find((b) => b.id === input.bookingId);
  if (!booking) return REVIEW_BOOKING_NOT_FOUND_MESSAGE;
  if (booking.customerId !== input.customerId) {
    return REVIEW_WRONG_CUSTOMER_MESSAGE;
  }
  if (input.providerId && booking.providerId !== input.providerId) {
    return REVIEW_WRONG_PROVIDER_MESSAGE;
  }
  if (booking.status !== "completed") {
    return REVIEW_AVAILABLE_AFTER_COMPLETION_MESSAGE;
  }
  if (db.reviews.some((r) => r.bookingId === input.bookingId)) {
    return REVIEW_ALREADY_SUBMITTED_MESSAGE;
  }
  if (input.rating != null) {
    if (!Number.isFinite(input.rating) || input.rating < 1 || input.rating > 5) {
      return REVIEW_INVALID_RATING_MESSAGE;
    }
  }
  return undefined;
}
