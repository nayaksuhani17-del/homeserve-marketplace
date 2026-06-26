/** Top Rated: rating_avg >= 4.5 and at least 3 reviews. */
export function isTopRatedProvider(ratingAvg: number, reviewCount: number): boolean {
  return Number(ratingAvg) >= 4.5 && Number(reviewCount) >= 3;
}

/** New provider: fewer than 2 reviews. */
export function isNewProvider(reviewCount: number): boolean {
  return Number(reviewCount) < 2;
}
