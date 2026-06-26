"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { StarRating } from "@/components/StarRating";
import { RecommendationBadge } from "@/components/RecommendationBadge";
import { formatProviderPriceAmount } from "@/lib/pricing";
import { formatResponseTime, type RecommendationLabel } from "@/lib/recommendations";
import type { MockProvider } from "@/lib/mock/types";

type AiMatchCardProps = {
  provider: MockProvider;
  rank: number;
  recommendationLabel?: RecommendationLabel;
  selectedService?: string;
  onHire?: (provider: MockProvider) => void;
};

export function AiMatchCard({
  provider,
  rank,
  recommendationLabel,
  selectedService,
  onHire,
}: AiMatchCardProps) {
  const router = useRouter();
  const service = selectedService || provider.services[0] || "General";
  const profileHref = `/provider/${provider.id}?service=${encodeURIComponent(service)}`;
  const price = formatProviderPriceAmount(provider.pricingType, provider.price);
  const responseLabel = formatResponseTime(provider.responseTimeMins);
  const showFast = provider.tags?.includes("Fast Responder") || provider.availableToday;

  function openProfile() {
    router.push(profileHref);
  }

  return (
    <article
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button, a")) return;
        openProfile();
      }}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        if ((e.target as HTMLElement).closest("button, a")) return;
        e.preventDefault();
        openProfile();
      }}
      role="link"
      tabIndex={0}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm outline-none transition-all duration-300 hover:-translate-y-0.5 hover:border-green-200 hover:shadow-lg hover:shadow-green-100/50 focus-visible:ring-2 focus-visible:ring-green-500"
    >
      <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-green-600 via-emerald-500 to-green-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3">
          {provider.avatarUrl ? (
            <Image
              src={provider.avatarUrl}
              alt=""
              width={48}
              height={48}
              className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-600 to-emerald-500 text-sm font-bold text-white shadow-sm">
              {provider.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                #{rank}
              </span>
              {recommendationLabel && (
                <RecommendationBadge label={recommendationLabel} />
              )}
              <span className="badge-verified">Verified</span>
            </div>
            <h4 className="mt-1.5 truncate text-base font-semibold text-gray-900">
              {provider.name}
            </h4>
            <StarRating rating={provider.ratingAvg} size="sm" />
            <p className="mt-1 text-xs text-gray-500">
              {provider.reviewCount} reviews · {provider.distanceMiles?.toFixed(1)} mi
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {showFast && (
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800 ring-1 ring-emerald-100">
              Fast Responder
            </span>
          )}
          {provider.tags?.slice(0, 2).map((tag) =>
            tag === "Fast Responder" ? null : (
              <span
                key={tag}
                className="rounded-full bg-gray-50 px-2.5 py-0.5 text-[11px] font-medium text-gray-600 ring-1 ring-gray-100"
              >
                {tag}
              </span>
            )
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div>
            <p className="text-lg font-bold text-green-700">
              {price.main}
              {price.suffix && (
                <span className="text-sm font-normal text-gray-500">{price.suffix}</span>
              )}
            </p>
            <p className="text-[11px] text-gray-500">{responseLabel}</p>
          </div>
          <div className="flex flex-wrap justify-end gap-1.5">
            <Link
              href={profileHref}
              onClick={(e) => e.stopPropagation()}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50"
            >
              View Profile
            </Link>
            {onHire ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onHire(provider);
                }}
                className="rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-green-700 hover:shadow-md active:scale-[0.98]"
              >
                Hire
              </button>
            ) : (
              <Link
                href={profileHref}
                onClick={(e) => e.stopPropagation()}
                className="rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-green-700 hover:shadow-md active:scale-[0.98]"
              >
                Hire
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
