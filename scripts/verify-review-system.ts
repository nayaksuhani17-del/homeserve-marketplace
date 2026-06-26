/**
 * Review system logic tests — run: npx tsx scripts/verify-review-system.ts
 */
import { buildInitialDatabase } from "../src/lib/mock/seed";
import {
  addReviewRecord,
  canLeaveReview,
  canReviewBooking,
  completeBookingRecord,
  computeProviderRatingStats,
  createBookingRecord,
  findReviewForBooking,
  mockProviderToLegacy,
  resolveBookingRecord,
  REVIEW_ALREADY_SUBMITTED_MESSAGE,
  REVIEW_AVAILABLE_AFTER_COMPLETION_MESSAGE,
  validateReview,
} from "../src/lib/mock/operations";
import { demoId } from "../src/lib/demo/ids";
import type { MockBooking, MockDatabase } from "../src/lib/mock/types";

const failures: string[] = [];
const passes: string[] = [];

function pass(msg: string) {
  passes.push(msg);
  console.log(`  ✅ ${msg}`);
}

function fail(msg: string) {
  failures.push(msg);
  console.log(`  ❌ ${msg}`);
}

function assert(cond: boolean, msg: string) {
  if (cond) pass(msg);
  else fail(msg);
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

console.log("\n⭐ REVIEW SYSTEM TESTS\n");

let db: MockDatabase = buildInitialDatabase();
const sarah = db.users.find((u) => u.email === "sarah.mitchell@demo.com");
const marcus = db.providers.find((p) => p.email === "marcus.reed@demo.com");
const otherCustomer = db.users.find(
  (u) => u.customerRole && u.id !== sarah?.id && u.role !== "admin"
);

if (!sarah || !marcus || !otherCustomer) {
  console.error("Missing seed fixtures (sarah, marcus, or second customer)");
  process.exit(1);
}

const bookingId = demoId("review-test-booking");
const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 14);
const date = futureDate.toISOString().split("T")[0]!;

// ─── 1. Cannot review before completion ───
console.log("1. Cannot review before completion");
{
  const created = createBookingRecord(
    db,
    {
      customerId: sarah.id,
      providerId: marcus.id,
      service: "Plumber",
      date,
      time: "10:00",
      hours: 2,
    },
    bookingId
  );
  db = created.db;
  const booking = db.bookings.find((b) => b.id === bookingId)!;

  assert(booking.status === "pending", "Fresh booking starts pending");

  for (const status of ["pending", "confirmed"] as const) {
    const b: MockBooking = { ...booking, status };
    assert(
      !canReviewBooking(db, b, sarah.id),
      `canReviewBooking false when status is ${status}`
    );
    assert(
      validateReview(db, {
        customerId: sarah.id,
        bookingId: b.id,
        providerId: marcus.id,
      }) === REVIEW_AVAILABLE_AFTER_COMPLETION_MESSAGE,
      `validateReview blocks ${status} booking`
    );
  }

  assert(
    !canLeaveReview(db, {
      customerId: sarah.id,
      bookingId: booking.id,
      providerId: marcus.id,
    }),
    "canLeaveReview false before completion"
  );
}

// ─── 2. Can review after completion ───
console.log("\n2. Can review after completion");
{
  db = resolveBookingRecord(db, bookingId, true);
  db = completeBookingRecord(db, bookingId);
  const booking = db.bookings.find((b) => b.id === bookingId)!;

  assert(booking.status === "completed", "Booking marked completed");

  assert(
    canReviewBooking(db, booking, sarah.id),
    "canReviewBooking true for completed owned booking"
  );
  assert(
    canLeaveReview(db, {
      customerId: sarah.id,
      bookingId: booking.id,
      providerId: marcus.id,
    }),
    "canLeaveReview true after completion"
  );
  assert(
    validateReview(db, {
      customerId: sarah.id,
      bookingId: booking.id,
      providerId: marcus.id,
      rating: 4,
    }) === undefined,
    "validateReview passes for eligible completed booking"
  );
}

// ─── 5. Wrong user cannot review (run before sarah submits) ───
console.log("\n5. Wrong user cannot review");
{
  const booking = db.bookings.find((b) => b.id === bookingId)!;

  assert(
    !canReviewBooking(db, booking, otherCustomer.id),
    "canReviewBooking false for non-owner"
  );
  assert(
    validateReview(db, {
      customerId: otherCustomer.id,
      bookingId: booking.id,
      providerId: marcus.id,
    }) === "You can only review jobs you booked.",
    "validateReview blocks wrong customer"
  );
}

// ─── 4. Rating updates correctly ───
console.log("\n4. Rating updates correctly");
{
  const booking = db.bookings.find((b) => b.id === bookingId)!;
  const before = db.providers.find((p) => p.id === marcus.id)!;
  const beforeStats = computeProviderRatingStats(db.reviews, marcus.id);
  const beforeCount = beforeStats?.reviewCount ?? 0;
  const beforeSum = db.reviews
    .filter((r) => r.providerId === marcus.id)
    .reduce((s, r) => s + r.rating, 0);
  const newRating = 4;

  const result = addReviewRecord(
    db,
    {
      customerId: sarah.id,
      providerId: marcus.id,
      bookingId: booking.id,
      rating: newRating,
      comment: "Rating math test",
    },
    demoId("review-test-rating")
  );

  assert(!result.error && !!result.review, "Review submitted successfully");
  db = result.db;

  const after = db.providers.find((p) => p.id === marcus.id)!;
  const expectedAvg = round1((beforeSum + newRating) / (beforeCount + 1));
  const expectedCount = beforeCount + 1;

  assert(after.reviewCount === expectedCount, `review_count increased to ${expectedCount}`);
  assert(
    after.ratingAvg === expectedAvg,
    `rating_avg recalculated (${before.ratingAvg} → ${after.ratingAvg}, expected ${expectedAvg})`
  );

  const stored = findReviewForBooking(db, booking.id);
  assert(stored?.customerId === sarah.id, "review stores customer_id");
  assert(stored?.providerId === marcus.id, "review stores provider_id");
  assert(stored?.bookingId === booking.id, "review stores booking_id");
  assert(stored?.rating === newRating, "review stores rating");
  assert(stored?.comment === "Rating math test", "review stores comment");
  assert(!!stored?.createdAt, "review stores timestamp");
}

// ─── 3. Prevent duplicate reviews ───
console.log("\n3. Prevent duplicate reviews");
{
  const booking = db.bookings.find((b) => b.id === bookingId)!;

  assert(
    !canReviewBooking(db, booking, sarah.id),
    "canReviewBooking false after review exists"
  );
  assert(
    !!findReviewForBooking(db, booking.id),
    "findReviewForBooking finds existing review"
  );

  const dup = addReviewRecord(
    db,
    {
      customerId: sarah.id,
      providerId: marcus.id,
      bookingId: booking.id,
      rating: 1,
      comment: "Duplicate",
    },
    demoId("review-test-dup")
  );

  assert(
    dup.error === REVIEW_ALREADY_SUBMITTED_MESSAGE,
    "Second submission blocked with correct message"
  );
  assert(!dup.review, "Duplicate review not stored");
  assert(
    dup.db.reviews.filter((r) => r.bookingId === booking.id).length === 1,
    "Only one review per booking in database"
  );
  assert(
    validateReview(db, {
      customerId: sarah.id,
      bookingId: booking.id,
      providerId: marcus.id,
    }) === REVIEW_ALREADY_SUBMITTED_MESSAGE,
    "validateReview returns duplicate message"
  );
}

// ─── 6. UI data reflects updated rating immediately ───
console.log("\n6. UI updates immediately (provider display data)");
{
  const provider = db.providers.find((p) => p.id === marcus.id)!;
  const legacy = mockProviderToLegacy(provider);
  const stats = computeProviderRatingStats(db.reviews, marcus.id);

  assert(
    Number(legacy.rating_avg) === provider.ratingAvg,
    "mockProviderToLegacy rating_avg matches live provider.ratingAvg"
  );
  assert(
    Number(legacy.review_count) === provider.reviewCount,
    "mockProviderToLegacy review_count matches live provider.reviewCount"
  );
  assert(
    stats?.ratingAvg === provider.ratingAvg,
    "computeProviderRatingStats matches provider.ratingAvg"
  );
  assert(
    stats?.reviewCount === provider.reviewCount,
    "computeProviderRatingStats matches provider.reviewCount"
  );
}

// ─── Summary ───
console.log("\n" + "─".repeat(48));
console.log(`PASSED: ${passes.length}  |  FAILED: ${failures.length}`);
if (failures.length > 0) {
  console.log("\nFailures:");
  failures.forEach((f) => console.log(`  • ${f}`));
  process.exit(1);
}
console.log("\n✅ All review system tests passed.\n");
