"use client";

import { StarRating } from "./StarRating";
import {
  formatRatingSummary,
  hasProviderReviews,
  NO_REVIEWS_LABEL,
} from "@/lib/ratings";

type ProviderRatingDisplayProps = {
  ratingAvg: number;
  reviewCount: number;
  size?: "sm" | "md";
  className?: string;
  /** Show compact "4.7 • 12 reviews" after stars (default true). */
  showSummary?: boolean;
};

/** Marketplace-style rating row: stars + numeric + review count, or "No reviews yet". */
export function ProviderRatingDisplay({
  ratingAvg,
  reviewCount,
  size = "sm",
  className = "",
  showSummary = true,
}: ProviderRatingDisplayProps) {
  if (!hasProviderReviews(reviewCount)) {
    return (
      <span className={`text-gray-500 ${size === "sm" ? "text-xs" : "text-sm"} ${className}`.trim()}>
        {NO_REVIEWS_LABEL}
      </span>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 ${className}`.trim()}>
      <StarRating rating={ratingAvg} size={size} showNumeric />
      {showSummary && (
        <>
          <span className="text-gray-300" aria-hidden>
            ·
          </span>
          <span className={`text-gray-600 ${size === "sm" ? "text-xs" : "text-sm"}`}>
            {formatRatingSummary(ratingAvg, reviewCount)}
          </span>
        </>
      )}
    </div>
  );
}
