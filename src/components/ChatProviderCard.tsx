"use client";

import Link from "next/link";
import { StarRating } from "./StarRating";
import { RecommendationBadge } from "./RecommendationBadge";
import type { ProviderCardData } from "@/lib/providers";
import { formatResponseTime } from "@/lib/recommendations";

export function ChatProviderCard({ provider, compact }: { provider: ProviderCardData; compact?: boolean }) {
  const service = provider.services[0] ?? "General";
  const responseLabel =
    provider.responseTimeLabel ??
    formatResponseTime(undefined);

  return (
    <Link
      href={`/provider/${provider.id}?service=${encodeURIComponent(service)}&hire=1`}
      className="card card-hover block bg-white p-4"
    >
      <div className="flex gap-3">
        {provider.avatarUrl ? (
          <img
            src={provider.avatarUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">
            {provider.name.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 truncate font-semibold text-gray-900">{provider.name}</p>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {provider.recommendationLabel && (
                <RecommendationBadge label={provider.recommendationLabel} />
              )}
              {provider.approved ? (
                <span className="badge-verified">Verified</span>
              ) : (
                <span className="badge-pending">Pending</span>
              )}
            </div>
          </div>
          <StarRating rating={provider.rating} size="sm" />
          <p className="mt-0.5 text-xs text-gray-500">
            {provider.services[0]}
            {provider.distanceMiles != null && ` · ${provider.distanceMiles.toFixed(1)} mi`}
            {provider.reviewCount != null && ` · ${provider.reviewCount} reviews`}
          </p>
          <p className="mt-0.5 text-xs font-medium text-green-600">{responseLabel}</p>
          {provider.tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {provider.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="badge-tag text-[10px]">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="font-bold text-green-700">${provider.hourlyRate}/hr</span>
            {provider.jobsCompleted != null && (
              <span className="text-[10px] text-gray-400">
                {provider.jobsCompleted} hires
              </span>
            )}
            {!compact && (
              <span className="text-xs text-gray-400 line-clamp-1">{provider.location}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function TagBadge({ tag }: { tag: string }) {
  return <span className="badge-tag">{tag}</span>;
}
