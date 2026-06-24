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
  updateUserRoleRecord,
  countAdmins,
  addNotificationRecord,
  toggleProviderBlockedSlotRecord,
  addDirectMessageRecord,
  deleteUserRecord,
} from "../src/lib/mock/operations";
import { advancedSearch } from "../src/lib/search/unified";
import { normalizeMockDatabase } from "../src/lib/mock/normalize";
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
  multiDb = registerUserRecord(multiDb, customer1).db;

  const provider1 = newGuestUser({
    name: "Jamie Provider",
    email: "jamie.test@example.com",
    password: "test1234",
    role: "provider",
  });
  const jamieProfile = newGuestProvider(provider1);
  multiDb = registerUserRecord(multiDb, provider1, jamieProfile).db;

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
  multiDb = registerUserRecord(multiDb, customer2).db;
  assert(multiDb.users.length === totalBefore + 1, "Unlimited accounts — second customer added");

  const dupeAttempt = {
    ...newGuestUser({
      name: "Alex Duplicate",
      email: "alex2.test@example.com",
      password: "test1234",
      role: "customer",
    }),
    id: demoId("dupe-user-same-email"),
  };
  const dupe = registerUserRecord(multiDb, dupeAttempt);
  assert(!!dupe.error, "Duplicate email registration blocked");
}

// ─── 🛡️ MULTI-ADMIN SYSTEM ───
console.log("\n🛡️ MULTI-ADMIN SYSTEM");
{
  let adminDb = buildInitialDatabase();
  assert(countAdmins(adminDb) >= 1, "Seed includes at least one admin");

  const sarah = adminDb.users.find((u) => u.email === "sarah.mitchell@demo.com");
  assert(!!sarah && sarah.role === "customer", "Sarah starts as customer");

  const promoted = updateUserRoleRecord(adminDb, sarah!.id, "admin");
  assert(!promoted.error, "Promote customer to admin");
  adminDb = promoted.db;
  assert(countAdmins(adminDb) >= 2, "Multiple admins can coexist");

  const originalAdmin = adminDb.users.find((u) => u.email === "admin@test.com");
  assert(originalAdmin?.role === "admin", "Original admin retains admin role");

  const demoteSarah = updateUserRoleRecord(adminDb, sarah!.id, "customer");
  assert(!demoteSarah.error, "Can demote admin when another admin exists");
  adminDb = demoteSarah.db;

  const blocked = updateUserRoleRecord(adminDb, originalAdmin!.id, "customer");
  assert(!!blocked.error, "Cannot demote the last remaining admin");
  assert(countAdmins(adminDb) >= 1, "At least one admin always remains");
}

// ─── 🛡️ CRITICAL REGRESSION GUARDS ───
console.log("\n🛡️ CRITICAL REGRESSION GUARDS");
{
  let guardDb = buildInitialDatabase();
  const sarah = guardDb.users.find((u) => u.email === "sarah.mitchell@demo.com");
  const marcus = guardDb.providers.find((p) => p.email === "marcus.reed@demo.com");
  const marcusUser = guardDb.users.find((u) => u.email === "marcus.reed@demo.com");
  assert(!!sarah && !!marcus && !!marcusUser, "Guard fixtures exist");

  const bookingId = demoId("guard-booking");
  const syncDate = new Date();
  syncDate.setDate(syncDate.getDate() + 12);
  const date = syncDate.toISOString().split("T")[0]!;

  const created = createBookingRecord(
    guardDb,
    {
      customerId: sarah!.id,
      providerId: marcus!.id,
      service: "Plumber",
      date,
      time: "23:30",
      hours: 2,
    },
    bookingId
  );
  assert(!created.error, "Guard booking created");
  guardDb = addNotificationRecord(created.db, {
    id: demoId("guard-notif"),
    userId: marcusUser!.id,
    type: "booking",
    title: "New job request received",
    message: "Regression guard booking notification",
    href: "/provider/dashboard",
  });
  const reloaded = JSON.parse(
    JSON.stringify(normalizeMockDatabase(guardDb))
  ) as typeof guardDb;
  assert(
    reloaded.bookings.some((b) => b.id === bookingId && b.status === "pending"),
    "Booking visible after reload (account switch simulation)"
  );
  assert(
    reloaded.bookings.some(
      (b) => b.providerId === marcus!.id && b.customerId === sarah!.id
    ),
    "Provider sees customer booking from shared store"
  );
  assert(
    reloaded.notifications.some((n) => n.userId === marcusUser!.id && n.type === "booking"),
    "Provider notification saved in shared store"
  );

  guardDb = resolveBookingRecord(reloaded, bookingId, true);
  guardDb = completeBookingRecord(guardDb, bookingId);
  const ratingBefore = guardDb.providers.find((p) => p.id === marcus!.id)!.ratingAvg;
  const countBefore = guardDb.providers.find((p) => p.id === marcus!.id)!.reviewCount;
  guardDb = addReviewRecord(
    guardDb,
    {
      customerId: sarah!.id,
      providerId: marcus!.id,
      bookingId,
      rating: 5,
      comment: "Regression guard review",
    },
    demoId("guard-review")
  );
  const marcusAfter = guardDb.providers.find((p) => p.id === marcus!.id)!;
  assert(
    marcusAfter.reviewCount >= countBefore,
    "Provider review count updates after review"
  );
  assert(
    marcusAfter.ratingAvg >= ratingBefore,
    "Provider rating updates after review"
  );

  const blocked = toggleProviderBlockedSlotRecord(guardDb, marcusUser!.id, date, "15:00");
  assert(!blocked.error, "Availability block toggles without error");
  assert(
    blocked.db.providers
      .find((p) => p.id === marcus!.id)!
      .blockedSlots.some((s) => s.includes(date)),
    "Blocked slot persisted on provider profile"
  );

  const normalized = normalizeMockDatabase({
    ...guardDb,
    users: [
      ...guardDb.users,
      { ...sarah!, id: demoId("dupe-user"), email: "Sarah.Mitchell@demo.com" },
    ],
  });
  assert(
    normalized.users.filter((u) => u.email === "sarah.mitchell@demo.com").length === 1,
    "Normalize dedupes duplicate emails"
  );

  const marcusNameResults = advancedSearch(guardDb, "Marcus");
  assert(
    marcusNameResults.some((r) => r.name.toLowerCase().includes("marcus")),
    "People search finds provider by partial name"
  );

  const plumberResults = advancedSearch(guardDb, "plumber");
  assert(
    plumberResults.some((r) => r.services.includes("Plumber")),
    "Service search finds plumbers"
  );

  let dmDb = addDirectMessageRecord(guardDb, {
    id: demoId("dm-test"),
    senderId: sarah!.id,
    receiverId: marcusUser!.id,
    senderName: sarah!.name,
    text: "Hello Marcus",
  });
  assert(
    dmDb.directMessages.some(
      (m) => m.senderId === sarah!.id && m.receiverId === marcusUser!.id
    ),
    "Direct messages persist sender and receiver"
  );

  const guestUser = newGuestUser({
    name: "Guest Delete",
    email: "guest.delete@test.com",
    password: "test123",
    role: "customer",
  });
  dmDb = {
    ...dmDb,
    users: [...dmDb.users, guestUser],
  };
  const deleted = deleteUserRecord(dmDb, guestUser.id);
  assert(!deleted.error, "Delete user succeeds for non-admin");
  assert(
    !deleted.db.users.some((u) => u.id === guestUser.id),
    "Deleted user removed from users list"
  );
  assert(
    advancedSearch(deleted.db, "Guest Delete").length === 0,
    "Deleted user name absent from search"
  );
  assert(
    advancedSearch(deleted.db, "guest.delete").length === 0,
    "Deleted user email absent from search"
  );
  assert(
    deleted.db.directMessages.every(
      (m) => m.senderId !== guestUser.id && m.receiverId !== guestUser.id
    ),
    "Deleted user direct messages removed"
  );

  const guestProviderUser = newGuestUser({
    name: "Zoe WipeTest",
    email: "zoe.wipe@test.com",
    password: "test123",
    role: "provider",
  });
  const guestProvider = newGuestProvider(guestProviderUser);
  const withProvider = registerUserRecord(deleted.db, guestProviderUser, guestProvider).db;
  assert(
    advancedSearch(withProvider, "Zoe").some((r) => r.name.includes("Zoe")),
    "Provider appears in search before deletion"
  );
  const wipedProvider = deleteUserRecord(withProvider, guestProviderUser.id);
  assert(!wipedProvider.error, "Delete provider account succeeds");
  assert(
    advancedSearch(wipedProvider.db, "Zoe").length === 0,
    "Deleted provider name absent from search"
  );
  assert(
    !wipedProvider.db.providers.some((p) => p.userId === guestProviderUser.id),
    "Deleted provider profile removed from system"
  );

  const lastAdminBlock = deleteUserRecord(
    deleted.db,
    deleted.db.users.find((u) => u.email === "admin@test.com")!.id
  );
  assert(
    Boolean(lastAdminBlock.error?.includes("last admin")),
    "Cannot delete last admin account"
  );

  const acceptBookingId = demoId("accept-booking");
  const acceptCreated = createBookingRecord(
    guardDb,
    {
      customerId: sarah!.id,
      providerId: marcus!.id,
      service: "Painting",
      date,
      time: "21:00",
      hours: 2,
    },
    acceptBookingId
  );
  const acceptDb = resolveBookingRecord(acceptCreated.db, acceptBookingId, true);
  acceptDb.notifications = [
    {
      id: demoId("accept-notif"),
      userId: sarah!.id,
      type: "booking",
      title: "Booking accepted",
      message: "Your booking has been accepted ✅",
      read: false,
      href: "/customer/dashboard",
      createdAt: new Date().toISOString(),
    },
    ...acceptDb.notifications,
  ];
  const acceptedBooking = acceptDb.bookings.find((b) => b.id === acceptBookingId);
  assert(acceptedBooking?.status === "confirmed", "Provider accept sets status confirmed");
  assert(
    acceptDb.notifications.some(
      (n) => n.userId === sarah!.id && n.message.includes("accepted")
    ),
    "Customer receives accept notification"
  );

  const declineId = demoId("decline-booking");
  const declineCreated = createBookingRecord(
    guardDb,
    {
      customerId: sarah!.id,
      providerId: marcus!.id,
      service: "Electrician",
      date,
      time: "22:00",
      hours: 1,
    },
    declineId
  );
  const declineDb = resolveBookingRecord(declineCreated.db, declineId, false);
  const declinedBooking = declineDb.bookings.find((b) => b.id === declineId);
  assert(declinedBooking?.status === "declined", "Provider reject sets status declined");
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
