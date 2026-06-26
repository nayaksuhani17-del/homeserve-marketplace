"use client";

import { isNewProvider, isTopRatedProvider } from "@/lib/provider-badges";

type ProviderStatusBadgesProps = {
  ratingAvg: number;
  reviewCount: number;
  approved?: boolean;
  className?: string;
  size?: "sm" | "md";
};

export function ProviderStatusBadges({
  ratingAvg,
  reviewCount,
  approved = false,
  className = "",
  size = "sm",
}: ProviderStatusBadgesProps) {
  const topRated = isTopRatedProvider(ratingAvg, reviewCount);
  const isNew = isNewProvider(reviewCount);
  const pad = size === "md" ? "px-3 py-1 text-sm" : "px-2.5 py-0.5 text-[10px] sm:text-xs";

  if (!approved && !topRated && !isNew) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`.trim()}>
      {approved && (
        <span className={`badge-verified inline-flex items-center gap-0.5 font-semibold ${pad}`}>
          Verified <span aria-hidden>✅</span>
        </span>
      )}
      {topRated && (
        <span
          className={`badge-top-rated inline-flex items-center gap-0.5 font-semibold ${pad}`}
        >
          <span aria-hidden>🏆</span> Top Rated
        </span>
      )}
      {isNew && !topRated && (
        <span className={`badge-new inline-flex items-center gap-0.5 font-semibold ${pad}`}>
          New Provider
        </span>
      )}
    </div>
  );
}
