"use client";

import {
  PRICE_CATEGORY_OPTIONS,
  RATING_TIER_OPTIONS,
  type PriceCategory,
  type RatingTier,
  type RefinementFilters,
} from "@/lib/search/refinement-filters";

type SearchRefinementFiltersProps = {
  aiDefaults: RefinementFilters;
  userOverrides: Partial<RefinementFilters>;
  effective: RefinementFilters;
  activeSummary: string;
  onChange: (next: Partial<RefinementFilters>) => void;
  onClear: () => void;
  showClear: boolean;
};

function tierActive(
  effective: RefinementFilters,
  tier: RatingTier
): boolean {
  return effective.minRating === tier;
}

function priceActive(
  effective: RefinementFilters,
  tier: PriceCategory
): boolean {
  return effective.priceCategory === tier;
}

export function SearchRefinementFilters({
  effective,
  userOverrides,
  activeSummary,
  onChange,
  onClear,
  showClear,
}: SearchRefinementFiltersProps) {
  function toggleRating(tier: RatingTier) {
    if (effective.minRating === tier && userOverrides.minRating === tier) {
      const { minRating: _, ...rest } = userOverrides;
      onChange(rest);
      return;
    }
    onChange({ ...userOverrides, minRating: tier });
  }

  function togglePrice(tier: PriceCategory) {
    if (
      effective.priceCategory === tier &&
      userOverrides.priceCategory === tier
    ) {
      const { priceCategory: _, ...rest } = userOverrides;
      onChange(rest);
      return;
    }
    onChange({ ...userOverrides, priceCategory: tier });
  }

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Refine results
        </p>
        {showClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-medium text-gray-500 underline-offset-2 hover:text-gray-800 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Rating</span>
          {RATING_TIER_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => toggleRating(value)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                tierActive(effective, value)
                  ? "bg-green-600 text-white shadow-sm"
                  : "border border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 hover:bg-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="hidden h-6 w-px bg-gray-200 sm:block" aria-hidden />

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Price</span>
          {PRICE_CATEGORY_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => togglePrice(value)}
              title={
                value === "$"
                  ? "Budget-friendly"
                  : value === "$$"
                    ? "Mid-range"
                    : "Premium"
              }
              className={`min-w-[2.5rem] rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                priceActive(effective, value)
                  ? "bg-green-600 text-white shadow-sm"
                  : "border border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 hover:bg-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-500">{activeSummary}</p>
    </div>
  );
}
