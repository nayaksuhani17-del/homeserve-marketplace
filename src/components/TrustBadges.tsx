"use client";

import { computeTrustBadges } from "@/lib/trust";
import { TRUST_BADGE_CONFIG } from "@/lib/trust";
import type { ProviderWithUser } from "@/lib/types";

export function TrustBadges({
  provider,
  compact,
}: {
  provider: ProviderWithUser;
  compact?: boolean;
}) {
  const badges = computeTrustBadges(provider);

  return (
    <div className={`flex flex-wrap gap-1 ${compact ? "" : "mt-1"}`}>
      {badges.map((key) => {
        const cfg = TRUST_BADGE_CONFIG[key];
        return (
          <span
            key={key}
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold sm:text-xs ${
              key === "verified" ? cfg.className : `tag-pill ${cfg.className}`
            }`}
          >
            <span aria-hidden>{cfg.icon}</span>
            {key === "verified" ? `${cfg.label} ✅` : cfg.label}
          </span>
        );
      })}
    </div>
  );
}
