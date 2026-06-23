type StarRatingProps = {
  rating: number;
  size?: "sm" | "md";
};

export function StarRating({ rating, size = "md" }: StarRatingProps) {
  const stars = 5;
  const filled = Math.round(rating);
  const textSize = size === "sm" ? "text-sm" : "text-base";

  return (
    <div className={`flex items-center gap-1 ${textSize}`}>
      <span aria-label={`${rating.toFixed(1)} out of 5 stars`}>
        {Array.from({ length: stars }).map((_, i) => (
          <span key={i} className={i < filled ? "text-[#FACC15]" : "text-gray-300"}>
            ⭐
          </span>
        ))}
      </span>
      <span className="text-gray-500">({rating.toFixed(1)})</span>
    </div>
  );
}
