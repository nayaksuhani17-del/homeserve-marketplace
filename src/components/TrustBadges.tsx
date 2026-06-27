"use client";

import { ProviderStatusBadges } from "@/components/ProviderStatusBadges";
import { computeExtraTrustBadges, TRUST_BADGE_CONFIG } from "@/lib/trust";
import type { ProviderWithUser } from "@/lib/types";

export function TrustBadges({
  provider,
  compact,
}: {
  provider: ProviderWithUser;
  compact?: boolean;
}) {
  const rating = Number(provider.rating_avg);
  const reviews = Number(provider.review_count ?? 0);
  const extra = computeExtraTrustBadges(provider);

  return (
    <div className={`flex flex-col gap-1 ${compact ? "" : "mt-1"}`}>
      <ProviderStatusBadges
        ratingAvg={rating}
        reviewCount={reviews}
        verified={provider.verified === true}
        size={compact ? "sm" : "sm"}
      />
      {extra.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {extra.map((key) => {
            const cfg = TRUST_BADGE_CONFIG[key];
            return (
              <span
                key={key}
                className={`tag-pill inline-flex items-center gap-0.5 text-[10px] font-semibold sm:text-xs ${cfg.className}`}
              >
                <span aria-hidden>{cfg.icon}</span>
                {cfg.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
