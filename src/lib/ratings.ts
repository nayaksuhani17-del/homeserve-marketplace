import type { MockReview } from "./mock/types";

/** Round average to one decimal (marketplace standard). */
export function roundRatingAverage(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Compute provider rating from completed-job reviews only.
 * average = sum(ratings) / count, rounded to 1 decimal.
 */
export function computeProviderRatingStats(
  reviews: MockReview[],
  providerId: string
): { ratingAvg: number; reviewCount: number } | null {
  const providerReviews = reviews.filter((r) => r.providerId === providerId);
  if (providerReviews.length === 0) return null;
  const total = providerReviews.reduce((sum, r) => sum + r.rating, 0);
  const reviewCount = providerReviews.length;
  const ratingAvg = roundRatingAverage(total / reviewCount);
  return { ratingAvg, reviewCount };
}

export function hasProviderReviews(reviewCount: number): boolean {
  return Number(reviewCount) > 0;
}

/** Display line: "4.7 • 12 reviews" */
export function formatRatingSummary(ratingAvg: number, reviewCount: number): string {
  const count = Number(reviewCount);
  const label = count === 1 ? "review" : "reviews";
  return `${roundRatingAverage(ratingAvg).toFixed(1)} • ${count} ${label}`;
}

export const NO_REVIEWS_LABEL = "No reviews yet";

/** Resolve live stats from mock DB when available. */
export function resolveProviderRating(
  live: { ratingAvg: number; reviewCount: number } | undefined | null,
  fallback: { ratingAvg?: number; reviewCount?: number }
): { ratingAvg: number; reviewCount: number } {
  if (live && Number.isFinite(live.reviewCount)) {
    return {
      ratingAvg: roundRatingAverage(live.ratingAvg),
      reviewCount: live.reviewCount,
    };
  }
  return {
    ratingAvg: roundRatingAverage(Number(fallback.ratingAvg) || 0),
    reviewCount: Number(fallback.reviewCount) || 0,
  };
}
