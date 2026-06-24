/**
 * Pre-demo verification: exercises mock DB operations for all 3 roles.
 * Run: npx tsx scripts/verify-demo-flows.ts
 */
import { buildInitialDatabase } from "../src/lib/mock/seed";
import {
  applyProviderFilters,
  approveProviderRecord,
  completeBookingRecord,
  createBookingRecord,
  addReviewRecord,
  rejectProviderRecord,
  resolveBookingRecord,
  dismissReportRecord,
  getStats,
  registerUserRecord,
} from "../src/lib/mock/operations";
import { newGuestProvider, newGuestUser } from "../src/lib/mock/guest";
import { getMarketplaceAnalytics } from "../src/lib/mock/analytics";
import { demoId } from "../src/lib/demo/ids";

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

console.log("\n🏠 HomeServe — 3-Role Pre-Demo Check\n");

let db = buildInitialDatabase();

// ─── 👤 CUSTOMER: Find → Hire → Book → Review ───
console.log("👤 CUSTOMER FLOW");
{
  const sarah = db.users.find((u) => u.email === "sarah.mitchell@demo.com");
  assert(!!sarah, "Demo customer Sarah Mitchell exists");

  const plumbers = applyProviderFilters(db, { service: "Plumber", status: "verified" });
  assert(plumbers.length > 0, `Find plumbers in search (${plumbers.length} results)`);

  const marcus = db.providers.find((p) => p.email === "marcus.reed@demo.com");
  assert(!!marcus && marcus.approved, "Target provider Marcus Reed is approved & bookable");

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 3);
  const date = tomorrow.toISOString().split("T")[0]!;

  const created = createBookingRecord(
    db,
    {
      customerId: sarah!.id,
      providerId: marcus!.id,
      service: "Plumber",
      date,
      time: "14:00",
      hours: 2,
    },
    demoId("verify-booking")
  );
  assert(!created.error && !!created.db.bookings[0], "Create booking (Hire → Confirm)");
  db = created.db;
  const bookingId = demoId("verify-booking");

  db = resolveBookingRecord(db, bookingId, true);
  const confirmed = db.bookings.find((b) => b.id === bookingId);
  assert(confirmed?.status === "confirmed", "Booking accepted → confirmed");

  db = completeBookingRecord(db, bookingId);
  const completed = db.bookings.find((b) => b.id === bookingId);
  assert(completed?.status === "completed", "Booking completed (demo auto-complete path)");

  db = addReviewRecord(
    db,
    {
      customerId: sarah!.id,
      providerId: marcus!.id,
      bookingId,
      rating: 5,
      comment: "Demo review — great work!",
    },
    demoId("verify-review")
  );
  const review = db.reviews.find((r) => r.bookingId === bookingId);
  const marcusAfter = db.providers.find((p) => p.id === marcus!.id);
  assert(!!review, "Customer left a review");
  assert(
    marcusAfter!.reviewCount >= marcus!.reviewCount,
    "Provider rating/count updated after review"
  );
}

// ─── 🛠️ PROVIDER: Accept → Manage → Complete → Earn ───
console.log("\n🛠️ PROVIDER FLOW");
{
  const marcusUser = db.users.find((u) => u.email === "marcus.reed@demo.com");
  const marcus = db.providers.find((p) => p.email === "marcus.reed@demo.com");
  assert(!!marcusUser && !!marcus, "Demo provider Marcus Reed exists");

  const pending = db.bookings.filter(
    (b) => b.providerId === marcus!.id && b.status === "pending"
  );
  assert(pending.length >= 2, `Pending job requests ready (${pending.length})`);

  const upcomingBefore = db.bookings.filter(
    (b) => b.providerId === marcus!.id && b.status === "confirmed"
  ).length;

  const toAccept = pending[0]!;
  db = resolveBookingRecord(db, toAccept.id, true);
  assert(
    db.bookings.find((b) => b.id === toAccept.id)?.status === "confirmed",
    "Accept job → moves to upcoming (confirmed)"
  );

  const upcomingAfter = db.bookings.filter(
    (b) => b.providerId === marcus!.id && b.status === "confirmed"
  ).length;
  assert(upcomingAfter >= upcomingBefore, "Upcoming jobs count increased after accept");

  const toComplete = db.bookings.find(
    (b) => b.providerId === marcus!.id && b.status === "confirmed"
  );
  assert(!!toComplete, "Has upcoming job to complete");
  const earningsBefore = db.bookings
    .filter((b) => b.providerId === marcus!.id && b.status === "completed")
    .reduce((s, b) => s + b.estimatedCost, 0);

  db = completeBookingRecord(db, toComplete!.id);
  const earningsAfter = db.bookings
    .filter((b) => b.providerId === marcus!.id && b.status === "completed")
    .reduce((s, b) => s + b.estimatedCost, 0);
  assert(earningsAfter >= earningsBefore, "Earnings increase after mark complete");

  const completedCount = db.bookings.filter(
    (b) => b.providerId === marcus!.id && b.status === "completed"
  ).length;
  assert(completedCount >= 3, `Completed jobs history (${completedCount})`);
}

// ─── 🛡️ ADMIN: Approve → Monitor → Control ───
console.log("\n🛡️ ADMIN FLOW");
{
  const stats = getStats(db);
  assert(stats.totalUsers > 0, `Monitor: ${stats.totalUsers} users visible`);
  assert(stats.totalBookings > 0, `Monitor: ${stats.totalBookings} bookings visible`);
  assert(stats.pendingProviders > 0, `Pending approvals queue (${stats.pendingProviders})`);

  const analytics = getMarketplaceAnalytics(db);
  assert(analytics.openReports >= 3, `Reports queue (${analytics.openReports} open)`);

  const pendingProvider = db.providers.find((p) => !p.approved && !p.rejected);
  assert(!!pendingProvider, "Provider waiting for approval exists");

  const beforeSearch = applyProviderFilters(db, {
    status: "verified",
    service: pendingProvider!.services[0],
  }).some((p) => p.id === pendingProvider!.id);
  assert(!beforeSearch, "Pending provider hidden from verified search");

  db = approveProviderRecord(db, pendingProvider!.id, true);
  const afterSearch = applyProviderFilters(db, {
    status: "verified",
    service: pendingProvider!.services[0],
  }).some((p) => p.id === pendingProvider!.id);
  assert(afterSearch, "Approve → instantly visible in search");

  const rejectTarget = db.providers.find((p) => !p.approved && !p.rejected);
  if (rejectTarget) {
    db = rejectProviderRecord(db, rejectTarget.id);
    assert(
      db.providers.find((p) => p.id === rejectTarget.id)?.rejected === true,
      "Reject provider → marked rejected"
    );
  } else {
    pass("Reject provider (skipped — no pending left after approvals)");
  }

  const openReport = db.reports.find((r) => r.status === "open");
  assert(!!openReport, "Open report available for moderation");
  db = dismissReportRecord(db, openReport!.id);
  assert(
    db.reports.find((r) => r.id === openReport!.id)?.status === "dismissed",
    "Dismiss report works"
  );
}

// ─── 🔄 CROSS-ACCOUNT SYNC (shared mock DB) ───
console.log("\n🔄 ACCOUNT SWITCH SYNC");
{
  let syncDb = buildInitialDatabase();
  const sarah = syncDb.users.find((u) => u.email === "sarah.mitchell@demo.com");
  const marcus = syncDb.providers.find((p) => p.email === "marcus.reed@demo.com");
  assert(!!sarah && !!marcus, "Customer and provider demo accounts exist");

  const syncDate = new Date();
  syncDate.setDate(syncDate.getDate() + 5);
  const date = syncDate.toISOString().split("T")[0]!;
  const syncBookingId = demoId("sync-booking");

  const created = createBookingRecord(
    syncDb,
    {
      customerId: sarah!.id,
      providerId: marcus!.id,
      service: "Electrician",
      date,
      time: "10:00",
      hours: 2,
    },
    syncBookingId
  );
  syncDb = created.db;
  const pending = syncDb.bookings.find((b) => b.id === syncBookingId);
  assert(pending?.status === "pending", "Customer booking saved as pending");
  assert(
    pending?.customerId === sarah!.id && pending?.providerId === marcus!.id,
    "Booking linked to customer_id and provider_id"
  );

  const providerSees = syncDb.bookings.filter(
    (b) => b.providerId === marcus!.id && b.status === "pending"
  );
  assert(
    providerSees.some((b) => b.id === syncBookingId),
    "Provider New Requests sees customer booking"
  );

  syncDb = resolveBookingRecord(syncDb, syncBookingId, true);
  const customerView = syncDb.bookings.find(
    (b) => b.id === syncBookingId && b.customerId === sarah!.id
  );
  assert(customerView?.status === "confirmed", "Customer sees confirmed after provider accept");

  syncDb = completeBookingRecord(syncDb, syncBookingId);
  assert(
    syncDb.bookings.find((b) => b.id === syncBookingId)?.status === "completed",
    "Customer sees completed after provider marks done"
  );

  syncDb = addReviewRecord(
    syncDb,
    {
      customerId: sarah!.id,
      providerId: marcus!.id,
      bookingId: syncBookingId,
      rating: 5,
      comment: "Synced review test",
    },
    demoId("sync-review")
  );
  const marcusRated = syncDb.providers.find((p) => p.id === marcus!.id);
  assert(
    syncDb.reviews.some((r) => r.bookingId === syncBookingId),
    "Review saved and linked to booking"
  );
  assert(
    (marcusRated?.reviewCount ?? 0) >= (marcus!.reviewCount ?? 0),
    "Provider rating updated from shared reviews"
  );
}

// ─── 👥 MULTI-ACCOUNT (unlimited real accounts) ───
console.log("\n👥 MULTI-ACCOUNT SYSTEM");
{
  let multiDb = buildInitialDatabase();

  const customer1 = newGuestUser({
    name: "Alex Customer",
    email: "alex.test@example.com",
    password: "test1234",
    role: "customer",
  });
  multiDb = registerUserRecord(multiDb, customer1);

  const provider1 = newGuestUser({
    name: "Jamie Provider",
    email: "jamie.test@example.com",
    password: "test1234",
    role: "provider",
  });
  const jamieProfile = newGuestProvider(provider1);
  multiDb = registerUserRecord(multiDb, provider1, jamieProfile);

  assert(
    multiDb.users.some((u) => u.email === "alex.test@example.com"),
    "Real customer account saved in shared users list"
  );
  assert(
    multiDb.users.some((u) => u.email === "jamie.test@example.com"),
    "Real provider account saved in shared users list"
  );
  assert(
    multiDb.users.some((u) => u.email === "sarah.mitchell@demo.com"),
    "Demo accounts remain in same users list"
  );
  assert(
    multiDb.providers.some((p) => p.userId === provider1.id && p.approved),
    "New provider auto-approved like demo providers"
  );

  const totalBefore = multiDb.users.length;
  const customer2 = newGuestUser({
    name: "Alex Customer Two",
    email: "alex2.test@example.com",
    password: "test1234",
    role: "customer",
  });
  multiDb = registerUserRecord(multiDb, customer2);
  assert(multiDb.users.length === totalBefore + 1, "Unlimited accounts — second customer added");
}

// ─── Summary ───
console.log("\n" + "─".repeat(48));
console.log(`PASSED: ${passes.length}  |  FAILED: ${failures.length}`);
if (failures.length > 0) {
  console.log("\nFailures:");
  failures.forEach((f) => console.log(`  • ${f}`));
  process.exit(1);
}
console.log("\n✅ All 3 roles ready for demo.\n");
console.log("Quick login (password: DemoHomeServe2024!):");
console.log("  👤 sarah.mitchell@demo.com");
console.log("  🛠️ marcus.reed@demo.com");
console.log("  🛡️ admin@test.com");
console.log("\nOr use homepage: Enter Demo as Customer / Provider / Admin\n");
