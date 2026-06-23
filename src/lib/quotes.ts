import type { PricingType } from "./pricing";
import { SERVICE_CATEGORIES } from "./constants";

export type JobSize = "small" | "medium" | "large";
export type Urgency = "normal" | "urgent";

export type ServicePackage = {
  label: string;
  price: number;
};

export type QuoteProviderProfile = {
  pricingType: PricingType;
  price: number;
  basePrice: number;
  hourlyRate: number;
  services: string[];
  servicePackages?: ServicePackage[];
};

export type QuoteInput = {
  service: string;
  description: string;
  jobSize: JobSize;
  urgency: Urgency;
};

export type QuoteResult = {
  detectedService?: string;
  matchedPackage?: ServicePackage;
  suggestedPackages: ServicePackage[];
  estimatedHours: { min: number; max: number };
  priceMin: number;
  priceMax: number;
  analysisNote: string;
  disclaimer: string;
};

const SERVICE_KEYWORDS: Record<string, string[]> = {
  Plumber: ["leak", "sink", "pipe", "toilet", "drain", "faucet", "plumb", "water heater", "burst"],
  Electrician: ["electric", "outlet", "wiring", "breaker", "light", "switch", "panel"],
  "House Cleaning": ["clean", "mop", "dust", "vacuum", "sanitize", "deep clean", "maid"],
  "Carpet Cleaning": ["carpet", "rug", "stain", "steam", "upholstery"],
  Painting: ["paint", "wall", "ceiling", "brush", "color", "repaint"],
  Cooking: ["cook", "chef", "meal", "dinner", "catering", "prep"],
  "Car Mechanic": ["car", "brake", "oil", "engine", "tire", "mechanic", "vehicle"],
  "Computer Repair": ["computer", "laptop", "virus", "wifi", "network", "pc", "it"],
  "Lawn Mowing": ["lawn", "mow", "grass", "yard", "hedge", "landscape"],
  "House Shifting": ["move", "moving", "shift", "relocate", "furniture", "packing"],
};

const PACKAGE_TEMPLATES: Record<string, { label: string; ratio: number }[]> = {
  Plumber: [
    { label: "Fix leaking sink", ratio: 0.55 },
    { label: "Unclog drain", ratio: 0.4 },
    { label: "Toilet repair", ratio: 0.48 },
  ],
  "House Cleaning": [
    { label: "Standard home clean", ratio: 0.85 },
    { label: "Deep house cleaning", ratio: 1.15 },
    { label: "Move-out cleaning", ratio: 1.35 },
  ],
  "Carpet Cleaning": [
    { label: "Room carpet steam clean", ratio: 0.7 },
    { label: "Whole-home carpet refresh", ratio: 1.2 },
  ],
  Painting: [
    { label: "Single room repaint", ratio: 0.45 },
    { label: "Full interior refresh", ratio: 1.1 },
  ],
  Electrician: [
    { label: "Outlet installation", ratio: 0.35 },
    { label: "Light fixture swap", ratio: 0.3 },
  ],
  "Lawn Mowing": [
    { label: "Standard lawn mow", ratio: 0.9 },
    { label: "Mow + edge + cleanup", ratio: 1.2 },
  ],
  "Car Mechanic": [
    { label: "Oil change & inspection", ratio: 0.35 },
    { label: "Brake pad replacement", ratio: 0.75 },
  ],
  "Computer Repair": [
    { label: "Virus removal", ratio: 0.4 },
    { label: "Wi-Fi setup", ratio: 0.35 },
  ],
  Cooking: [
    { label: "Weekly meal prep (4 servings)", ratio: 0.55 },
    { label: "Dinner party (6 guests)", ratio: 1.1 },
  ],
  "House Shifting": [
    { label: "Studio apartment move", ratio: 0.5 },
    { label: "2-bedroom local move", ratio: 1.0 },
  ],
};

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

function seededFloat(seed: number, salt: number): number {
  const x = Math.sin(seed * 9301 + salt * 49297) * 49297;
  return x - Math.floor(x);
}

export function detectServiceFromText(
  description: string,
  fallbackService?: string
): string | undefined {
  const lower = description.toLowerCase();
  let best: { service: string; score: number } | undefined;

  for (const [service, keywords] of Object.entries(SERVICE_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score += kw.includes(" ") ? 2 : 1;
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { service, score };
    }
  }

  return best?.service ?? fallbackService;
}

export function buildServicePackages(
  primaryService: string,
  pricingType: PricingType,
  price: number,
  seedKey: string,
  max = 3
): ServicePackage[] {
  const templates = PACKAGE_TEMPLATES[primaryService];
  if (!templates) return [];

  const seed = hashSeed(seedKey);
  const include = seededFloat(seed, 3) > 0.35;
  if (!include && pricingType !== "fixed") return [];

  const base = pricingType === "hourly" ? price * 2.5 : price;

  return templates.slice(0, max).map((t, i) => ({
    label: t.label,
    price: Math.round(base * t.ratio * (0.92 + seededFloat(seed, 10 + i) * 0.16)),
  }));
}

export function enrichProviderQuoteFields(input: {
  id: string;
  pricingType: PricingType;
  price: number;
  services: string[];
  basePrice?: number;
  hourlyRate?: number;
  servicePackages?: ServicePackage[];
}): {
  basePrice: number;
  hourlyRate: number;
  servicePackages: ServicePackage[];
} {
  const primary = input.services[0] ?? "Plumber";
  const seed = hashSeed(input.id);

  let basePrice: number;
  let hourlyRate: number;

  switch (input.pricingType) {
    case "hourly":
      hourlyRate = input.hourlyRate ?? input.price;
      basePrice = input.basePrice ?? Math.round(25 + seededFloat(seed, 1) * 35);
      break;
    case "fixed":
      basePrice = input.basePrice ?? input.price;
      hourlyRate = input.hourlyRate ?? 0;
      break;
    case "estimate":
      basePrice = input.basePrice ?? Math.round(input.price * (0.2 + seededFloat(seed, 2) * 0.15));
      hourlyRate = input.hourlyRate ?? Math.round(input.price / (5 + seededFloat(seed, 3) * 2));
      break;
  }

  const servicePackages =
    input.servicePackages ??
    buildServicePackages(primary, input.pricingType, input.price, input.id);

  return { basePrice, hourlyRate, servicePackages };
}

function estimateHours(jobSize: JobSize): { min: number; max: number } {
  switch (jobSize) {
    case "small":
      return { min: 1, max: 1 };
    case "medium":
      return { min: 2, max: 3 };
    case "large":
      return { min: 4, max: 6 };
  }
}

function matchPackage(
  description: string,
  packages: ServicePackage[]
): ServicePackage | undefined {
  const lower = description.toLowerCase();
  if (!lower.trim() || packages.length === 0) return undefined;

  let best: { pkg: ServicePackage; score: number } | undefined;

  for (const pkg of packages) {
    const words = pkg.label.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    let score = 0;
    for (const w of words) {
      if (lower.includes(w)) score++;
    }
    if (pkg.label.toLowerCase().includes("deep") && lower.includes("deep")) score += 2;
    if (pkg.label.toLowerCase().includes("leak") && lower.includes("leak")) score += 3;
    if (pkg.label.toLowerCase().includes("sink") && lower.includes("sink")) score += 3;
    if (score > 0 && (!best || score > best.score)) {
      best = { pkg, score };
    }
  }

  return best?.pkg;
}

function applyPriceVariation(
  min: number,
  max: number,
  seed: number
): { min: number; max: number } {
  const jitter = 0.08 + seededFloat(seed, 7) * 0.1;
  const low = Math.round(min * (1 - jitter));
  const high = Math.round(max * (1 + jitter));
  return {
    min: Math.min(low, high - 10),
    max: Math.max(high, low + 15),
  };
}

function urgencyMultiplier(urgency: Urgency): number {
  return urgency === "urgent" ? 1.22 : 1;
}

export function calculateInstantQuote(
  provider: QuoteProviderProfile,
  input: QuoteInput,
  seedKey?: string
): QuoteResult {
  const seed = hashSeed(seedKey ?? `${provider.basePrice}:${input.description}:${input.jobSize}`);
  const detected = detectServiceFromText(input.description, input.service);
  const packages = provider.servicePackages ?? [];
  const matchedPackage = matchPackage(input.description, packages);
  const suggestedPackages = packages.filter((p) => p.label !== matchedPackage?.label).slice(0, 2);
  const hours = estimateHours(input.jobSize);
  const urgent = urgencyMultiplier(input.urgency);

  let rawMin: number;
  let rawMax: number;
  let analysisNote: string;

  if (matchedPackage) {
    rawMin = matchedPackage.price * urgent;
    rawMax = matchedPackage.price * urgent * (1.08 + seededFloat(seed, 4) * 0.12);
    analysisNote = `We matched your description to "${matchedPackage.label}" — a popular package from this pro.`;
  } else if (provider.pricingType === "fixed") {
    rawMin = provider.price * urgent;
    rawMax = provider.price * urgent * (1.05 + seededFloat(seed, 5) * 0.1);
    analysisNote = "This provider uses fixed job pricing — your quote reflects their standard rate.";
  } else {
    rawMin = (provider.basePrice + hours.min * provider.hourlyRate) * urgent;
    rawMax = (provider.basePrice + hours.max * provider.hourlyRate) * urgent;
    const serviceLabel = detected ?? input.service;
    analysisNote = detected
      ? `Based on "${input.description.slice(0, 60)}${input.description.length > 60 ? "…" : ""}", this looks like a ${serviceLabel.toLowerCase()} job (~${hours.min}${hours.max > hours.min ? `–${hours.max}` : ""} hrs).`
      : `Estimated for a ${input.jobSize} ${input.service.toLowerCase()} job (~${hours.min}${hours.max > hours.min ? `–${hours.max}` : ""} hrs).`;
  }

  const { min: priceMin, max: priceMax } = applyPriceVariation(rawMin, rawMax, seed);

  return {
    detectedService: detected,
    matchedPackage,
    suggestedPackages,
    estimatedHours: hours,
    priceMin,
    priceMax,
    analysisNote,
    disclaimer: "Final price may vary after inspection",
  };
}

export function formatQuoteRange(min: number, max: number): string {
  if (min === max) return `$${min}`;
  return `$${min} – $${max}`;
}

export const JOB_SIZE_OPTIONS: { value: JobSize; label: string; hint: string }[] = [
  { value: "small", label: "Small", hint: "~1 hour" },
  { value: "medium", label: "Medium", hint: "2–3 hours" },
  { value: "large", label: "Large", hint: "4+ hours" },
];

export const URGENCY_OPTIONS: { value: Urgency; label: string; hint: string }[] = [
  { value: "normal", label: "Normal", hint: "Standard scheduling" },
  { value: "urgent", label: "Urgent", hint: "+22% priority fee" },
];

export function isKnownService(service: string): boolean {
  return (SERVICE_CATEGORIES as readonly string[]).includes(service);
}

export function toQuoteProfile(input: {
  id?: string;
  pricing_type: PricingType;
  price: number;
  base_price?: number;
  hourly_rate?: number;
  services: string[];
  service_packages?: ServicePackage[];
}): QuoteProviderProfile {
  const enriched = enrichProviderQuoteFields({
    id: input.id ?? "quote",
    pricingType: input.pricing_type,
    price: Number(input.price),
    services: input.services,
    basePrice: input.base_price,
    hourlyRate: input.hourly_rate,
    servicePackages: input.service_packages,
  });
  return {
    pricingType: input.pricing_type,
    price: Number(input.price),
    basePrice: enriched.basePrice,
    hourlyRate: enriched.hourlyRate,
    services: input.services,
    servicePackages: enriched.servicePackages,
  };
}
