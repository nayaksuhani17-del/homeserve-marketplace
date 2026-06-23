type StarRatingProps = {
  rating: number;
  size?: "sm" | "md";
};

export function StarRating({ rating, size = "md" }: StarRatingProps) {
  const stars = 5;
  const safeRating = Number.isFinite(rating) ? Math.min(5, Math.max(0, rating)) : 0;
  const filled = Math.round(safeRating);
  const textSize = size === "sm" ? "text-sm" : "text-base";

  if (safeRating <= 0) {
    return (
      <span className={`text-gray-400 ${textSize}`}>No ratings yet</span>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${textSize}`}>
      <span aria-label={`${safeRating.toFixed(1)} out of 5 stars`}>
        {Array.from({ length: stars }).map((_, i) => (
          <span key={i} className={i < filled ? "text-[#FACC15]" : "text-gray-300"}>
            ⭐
          </span>
        ))}
      </span>
      <span className="text-gray-500">({safeRating.toFixed(1)})</span>
    </div>
  );
}
