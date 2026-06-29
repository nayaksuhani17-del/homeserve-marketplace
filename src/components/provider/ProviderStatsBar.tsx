import { NO_REVIEWS_LABEL } from "@/lib/ratings";
import { getResponseSpeedLabel } from "@/lib/provider/dashboard-stats";
import type { ResponseSpeed } from "@/lib/mock/types";

type ProviderStatsBarProps = {
  earningsTotal: number;
  earningsPulse?: boolean;
  jobsCompleted: number;
  ratingAvg: number;
  reviewCount: number;
  upcomingCount: number;
  pendingCount: number;
  responseSpeed?: ResponseSpeed;
  responseTimeMins?: number;
};

function StatDivider() {
  return (
    <span className="hidden text-gray-300 sm:inline" aria-hidden>
      ·
    </span>
  );
}

export function ProviderStatsBar({
  earningsTotal,
  earningsPulse,
  jobsCompleted,
  ratingAvg,
  reviewCount,
  upcomingCount,
  pendingCount,
  responseSpeed,
  responseTimeMins,
}: ProviderStatsBarProps) {
  const responseLabel = getResponseSpeedLabel(responseSpeed, responseTimeMins);
  const responseMins = responseTimeMins ?? 30;

  const ratingDisplay =
    reviewCount > 0 ? ratingAvg.toFixed(1) : NO_REVIEWS_LABEL;
  const ratingTitle =
    reviewCount > 0 ? `${ratingAvg.toFixed(1)} avg · ${reviewCount} reviews` : undefined;

  return (
    <section
      className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2 text-xs text-gray-500 sm:gap-x-4 sm:px-4 sm:py-2.5 sm:text-sm"
      aria-label="Provider summary stats"
    >
      <span
        className={`inline-flex items-center gap-1.5 transition-colors duration-500 ${
          earningsPulse ? "font-semibold text-green-700" : ""
        }`}
        title="Total earnings"
      >
        <span aria-hidden>💰</span>
        <span className="font-medium text-gray-700">${earningsTotal.toLocaleString()}</span>
      </span>

      <StatDivider />

      <span className="inline-flex items-center gap-1.5" title="Jobs completed">
        <span aria-hidden>✅</span>
        <span className="font-medium text-gray-700">{jobsCompleted} jobs</span>
      </span>

      <StatDivider />

      <span className="inline-flex items-center gap-1.5" title={ratingTitle}>
        <span aria-hidden>⭐</span>
        <span className="font-medium text-gray-700">{ratingDisplay}</span>
        {reviewCount > 0 && (
          <span className="text-gray-400">({reviewCount})</span>
        )}
      </span>

      <StatDivider />

      <span className="inline-flex items-center gap-1.5" title="Upcoming confirmed jobs">
        <span aria-hidden>📅</span>
        <span className="font-medium text-gray-700">{upcomingCount} upcoming</span>
        {pendingCount > 0 && (
          <span className="text-amber-600">
            · {pendingCount} new
          </span>
        )}
      </span>

      <StatDivider />

      <span
        className="inline-flex items-center gap-1.5"
        title={`Response speed · ~${responseMins} min avg`}
      >
        <span aria-hidden>⚡</span>
        <span className="font-medium text-gray-700">
          {responseLabel} (~{responseMins} min)
        </span>
      </span>
    </section>
  );
}
