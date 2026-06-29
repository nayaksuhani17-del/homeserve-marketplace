/** Demo-friendly location matching — no external maps API. */

export const DISTANCE_RADIUS_KEY = "homeserve-distance-radius";
export const CUSTOMER_LOCATION_KEY = "homeserve-customer-location";
export const DEFAULT_DISTANCE_RADIUS = 50;
export const DISTANCE_RANGE_OPTIONS = [10, 25, 50, 100] as const;
export const FALLBACK_LOCATION_LABEL = "Your City";

export type DistanceRadius = (typeof DISTANCE_RANGE_OPTIONS)[number];

/** Parsed customer location — stored on profile and in localStorage. */
export type CustomerLocation = {
  raw: string;
  city?: string;
  state?: string;
  zip?: string;
};

/** Common demo ZIP → city lookups (no external API). */
const DEMO_ZIP_AREAS: Record<string, { city: string; state: string }> = {
  "10001": { city: "New York", state: "NY" },
  "10002": { city: "New York", state: "NY" },
  "10003": { city: "New York", state: "NY" },
  "11201": { city: "Brooklyn", state: "NY" },
  "11211": { city: "Brooklyn", state: "NY" },
  "11215": { city: "Brooklyn", state: "NY" },
  "78701": { city: "Austin", state: "TX" },
  "80203": { city: "Denver", state: "CO" },
  "33101": { city: "Miami", state: "FL" },
  "98101": { city: "Seattle", state: "WA" },
  "02108": { city: "Boston", state: "MA" },
  "60601": { city: "Chicago", state: "IL" },
  "90210": { city: "Los Angeles", state: "CA" },
};

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h;
}

function extractZip(text: string): string | undefined {
  const match = text.match(/\b(\d{5})(?:-\d{4})?\b/);
  return match?.[1];
}

function extractStateToken(text: string): string | undefined {
  const cleaned = text.replace(/\d{5}(-\d{4})?/g, "").trim();
  const match = cleaned.match(/\b([A-Za-z]{2})\b/);
  return match?.[1]?.toUpperCase();
}

/** Parse flexible location input: city, state, ZIP, or any combination. */
export function parseLocationInput(input: string): CustomerLocation {
  const raw = input.trim();
  if (!raw) return { raw: "" };

  const zip = extractZip(raw);

  if (raw.includes(",")) {
    const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 3) {
      const city = parts[parts.length - 2]!;
      const statePart = parts[parts.length - 1]!;
      const state = extractStateToken(statePart);
      return { raw, city, state, zip: extractZip(statePart) ?? zip };
    }
    const city = parts[0];
    const rest = parts.slice(1).join(", ");
    const state = extractStateToken(rest);
    return { raw, city, state, zip };
  }

  if (/^\d{5}(-\d{4})?$/.test(raw)) {
    const code = raw.slice(0, 5);
    const area = DEMO_ZIP_AREAS[code];
    if (area) {
      return { raw, city: area.city, state: area.state, zip: code };
    }
    return { raw, zip: code };
  }

  if (/^\d+$/.test(raw.replace(/\s/g, "")) && zip) {
    const area = DEMO_ZIP_AREAS[zip];
    if (area) {
      return { raw, city: area.city, state: area.state, zip };
    }
    return { raw, zip };
  }

  return { raw, city: raw, zip };
}

/** Matching label used for distance simulation (City, ST). */
export function locationMatchingKey(loc: CustomerLocation | string): string {
  const parsed = typeof loc === "string" ? parseLocationInput(loc) : loc;
  if (!parsed.raw) return FALLBACK_LOCATION_LABEL;

  if (parsed.city && parsed.state) {
    return `${parsed.city}, ${parsed.state}`;
  }

  if (parsed.city) return parsed.city;

  if (parsed.zip) {
    const area = DEMO_ZIP_AREAS[parsed.zip];
    if (area) return `${area.city}, ${area.state}`;
    return `ZIP ${parsed.zip}`;
  }

  return parsed.raw;
}

/** Normalize to a simple "City, ST" label (legacy helper). */
export function normalizeLocation(address: string): string {
  const trimmed = address.trim();
  if (!trimmed) return FALLBACK_LOCATION_LABEL;
  return locationMatchingKey(parseLocationInput(trimmed));
}

export function locationDisplayLabel(
  loc?: CustomerLocation | string | null
): string {
  if (!loc) return FALLBACK_LOCATION_LABEL;
  if (typeof loc === "string") {
    const trimmed = loc.trim();
    if (!trimmed) return FALLBACK_LOCATION_LABEL;
    return parseLocationInput(trimmed).raw || trimmed;
  }
  return loc.raw.trim() || locationMatchingKey(loc);
}

export function extractCityKey(location: string): string {
  const parsed = parseLocationInput(location);
  const key = locationMatchingKey(parsed);
  return key.split(",")[0]?.trim().toLowerCase() ?? "";
}

export function citiesMatch(customerAddress: string, providerLocation: string): boolean {
  const customerCity = extractCityKey(customerAddress);
  const providerCity = extractCityKey(providerLocation);
  if (!customerCity || !providerCity) return false;
  if (customerCity === providerCity) return true;

  const customerLower = customerAddress.toLowerCase();
  const providerLower = providerLocation.toLowerCase();
  return (
    customerLower.includes(providerCity) ||
    providerLower.includes(customerCity)
  );
}

/**
 * Same city → nearby (1–20 mi). Different city → deterministic 20–100 mi.
 */
export function computeDistanceMiles(
  customerAddress: string,
  providerLocation: string,
  providerId?: string
): number {
  const customer = locationMatchingKey(parseLocationInput(customerAddress));
  const provider = locationMatchingKey(parseLocationInput(providerLocation));
  const seedKey = `${customer}|${providerId ?? provider}`;

  if (citiesMatch(customer, provider)) {
    const seed = hashSeed(seedKey);
    return Math.round((1 + (seed % 190) / 10) * 10) / 10;
  }

  const seed = hashSeed(`${seedKey}|far`);
  return 20 + (seed % 81);
}

export function loadDistanceRadius(): DistanceRadius {
  if (typeof window === "undefined") return DEFAULT_DISTANCE_RADIUS;
  try {
    const raw = localStorage.getItem(DISTANCE_RADIUS_KEY);
    const n = Number(raw);
    if (DISTANCE_RANGE_OPTIONS.includes(n as DistanceRadius)) {
      return n as DistanceRadius;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_DISTANCE_RADIUS;
}

export function saveDistanceRadius(miles: DistanceRadius): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DISTANCE_RADIUS_KEY, String(miles));
  } catch {
    /* ignore */
  }
}

function parseStoredLocation(raw: string): CustomerLocation | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed) as CustomerLocation;
    if (parsed && typeof parsed.raw === "string" && parsed.raw.trim()) {
      return {
        raw: parsed.raw.trim(),
        city: parsed.city?.trim() || undefined,
        state: parsed.state?.trim() || undefined,
        zip: parsed.zip?.trim() || undefined,
      };
    }
  } catch {
    /* legacy plain string */
  }
  return parseLocationInput(trimmed);
}

export function loadCustomerLocation(): CustomerLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CUSTOMER_LOCATION_KEY);
    if (!raw) return null;
    return parseStoredLocation(raw);
  } catch {
    return null;
  }
}

/** Raw input string for prefilling the location field. */
export function loadCustomerLocationRaw(): string {
  return loadCustomerLocation()?.raw ?? "";
}

export function saveCustomerLocation(input: string | CustomerLocation): void {
  if (typeof window === "undefined") return;
  try {
    const loc =
      typeof input === "string" ? parseLocationInput(input) : input;
    if (!loc.raw.trim()) {
      localStorage.removeItem(CUSTOMER_LOCATION_KEY);
      return;
    }
    localStorage.setItem(CUSTOMER_LOCATION_KEY, JSON.stringify(loc));
  } catch {
    /* ignore */
  }
}

export function hasExplicitLocation(
  loc?: CustomerLocation | string | null
): boolean {
  if (!loc) return false;
  if (typeof loc === "string") return Boolean(loc.trim());
  return Boolean(loc.raw.trim());
}

export function resolveMaxDistance(maxDistance?: string): string {
  if (maxDistance && maxDistance.trim()) return maxDistance;
  if (typeof window !== "undefined") {
    return String(loadDistanceRadius());
  }
  return String(DEFAULT_DISTANCE_RADIUS);
}

export function formatDistanceMiles(miles: number): string {
  const rounded =
    miles >= 10 ? Math.round(miles) : Math.round(miles * 10) / 10;
  return `${rounded} mile${rounded === 1 ? "" : "s"} away`;
}

/** Attach computed distanceMiles for filtering/display relative to a customer. */
export function withCustomerDistances<
  T extends {
    id: string;
    location: string;
    address?: string;
    distanceMiles: number;
  },
>(providers: T[], customerAddress?: string | null): T[] {
  if (!customerAddress?.trim()) return providers;
  const matchKey = locationMatchingKey(parseLocationInput(customerAddress));
  return providers.map((p) => ({
    ...p,
    distanceMiles: computeDistanceMiles(
      matchKey,
      p.address ?? p.location,
      p.id
    ),
  }));
}

const DEMO_USER_ADDRESSES: Record<string, string> = {
  "sarah.mitchell@demo.com": "Brooklyn, NY",
  "james.rodriguez@demo.com": "Austin, TX",
  "emily.chen@demo.com": "Denver, CO",
  "michael.thompson@demo.com": "Miami, FL",
  "jessica.williams@demo.com": "Seattle, WA",
  "marcus.reed@demo.com": "Brooklyn, NY",
  "admin@test.com": "Springfield, IL",
};

export function demoAddressForEmail(email: string): string | undefined {
  return DEMO_USER_ADDRESSES[email.toLowerCase()];
}

export function resolveCustomerAddress(input: {
  address?: string;
  location?: CustomerLocation;
  email?: string;
}): string {
  if (input.location?.raw.trim()) {
    return locationMatchingKey(input.location);
  }
  const fromProfile = input.address?.trim();
  if (fromProfile) return locationMatchingKey(parseLocationInput(fromProfile));
  const demo = input.email ? demoAddressForEmail(input.email) : undefined;
  return demo ?? FALLBACK_LOCATION_LABEL;
}

export function providerAddress(provider: {
  address?: string;
  location: string;
}): string {
  return locationMatchingKey(parseLocationInput(provider.address ?? provider.location));
}

/** Merge parsed fields when saving — keeps richest city/state/zip available. */
export function enrichCustomerLocation(input: string | CustomerLocation): CustomerLocation {
  const parsed =
    typeof input === "string" ? parseLocationInput(input) : parseLocationInput(input.raw);
  if (typeof input !== "string" && input.raw.trim()) {
    return {
      raw: input.raw.trim(),
      city: input.city || parsed.city,
      state: input.state || parsed.state,
      zip: input.zip || parsed.zip,
    };
  }
  return parsed;
}
