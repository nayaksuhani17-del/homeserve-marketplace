import type { PricingType } from "./pricing";
import { SERVICE_CATEGORIES } from "./constants";

export type JobSize = "small" | "medium" | "large";
export type Urgency = "normal" | "urgent";
export type ComplexityLevel = "low" | "medium" | "high";
export type QuoteConfidence = "high" | "medium" | "low";

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

export type JobAnalysis = {
  detectedService?: string;
  serviceScore: number;
  complexity: ComplexityLevel;
  complexityModifier: number;
  confidence: QuoteConfidence;
  vague: boolean;
  matchedKeywords: string[];
};

export type QuoteResult = {
  detectedService?: string;
  matchedPackage?: ServicePackage;
  suggestedPackages: ServicePackage[];
  estimatedHours: { min: number; max: number };
  estimatedHoursCenter: number;
  complexity: ComplexityLevel;
  complexityModifier: number;
  confidence: QuoteConfidence;
  priceMin: number;
  priceMax: number;
  analysisNote: string;
  timeExplanation: string;
  confidenceMessage?: string;
  disclaimer: string;
};

const SERVICE_KEYWORDS: Record<string, string[]> = {
  Plumber: ["leak", "sink", "pipe", "toilet", "drain", "faucet", "plumb", "water heater", "burst"],
  Electrician: ["electric", "outlet", "wiring", "breaker", "light", "switch", "panel"],
  "House Cleaning": ["clean", "dirty", "mop", "dust", "vacuum", "sanitize", "deep clean", "maid"],
  "Carpet Cleaning": ["carpet", "rug", "stain", "steam", "upholstery"],
  Painting: ["paint", "wall", "ceiling", "brush", "color", "repaint", "crack"],
  Cooking: ["cook", "chef", "meal", "dinner", "catering", "prep"],
  "Car Mechanic": ["car", "brake", "oil", "engine", "tire", "mechanic", "vehicle"],
  "Computer Repair": ["computer", "laptop", "virus", "wifi", "network", "pc", "it"],
  "Lawn Mowing": ["lawn", "mow", "grass", "yard", "hedge", "landscape"],
  "House Shifting": ["move", "moving", "shift", "relocate", "furniture", "packing"],
};

const COMPLEXITY_KEYWORDS: Record<ComplexityLevel, string[]> = {
  low: ["small", "quick fix", "minor", "simple", "touch up", "quick", "easy"],
  medium: ["repair", "room", "apartment", "fix", "replace", "crack", "patch", "medium"],
  high: [
    "whole house",
    "multiple",
    "deep cleaning",
    "deep clean",
    "urgent repair",
    "entire",
    "full house",
    "renovation",
    "extensive",
    "several rooms",
  ],
};

const COMPLEXITY_MODIFIER: Record<ComplexityLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

const JOB_SIZE_BASE_HOURS: Record<JobSize, number> = {
  small: 1,
  medium: 2.5,
  large: 4.5,
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

export function formatHours(h: number): string {
  const rounded = Math.round(h * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function detectServiceFromText(
  description: string,
  fallbackService?: string
): string | undefined {
  const analysis = analyzeJobDescription(description, fallbackService);
  return analysis.detectedService;
}

export function detectComplexity(description: string): {
  level: ComplexityLevel;
  modifier: number;
  matchedKeywords: string[];
} {
  const lower = description.toLowerCase();
  let level: ComplexityLevel = "low";
  const matched: string[] = [];

  for (const tier of ["high", "medium", "low"] as ComplexityLevel[]) {
    for (const kw of COMPLEXITY_KEYWORDS[tier]) {
      if (lower.includes(kw)) {
        matched.push(kw);
        if (COMPLEXITY_MODIFIER[tier] >= COMPLEXITY_MODIFIER[level]) {
          level = tier;
        }
      }
    }
  }

  return { level, modifier: COMPLEXITY_MODIFIER[level], matchedKeywords: matched };
}

export function assessConfidence(
  description: string,
  detectedService?: string,
  complexityKeywords: string[] = []
): QuoteConfidence {
  const trimmed = description.trim();
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;

  if (wordCount < 4 && !detectedService && complexityKeywords.length === 0) {
    return "low";
  }
  if (detectedService && (wordCount >= 6 || complexityKeywords.length > 0)) {
    return "high";
  }
  if (detectedService || wordCount >= 8) {
    return "medium";
  }
  return "low";
}

export function analyzeJobDescription(
  description: string,
  fallbackService?: string
): JobAnalysis {
  const lower = description.toLowerCase();
  const serviceScores: Record<string, number> = {};
  const matchedKeywords: string[] = [];

  for (const [service, keywords] of Object.entries(SERVICE_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        matchedKeywords.push(kw);
        const score = kw.includes(" ") ? 2 : 1;
        serviceScores[service] = (serviceScores[service] ?? 0) + score;
      }
    }
  }

  let best: { service: string; score: number } | undefined;
  for (const [service, score] of Object.entries(serviceScores)) {
    if (!best || score > best.score) {
      best = { service, score };
    }
  }

  const complexity = detectComplexity(description);
  const detectedService = best?.service ?? fallbackService;
  const confidence = assessConfidence(
    description,
    detectedService,
    [...matchedKeywords, ...complexity.matchedKeywords]
  );
  const vague =
    confidence === "low" ||
    (matchedKeywords.length === 0 && complexity.matchedKeywords.length === 0 && description.trim().length < 25);

  return {
    detectedService,
    serviceScore: best?.score ?? 0,
    complexity: complexity.level,
    complexityModifier: complexity.modifier,
    confidence,
    vague,
    matchedKeywords: [...new Set([...matchedKeywords, ...complexity.matchedKeywords])],
  };
}

function baseHoursFromSize(jobSize: JobSize): number {
  return JOB_SIZE_BASE_HOURS[jobSize];
}

export function estimateDynamicHours(
  jobSize: JobSize,
  complexityModifier: number,
  seed: number
): { center: number; min: number; max: number } {
  const base = baseHoursFromSize(jobSize);
  const center = base + complexityModifier;
  const jitter = 0.02 + seededFloat(seed, 11) * 0.04;
  const minFactor = 0.9 - jitter;
  const maxFactor = 1.2 + jitter;
  return {
    center,
    min: Math.round(center * minFactor * 10) / 10,
    max: Math.round(center * maxFactor * 10) / 10,
  };
}

function complexityLabel(level: ComplexityLevel): string {
  switch (level) {
    case "low":
      return "straightforward";
    case "medium":
      return "medium-complexity";
    case "high":
      return "high-complexity";
  }
}

function buildTimeExplanation(hoursMin: number, hoursMax: number): string {
  if (hoursMin === hoursMax) {
    return `Estimated time: ~${formatHours(hoursMin)} hours`;
  }
  return `Estimated time: ~${formatHours(hoursMin)}–${formatHours(hoursMax)} hours`;
}

function buildAnalysisNote(params: {
  analysis: JobAnalysis;
  service: string;
  hoursMin: number;
  hoursMax: number;
  matchedPackage?: ServicePackage;
}): { analysisNote: string; confidenceMessage?: string } {
  const { analysis, service, hoursMin, hoursMax, matchedPackage } = params;
  const serviceLabel = (analysis.detectedService ?? service).toLowerCase();

  if (matchedPackage) {
    return {
      analysisNote: `We matched your description to "${matchedPackage.label}" — a popular package from this pro.`,
    };
  }

  if (analysis.vague) {
    return {
      analysisNote:
        "Based on your description, here is a general estimate. Final price may vary.",
      confidenceMessage: "Low confidence — add more detail for a sharper estimate.",
    };
  }

  const complexity = complexityLabel(analysis.complexity);
  const note = `Based on your description, this looks like a ${complexity} ${serviceLabel} job.`;

  let confidenceMessage: string | undefined;
  if (analysis.confidence === "high") {
    confidenceMessage = "High confidence — keywords matched your job details.";
  } else if (analysis.confidence === "medium") {
    confidenceMessage = "Moderate confidence — estimate may refine after inspection.";
  }

  return { analysisNote: note, confidenceMessage };
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

function applyPriceRange(total: number, seed: number): { min: number; max: number } {
  const jitter = seededFloat(seed, 7) * 0.04;
  const minFactor = 0.9 - jitter * 0.5;
  const maxFactor = 1.2 + jitter * 0.5;
  return {
    min: Math.round(total * minFactor),
    max: Math.round(total * maxFactor),
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
  const analysis = analyzeJobDescription(input.description, input.service);
  const packages = provider.servicePackages ?? [];
  const matchedPackage = matchPackage(input.description, packages);
  const suggestedPackages = packages.filter((p) => p.label !== matchedPackage?.label).slice(0, 2);
  const hours = estimateDynamicHours(input.jobSize, analysis.complexityModifier, seed);
  const urgent = urgencyMultiplier(input.urgency);
  const timeExplanation = buildTimeExplanation(hours.min, hours.max);

  let rawTotal: number;
  const { analysisNote, confidenceMessage } = buildAnalysisNote({
    analysis,
    service: input.service,
    hoursMin: hours.min,
    hoursMax: hours.max,
    matchedPackage,
  });

  if (matchedPackage) {
    rawTotal = matchedPackage.price * urgent;
  } else if (provider.pricingType === "fixed") {
    const fixedHours = hours.center || baseHoursFromSize(input.jobSize);
    rawTotal = provider.price * urgent * (0.85 + (fixedHours / 6) * 0.3);
  } else {
    const rate = provider.hourlyRate || provider.price;
    rawTotal = hours.center * rate * urgent;
  }

  const { min: priceMin, max: priceMax } = applyPriceRange(rawTotal, seed);

  let disclaimer = "Final price may vary after inspection";
  if (input.urgency === "urgent") {
    disclaimer += " · Urgent priority fee (+22%) included";
  }

  return {
    detectedService: analysis.detectedService,
    matchedPackage,
    suggestedPackages,
    estimatedHours: { min: hours.min, max: hours.max },
    estimatedHoursCenter: hours.center,
    complexity: analysis.complexity,
    complexityModifier: analysis.complexityModifier,
    confidence: analysis.confidence,
    priceMin,
    priceMax,
    analysisNote,
    timeExplanation,
    confidenceMessage,
    disclaimer,
  };
}

export function formatQuoteRange(min: number, max: number): string {
  if (min === max) return `$${min}`;
  return `$${min} – $${max}`;
}

export const JOB_SIZE_OPTIONS: { value: JobSize; label: string; hint: string }[] = [
  { value: "small", label: "Small", hint: "~1 hour" },
  { value: "medium", label: "Medium", hint: "~2.5 hours" },
  { value: "large", label: "Large", hint: "~4.5 hours" },
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
