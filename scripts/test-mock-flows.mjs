/**
 * Smoke test for mock database flows (run: node scripts/test-mock-flows.mjs)
 */

console.log("Testing mock flows...");

async function main() {
  // Use tsx to load TS modules
  const { buildInitialDatabase } = await import("../src/lib/mock/seed.ts");
  const {
    createBookingRecord,
    addReviewRecord,
    completeBookingRecord,
    approveProviderRecord,
    filterMockProviders,
    getReviewsForProvider,
  } = await import("../src/lib/mock/operations.ts");
  const { newId } = await import("../src/lib/mock/seed.ts");

  let db = buildInitialDatabase();
  console.log("✓ DB seeded:", db.users.length, "users,", db.providers.length, "providers");

  const sarah = db.users.find((u) => u.email === "sarah.mitchell@demo.com");
  const marcus = db.providers.find((p) => p.email === "marcus.reed@demo.com");
  if (!sarah || !marcus) throw new Error("Seed users missing");
  console.log("✓ Sarah + Marcus found");

  const pending = db.providers.filter((p) => !p.approved)[0];
  const verifiedOnly = filterMockProviders(db, { status: "verified" });
  const hasPendingInVerified = verifiedOnly.list.some((p) => !p.approved);
  if (hasPendingInVerified) throw new Error("Verified filter includes pending providers");
  console.log("✓ Verified filter excludes pending");

  const bookingId = newId("test-booking");
  const created = createBookingRecord(
    db,
    {
      customerId: sarah.id,
      providerId: marcus.id,
      service: "Plumber",
      date: "2026-06-25",
      time: "14:00",
      hours: 3,
    },
    bookingId
  );
  db = created.db;
  const booking = db.bookings.find((b) => b.id === bookingId);
  if (!booking) throw new Error("Booking not created");
  const providerBookings = db.bookings.filter((b) => b.providerId === marcus.id);
  if (!providerBookings.some((b) => b.customerId === sarah.id && b.service === "Plumber")) {
    throw new Error("Booking not visible to provider");
  }
  console.log("✓ Booking created for customer + provider");

  db = completeBookingRecord(db, booking.id);
  const beforeRating = db.providers.find((p) => p.id === marcus.id).ratingAvg;
  const reviewResult = addReviewRecord(
    db,
    {
      customerId: sarah.id,
      providerId: marcus.id,
      bookingId: booking.id,
      rating: 5,
      comment: "Test review",
    },
    newId("test-review")
  );
  if (reviewResult.error || !reviewResult.review) {
    throw new Error(reviewResult.error ?? "Review not saved");
  }
  db = reviewResult.db;
  const afterRating = db.providers.find((p) => p.id === marcus.id).ratingAvg;
  const reviews = getReviewsForProvider(db, marcus.id);
  if (reviews.length === 0) throw new Error("Review not saved");
  console.log("✓ Review saved, rating:", beforeRating, "→", afterRating);

  if (pending) {
    db = approveProviderRecord(db, pending.id, true);
    const inSearch = db.providers.find((p) => p.id === pending.id).approved;
    if (!inSearch) throw new Error("Approve failed");
    console.log("✓ Admin approve works");
  }

  console.log("\nAll mock flow tests passed.");
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
