"use client";

import { isNewProvider, isTopRatedProvider } from "@/lib/provider-badges";
import { isProviderVerified } from "@/lib/provider-verification";

type ProviderStatusBadgesProps = {
  ratingAvg: number;
  reviewCount: number;
  verified?: boolean;
  approved?: boolean;
  className?: string;
  size?: "sm" | "md";
};

/** Top Rated / New Provider badges (verification shown on provider name). */
export function ProviderStatusBadges({
  ratingAvg,
  reviewCount,
  verified,
  approved = false,
  className = "",
  size = "sm",
}: ProviderStatusBadgesProps) {
  const isVerified = isProviderVerified({ verified: verified ?? approved });
  const topRated = isVerified && isTopRatedProvider(ratingAvg, reviewCount);
  const isNew = isNewProvider(reviewCount);
  const pad = size === "md" ? "px-3 py-1 text-sm" : "px-2.5 py-0.5 text-[10px] sm:text-xs";

  if (!topRated && !isNew) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`.trim()}>
      {topRated && (
        <span className={`badge-top-rated inline-flex items-center gap-0.5 font-semibold ${pad}`}>
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
