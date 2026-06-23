"use client";

import Link from "next/link";
import { StarRating } from "./StarRating";
import type { ProviderCardData } from "@/lib/providers";

export function ChatProviderCard({ provider, compact }: { provider: ProviderCardData; compact?: boolean }) {
  const service = provider.services[0] ?? "General";

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
            className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">
            {provider.name.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-gray-900">{provider.name}</p>
            {provider.approved && (
              <span className="badge-verified shrink-0">Verified</span>
            )}
          </div>
          <StarRating rating={provider.rating} size="sm" />
          {!compact && (
            <p className="mt-1 line-clamp-1 text-xs text-gray-500">{provider.location}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="font-bold text-green-700">${provider.hourlyRate}/hr</span>
            {provider.distanceMiles != null && (
              <span className="text-xs text-gray-400">
                {provider.distanceMiles.toFixed(1)} mi
              </span>
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
