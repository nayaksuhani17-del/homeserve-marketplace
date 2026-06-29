/**
 * Provider availability tests — run: npm run verify:availability
 */
import { buildInitialDatabase } from "../src/lib/mock/seed";
import { normalizeMockDatabase } from "../src/lib/mock/normalize";
import {
  approveProviderRecord,
  createBookingRecord,
  registerUserRecord,
  resolveBookingRecord,
} from "../src/lib/mock/operations";
import { newGuestProvider, newGuestUserFromName, newId } from "../src/lib/mock/guest";
import {
  buildWeeklySchedule,
  getAvailableDates,
  getAvailableSlotsForDate,
  getScheduleSlotsForDate,
  getWeeklySchedule,
} from "../src/lib/availability";
import { getAvailableSlots } from "../src/lib/mock/simulation";

const failures: string[] = [];

function assert(cond: boolean, msg: string) {
  if (cond) console.log(`  ✅ ${msg}`);
  else {
    console.log(`  ❌ ${msg}`);
    failures.push(msg);
  }
}

console.log("\n📅 PROVIDER AVAILABILITY TESTS\n");

console.log("1. Weekly schedule on providers");
{
  const db = normalizeMockDatabase(buildInitialDatabase());
  assert(
    db.providers.every((p) => p.weeklySchedule?.length === 7),
    "All seed providers have weeklySchedule"
  );
}

console.log("\n2. Slots respect enabled days");
{
  let db = buildInitialDatabase();
  const user = newGuestUserFromName({
    name: "Schedule Test",
    email: "schedule.test@example.com",
    password: "test1234",
    customerRole: false,
    providerRole: true,
  });
  const provider = {
    ...newGuestProvider(user),
    weeklySchedule: buildWeeklySchedule(
      [true, true, true, true, true, false, false],
      "09:00",
      "17:00"
    ),
  };
  db = registerUserRecord(db, user, provider).db;
  db = approveProviderRecord(db, provider.id, true);
  const stored = db.providers.find((p) => p.id === provider.id)!;

  const monday = getNextWeekday(1);
  const saturday = getNextWeekday(6);
  assert(getScheduleSlotsForDate(stored, monday).length === 8, "Weekday has hourly slots");
  assert(getScheduleSlotsForDate(stored, saturday).length === 0, "Saturday disabled");
}

console.log("\n3. Booked slots become unavailable");
{
  let db = buildInitialDatabase();
  const customer = newGuestUserFromName({
    name: "Book Customer",
    email: "book.customer@example.com",
    password: "test1234",
    customerRole: true,
    providerRole: false,
  });
  const providerUser = newGuestUserFromName({
    name: "Book Provider",
    email: "book.provider@example.com",
    password: "test1234",
    customerRole: false,
    providerRole: true,
  });
  const provider = newGuestProvider(providerUser);
  db = registerUserRecord(db, customer).db;
  db = registerUserRecord(db, providerUser, provider).db;
  db = approveProviderRecord(db, provider.id, true);

  const dates = getAvailableDates(db, provider.id);
  assert(dates.length > 0, "Provider has bookable dates");
  const date = dates[0]!;
  const slotsBefore = getAvailableSlots(db, provider.id, date);
  assert(slotsBefore.length > 0, "Open slots exist");
  const time = slotsBefore[0]!;

  const bookingId = newId("availability-booking");
  const created = createBookingRecord(
    db,
    {
      customerId: customer.id,
      providerId: provider.id,
      service: "Cleaning",
      date,
      time,
      hours: 2,
    },
    bookingId
  );
  db = created.db;
  assert(!created.error, "Pending booking reserves slot");
  assert(
    !getAvailableSlots(db, provider.id, date).includes(time),
    "Pending booking removes slot from availability"
  );

  db = resolveBookingRecord(db, bookingId, true);
  assert(
    !getAvailableSlots(db, provider.id, date).includes(time),
    "Confirmed booking keeps slot unavailable"
  );
}

console.log("\n4. Booking rejected for unavailable day");
{
  let db = buildInitialDatabase();
  const customer = newGuestUserFromName({
    name: "Reject Customer",
    email: "reject.customer@example.com",
    password: "test1234",
    customerRole: true,
    providerRole: false,
  });
  const providerUser = newGuestUserFromName({
    name: "Reject Provider",
    email: "reject.provider@example.com",
    password: "test1234",
    customerRole: false,
    providerRole: true,
  });
  const provider = {
    ...newGuestProvider(providerUser),
    weeklySchedule: buildWeeklySchedule(
      [false, false, false, false, false, false, false],
      "09:00",
      "17:00"
    ),
  };
  db = registerUserRecord(db, customer).db;
  db = registerUserRecord(db, providerUser, provider).db;
  const stored = db.providers.find((p) => p.id === provider.id)!;
  assert(getAvailableDates(db, stored.id).length === 0, "No dates when fully unavailable");
  const result = createBookingRecord(
    db,
    {
      customerId: customer.id,
      providerId: stored.id,
      service: "Plumbing",
      date: new Date().toISOString().split("T")[0]!,
      time: "10:00",
      hours: 2,
    },
    newId("reject-booking")
  );
  assert(!!result.error, "Booking blocked when provider unavailable");
}

if (failures.length === 0) {
  console.log("\n✅ All availability tests passed.\n");
  process.exit(0);
}

console.log(`\n❌ ${failures.length} test(s) failed.\n`);
process.exit(1);

function getNextWeekday(targetIndex: number): string {
  const base = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const dateStr = d.toISOString().split("T")[0]!;
    const idx = new Date(`${dateStr}T12:00:00`).getDay();
    const normalized = idx === 0 ? 6 : idx - 1;
    if (normalized === targetIndex) return dateStr;
  }
  return new Date().toISOString().split("T")[0]!;
}
