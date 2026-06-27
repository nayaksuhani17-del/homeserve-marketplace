/**
 * Provider verification tests — run: npx tsx scripts/verify-provider-verification.ts
 */
import { buildInitialDatabase } from "../src/lib/mock/seed";
import {
  approveProviderRecord,
  registerUserRecord,
} from "../src/lib/mock/operations";
import { normalizeMockDatabase } from "../src/lib/mock/normalize";
import { newGuestProvider, newGuestUser } from "../src/lib/mock/guest";
import { isProviderVerified } from "../src/lib/provider-verification";

const failures: string[] = [];

function assert(cond: boolean, msg: string) {
  if (cond) console.log(`  ✅ ${msg}`);
  else {
    console.log(`  ❌ ${msg}`);
    failures.push(msg);
  }
}

console.log("\n🛡️ PROVIDER VERIFICATION TESTS\n");

// 1. Signup creates unverified provider
console.log("1. Provider signup");
{
  let db = buildInitialDatabase();
  const user = newGuestUser({
    name: "Test Provider",
    email: "test.provider.verify@example.com",
    password: "test1234",
    customerRole: false,
    providerRole: true,
  });
  const profile = newGuestProvider(user);
  assert(profile.verified === false, "newGuestProvider sets verified=false");
  assert(profile.approved === false, "newGuestProvider sets approved=false");

  const result = registerUserRecord(db, user, profile);
  assert(!result.error, "registerUserRecord succeeds");
  db = result.db;

  assert(db.users.some((u) => u.id === user.id), "User added to users list");
  const stored = db.providers.find((p) => p.userId === user.id);
  assert(!!stored, "Provider added to providers list");
  assert(stored!.verified === false, "Stored provider verified=false");
  assert(!isProviderVerified(stored), "isProviderVerified returns false");
}

// 2. Persists unverified after reload simulation
console.log("\n2. Persistence before approval");
{
  let db = buildInitialDatabase();
  const user = newGuestUser({
    name: "Persist Test",
    email: "persist.provider@example.com",
    password: "test1234",
    customerRole: false,
    providerRole: true,
  });
  db = registerUserRecord(db, user, newGuestProvider(user)).db;
  const id = db.providers.find((p) => p.userId === user.id)!.id;

  db = normalizeMockDatabase(db);
  const afterReload = db.providers.find((p) => p.id === id)!;
  assert(afterReload.verified === false, "Unverified survives normalize/reload");
}

// 3. Admin approval only path
console.log("\n3. Admin approval");
{
  let db = buildInitialDatabase();
  const user = newGuestUser({
    name: "Approve Test",
    email: "approve.provider@example.com",
    password: "test1234",
    customerRole: false,
    providerRole: true,
  });
  db = registerUserRecord(db, user, newGuestProvider(user)).db;
  const id = db.providers.find((p) => p.userId === user.id)!.id;

  db = approveProviderRecord(db, id, true);
  const approved = db.providers.find((p) => p.id === id)!;
  assert(approved.verified === true, "Approve sets verified=true");
  assert(approved.approved === true, "Approve syncs approved=true");

  db = normalizeMockDatabase(db);
  const afterReload = db.providers.find((p) => p.id === id)!;
  assert(afterReload.verified === true, "Verified state persists after reload");
  assert(isProviderVerified(afterReload), "isProviderVerified true after approval");
}

// 4. Seed/demo providers start unverified
console.log("\n4. No auto-verification in seed");
{
  const db = buildInitialDatabase();
  const autoVerified = db.providers.filter((p) => p.verified === true);
  assert(autoVerified.length === 0, "No seed providers auto-verified");
}

console.log("\n" + "─".repeat(48));
console.log(`FAILED: ${failures.length}`);
if (failures.length > 0) {
  failures.forEach((f) => console.log(`  • ${f}`));
  process.exit(1);
}
console.log("\n✅ All provider verification tests passed.\n");
