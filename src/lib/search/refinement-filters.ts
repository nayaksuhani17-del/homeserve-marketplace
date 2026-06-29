import type { ParsedSearchResult } from "@/lib/ai/parse-search";
import type { ProviderFilters } from "@/lib/mock/types";

export type PriceCategory = "$" | "$$" | "$$$";
export type RatingTier = 3 | 4 | 4.5;

export type RefinementFilters = {
  service?: string;
  minRating?: RatingTier;
  priceCategory?: PriceCategory;
  /** AI budget cap when price-sensitive (comparable $/hr). */
  maxPrice?: number;
  availability?: "today" | "tomorrow";
  sort?: "rating" | "price" | "distance";
};

/** Comparable hourly-equivalent price tiers for $ / $$ / $$$. */
export const PRICE_TIER_BOUNDS: Record<
  PriceCategory,
  { min: number; max: number; label: string }
> = {
  $: { min: 0, max: 45, label: "Under $50/hr" },
  $$: { min: 45, max: 75, label: "$$ · Mid-range" },
  $$$: { min: 75, max: Infinity, label: "$$$ · Premium" },
};

export const RATING_TIER_OPTIONS: { value: RatingTier; label: string }[] = [
  { value: 3, label: "3+ stars" },
  { value: 4, label: "4+ stars" },
  { value: 4.5, label: "4.5+ stars" },
];

export const PRICE_CATEGORY_OPTIONS: { value: PriceCategory; label: string }[] =
  [
    { value: "$", label: "$" },
    { value: "$$", label: "$$" },
    { value: "$$$", label: "$$$" },
  ];

/** AI-derived defaults from natural-language search. */
export function aiDefaultsFromParsed(
  parsed: ParsedSearchResult
): RefinementFilters {
  const filters: RefinementFilters = {};

  if (parsed.service) filters.service = parsed.service;

  if (parsed.intent.priceSensitive) {
    filters.priceCategory = "$";
    filters.maxPrice = parsed.maxPrice ?? 45;
    filters.sort = "price";
  } else if (parsed.intent.qualityFocus) {
    filters.minRating = 4;
    filters.sort = "rating";
  }

  if (parsed.minRating != null) {
    filters.minRating = parsed.minRating as RatingTier;
  }
  if (parsed.availability) {
    filters.availability = parsed.availability;
  }
  if (parsed.sort && !filters.sort) {
    filters.sort = parsed.sort;
  }

  return filters;
}

/** User overrides win over AI defaults — both apply together. */
export function effectiveFilters(
  ai: RefinementFilters,
  user: Partial<RefinementFilters>
): RefinementFilters {
  const merged = { ...ai, ...user };

  if (user.priceCategory !== undefined) {
    merged.priceCategory = user.priceCategory;
    if (user.priceCategory !== "$") {
      merged.maxPrice = undefined;
    }
  }

  if (user.minRating !== undefined) {
    merged.minRating = user.minRating;
  }

  return merged;
}

export function hasUserOverrides(
  ai: RefinementFilters,
  user: Partial<RefinementFilters>
): boolean {
  return Object.keys(user).length > 0;
}

export function refinementToProviderFilters(
  query: string,
  effective: RefinementFilters,
  opts: { customerAddress?: string; radius: number }
): ProviderFilters {
  const useMaxPrice =
    effective.priceCategory === "$" && effective.maxPrice != null;

  return {
    q: query,
    service: effective.service,
    status: "all",
    minRating: effective.minRating ? String(effective.minRating) : undefined,
    maxPrice: useMaxPrice ? String(effective.maxPrice) : undefined,
    priceCategory: effective.priceCategory,
    maxDistance: String(opts.radius),
    customerAddress: opts.customerAddress,
    availability: effective.availability,
    sort: effective.sort,
  };
}

export function formatActiveFilterSummary(
  effective: RefinementFilters,
  opts: { radius: number }
): string {
  const parts: string[] = [];

  if (effective.service) parts.push(effective.service);

  if (effective.priceCategory) {
    parts.push(PRICE_TIER_BOUNDS[effective.priceCategory].label);
  } else if (effective.maxPrice != null) {
    parts.push(`Under $${effective.maxPrice}/hr`);
  }

  if (effective.minRating != null) {
    parts.push(`${effective.minRating}+ ⭐`);
  }

  if (effective.availability === "today") {
    parts.push("Available today");
  } else if (effective.availability === "tomorrow") {
    parts.push("Available tomorrow");
  }

  parts.push(`Within ${opts.radius} miles`);
  return parts.join(" • ");
}
