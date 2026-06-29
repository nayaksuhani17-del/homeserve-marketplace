/**
 * User profile + privacy tests — run: npm run verify:privacy
 */
import { buildInitialDatabase } from "../src/lib/mock/seed";
import { normalizeMockDatabase } from "../src/lib/mock/normalize";
import { registerUserRecord, createBookingRecord } from "../src/lib/mock/operations";
import { newGuestProvider, newGuestUser, newGuestUserFromName, newId } from "../src/lib/mock/guest";
import {
  canRevealContact,
  ensureUserProfileFields,
  publicDisplayName,
  validateRegistrationProfile,
} from "../src/lib/user-profile";

const failures: string[] = [];

function assert(cond: boolean, msg: string) {
  if (cond) console.log(`  ✅ ${msg}`);
  else {
    console.log(`  ❌ ${msg}`);
    failures.push(msg);
  }
}

console.log("\n🔒 USER PROFILE & PRIVACY TESTS\n");

console.log("1. Registration validation");
{
  assert(
    validateRegistrationProfile({
      firstName: "",
      lastName: "Smith",
      email: "a@b.com",
      phoneNumber: "555",
      address: "123 Main",
      password: "secret",
    }) === "First name is required.",
    "Requires first name"
  );
  assert(
    validateRegistrationProfile({
      firstName: "Jane",
      lastName: "Smith",
      email: "not-an-email",
      phoneNumber: "555",
      address: "123 Main",
      password: "secret",
    }) === "Enter a valid email address.",
    "Validates email format"
  );
  assert(
    validateRegistrationProfile({
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@example.com",
      phoneNumber: "",
      address: "123 Main",
      password: "secret",
    }) === "Phone number is required.",
    "Requires phone number"
  );
  assert(
    validateRegistrationProfile({
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@example.com",
      phoneNumber: "555-0100",
      address: "123 Main St, Springfield, IL",
      password: "secret",
    }) === null,
    "Accepts valid registration profile"
  );
}

console.log("\n2. Profile fields persisted on user");
{
  let db = buildInitialDatabase();
  const user = newGuestUser({
    firstName: "Marcus",
    lastName: "Reed",
    email: "privacy.test@example.com",
    phoneNumber: "(555) 222-3333",
    address: "42 Oak Lane, Portland, OR 97201",
    password: "test1234",
    customerRole: true,
    providerRole: false,
  });
  db = registerUserRecord(db, user).db;
  const stored = db.users.find((u) => u.id === user.id)!;
  assert(stored.firstName === "Marcus", "firstName saved");
  assert(stored.lastName === "Reed", "lastName saved");
  assert(stored.phoneNumber === "(555) 222-3333", "phoneNumber saved");
  assert(stored.address.includes("Portland"), "address saved");

  db = normalizeMockDatabase(db);
  const afterReload = db.users.find((u) => u.id === user.id)!;
  assert(afterReload.phoneNumber === "(555) 222-3333", "Profile survives normalize/reload");
}

console.log("\n3. Public display name");
{
  const user = ensureUserProfileFields(
    newGuestUserFromName({
      name: "Marcus Reed",
      email: "marcus.public@example.com",
      password: "test1234",
      customerRole: false,
      providerRole: true,
    })
  );
  assert(publicDisplayName(user) === "Marcus R.", "Provider public name is first + last initial");
}

console.log("\n4. Provider record uses public name");
{
  const user = newGuestUser({
    firstName: "Jamie",
    lastName: "Nguyen",
    email: "jamie.public@example.com",
    phoneNumber: "555-0100",
    address: "9 Pine St, Austin, TX",
    password: "test1234",
    customerRole: false,
    providerRole: true,
  });
  const provider = newGuestProvider(user);
  assert(provider.name === "Jamie N.", "newGuestProvider stores public display name");
  assert(!provider.name.includes("Nguyen"), "Full last name hidden on provider record");
}

console.log("\n5. Contact reveal rules");
{
  let db = buildInitialDatabase();
  const customer = newGuestUserFromName({
    name: "Alex Customer",
    email: "alex.privacy@example.com",
    password: "test1234",
    customerRole: true,
    providerRole: false,
  });
  const providerUser = newGuestUserFromName({
    name: "Sam Provider",
    email: "sam.privacy@example.com",
    password: "test1234",
    customerRole: false,
    providerRole: true,
  });
  const provider = newGuestProvider(providerUser);
  db = registerUserRecord(db, customer).db;
  db = registerUserRecord(db, providerUser, provider).db;

  assert(
    !canRevealContact(db, customer.id, providerUser.id),
    "No contact before confirmed booking"
  );
  assert(
    canRevealContact(db, customer.id, providerUser.id, { inActiveChat: true }),
    "Contact revealed in active chat"
  );

  const bookingResult = createBookingRecord(
    db,
    {
      customerId: customer.id,
      providerId: provider.id,
      service: "Plumbing",
      date: "2026-07-01",
      time: "10:00",
      hours: 2,
    },
    newId("privacy-booking")
  );
  db = bookingResult.db;
  const booking = db.bookings[0]!;
  assert(!bookingResult.error, "Booking created for contact reveal test");
  assert(
    !canRevealContact(db, customer.id, providerUser.id),
    "Pending booking does not reveal contact"
  );

  db = {
    ...db,
    bookings: db.bookings.map((b) =>
      b.id === booking.id ? { ...b, status: "confirmed" as const } : b
    ),
  };
  assert(
    canRevealContact(db, customer.id, providerUser.id),
    "Confirmed booking reveals contact"
  );
}

console.log("\n6. Demo seed users have profile fields");
{
  const db = normalizeMockDatabase(buildInitialDatabase());
  assert(
    db.users.every(
      (u) => u.firstName && u.lastName && u.phoneNumber && u.address
    ),
    "All seed users have required profile fields"
  );
}

if (failures.length === 0) {
  console.log("\n✅ All user profile & privacy tests passed.\n");
  process.exit(0);
}

console.log(`\n❌ ${failures.length} test(s) failed.\n`);
process.exit(1);
