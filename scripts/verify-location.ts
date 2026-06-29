/**
 * Location filtering tests — run: npm run verify:location
 */
import { buildInitialDatabase } from "../src/lib/mock/seed";
import { applyProviderFilters } from "../src/lib/mock/operations";
import { parseSearchFallback, effectiveSearchQuery } from "../src/lib/ai/parse-search";
import {
  citiesMatch,
  computeDistanceMiles,
  locationMatchingKey,
  normalizeLocation,
  parseLocationInput,
  resolveCustomerAddress,
} from "../src/lib/location";

const failures: string[] = [];

function assert(cond: boolean, msg: string) {
  if (cond) console.log(`  ✅ ${msg}`);
  else {
    console.log(`  ❌ ${msg}`);
    failures.push(msg);
  }
}

console.log("\n📍 LOCATION FILTER TESTS\n");

console.log("1. Address normalization");
{
  assert(
    normalizeLocation("123 Oak Street, Brooklyn, NY 11201") === "Brooklyn, NY",
    "Normalizes street address to City, ST"
  );
}

console.log("\n2. Same-city matching");
{
  assert(
    citiesMatch("Brooklyn, NY", "Brooklyn Heights, Brooklyn NY"),
    "Brooklyn customer matches Brooklyn provider area"
  );
  assert(
    !citiesMatch("Austin, TX", "Brooklyn, NY"),
    "Different cities do not match"
  );
}

console.log("3. Distance computation");
{
  const near = computeDistanceMiles("Brooklyn, NY", "Brooklyn, NY", "p1");
  const far = computeDistanceMiles("Austin, TX", "Brooklyn, NY", "p1");
  assert(near >= 1 && near <= 20, "Same city distance is 1–20 mi");
  assert(far >= 20 && far <= 100, "Different city distance is 20–100 mi");
}

console.log("\n4. Default 50-mile filter");
{
  const db = buildInitialDatabase();
  const sarah = db.users.find((u) => u.email === "sarah.mitchell@demo.com")!;
  const address = resolveCustomerAddress({
    address: sarah.address,
    email: sarah.email,
  });
  assert(address === "Brooklyn, NY", "Demo customer Sarah is in Brooklyn, NY");

  const all = applyProviderFilters(db, {
    status: "all",
    maxDistance: "50",
    customerAddress: address,
  });
  assert(all.length > 0, "Sarah sees providers within 50 miles");
  assert(
    all.every((p) => p.distanceMiles <= 50),
    "All results respect 50-mile cap"
  );

  const narrow = applyProviderFilters(db, {
    status: "all",
    maxDistance: "10",
    customerAddress: address,
  });
  assert(
    narrow.length <= all.length,
    "Tighter radius returns fewer or equal providers"
  );
}

console.log("\n5. Sort by distance first");
{
  const db = buildInitialDatabase();
  const sorted = applyProviderFilters(db, {
    status: "all",
    maxDistance: "100",
    customerAddress: "Brooklyn, NY",
  });
  const distances = sorted.map((p) => p.distanceMiles);
  const ordered = [...distances].sort((a, b) => a - b);
  assert(
    JSON.stringify(distances) === JSON.stringify(ordered),
    "Providers sorted closest-first"
  );
}

console.log("\n6. Service keyword search (painter)");
{
  assert(
    effectiveSearchQuery("painter", "Painting") === null,
    "Service-only query skips redundant text filter"
  );
  assert(
    effectiveSearchQuery("affordable painter", "Painting") === "affordable",
    "Extra terms still filter after service detection"
  );

  const db = buildInitialDatabase();
  const sarah = db.users.find((u) => u.email === "sarah.mitchell@demo.com")!;
  const address = resolveCustomerAddress({
    address: sarah.address,
    email: sarah.email,
  });
  const parsed = parseSearchFallback("painter");
  const matches = applyProviderFilters(db, {
    q: "painter",
    service: parsed.service,
    status: "all",
    maxDistance: "50",
    customerAddress: address,
  });
  assert(parsed.service === "Painting", "Detects Painting from painter");
  assert(matches.length > 0, "Brooklyn customer finds nearby painters");
  assert(
    matches.some((p) => p.services.includes("Painting")),
    "Results include painting providers"
  );
}

console.log("\n7. Flexible location parsing");
{
  const ny = parseLocationInput("New York, NY");
  assert(ny.city === "New York" && ny.state === "NY", "Parses city and state");

  const zip = parseLocationInput("10001");
  assert(zip.zip === "10001" && zip.city === "New York", "Parses ZIP-only input");

  const full = parseLocationInput("Brooklyn, NY 11201");
  assert(
    full.city === "Brooklyn" && full.state === "NY" && full.zip === "11201",
    "Parses city, state, and ZIP together"
  );

  assert(
    locationMatchingKey(full) === "Brooklyn, NY",
    "Matching key uses city and state"
  );
}

if (failures.length === 0) {
  console.log("\n✅ All location filter tests passed.\n");
  process.exit(0);
}

console.log(`\n❌ ${failures.length} test(s) failed.\n`);
process.exit(1);
