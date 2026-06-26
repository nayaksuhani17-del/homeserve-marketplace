import { NO_REVIEWS_LABEL, roundRatingAverage } from "@/lib/ratings";

type StarRatingProps = {
  rating: number;
  size?: "sm" | "md";
  /** Show numeric average in parentheses, e.g. (4.7) */
  showNumeric?: boolean;
  /** When true and rating is 0, show "No reviews yet" (for standalone use). */
  showEmptyLabel?: boolean;
};

export function StarRating({
  rating,
  size = "md",
  showNumeric = true,
  showEmptyLabel = false,
}: StarRatingProps) {
  const stars = 5;
  const safeRating = Number.isFinite(rating) ? Math.min(5, Math.max(0, rating)) : 0;
  const filled = Math.floor(safeRating);
  const textSize = size === "sm" ? "text-sm" : "text-base";

  if (safeRating <= 0) {
    if (showEmptyLabel) {
      return <span className={`text-gray-500 ${textSize}`}>{NO_REVIEWS_LABEL}</span>;
    }
    return (
      <span className={`flex items-center gap-0.5 ${textSize}`} aria-label="No rating">
        {Array.from({ length: stars }).map((_, i) => (
          <span key={i} className="text-gray-300" aria-hidden>
            ☆
          </span>
        ))}
      </span>
    );
  }

  const display = roundRatingAverage(safeRating);

  return (
    <div className={`flex items-center gap-1 ${textSize}`}>
      <span aria-label={`${display.toFixed(1)} out of 5 stars`} className="inline-flex">
        {Array.from({ length: stars }).map((_, i) => (
          <span
            key={i}
            className={i < filled ? "text-[#FACC15]" : "text-gray-300"}
            aria-hidden
          >
            {i < filled ? "★" : "☆"}
          </span>
        ))}
      </span>
      {showNumeric && (
        <span className="text-gray-600">({display.toFixed(1)})</span>
      )}
    </div>
  );
}
