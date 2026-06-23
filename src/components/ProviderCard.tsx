"use client";

import { useState } from "react";
import Link from "next/link";
import { StarRating } from "./StarRating";
import { HireModal } from "./HireModal";
import { TagBadge } from "./ChatProviderCard";
import { computeProviderTags, getProviderUser } from "@/lib/providers";
import type { ProviderWithUser } from "@/lib/types";

type ProviderCardProps = {
  provider: ProviderWithUser;
  showHire?: boolean;
  selectedService?: string;
  isTopRated?: boolean;
  rank?: number;
};

export function ProviderCard({
  provider,
  showHire = true,
  selectedService,
  isTopRated,
  rank,
}: ProviderCardProps) {
  const [hireOpen, setHireOpen] = useState(false);
  const defaultService = selectedService || provider.services[0] || "General";
  const user = getProviderUser(provider);
  const tags = computeProviderTags(provider);

  return (
    <>
      <article
        className={`card card-hover flex flex-col p-5 ${
          isTopRated ? "ring-2 ring-green-200 ring-offset-2" : ""
        }`}
      >
        {isTopRated && rank && (
          <div className="mb-3 flex items-center gap-2">
            <span className="badge-tag bg-green-600 font-semibold text-white">
              #{rank} Top Rated
            </span>
          </div>
        )}

        <div className="mb-3 flex items-start gap-3">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt=""
              className="h-14 w-14 shrink-0 rounded-2xl object-cover ring-2 ring-gray-100"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-xl font-semibold text-green-700">
              {(user?.name ?? "P").charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {user?.name ?? "Provider"}
                </h3>
                <p className="text-sm text-gray-500">{provider.location || "Local area"}</p>
                {provider.distance_miles != null && (
                  <p className="text-xs font-medium text-green-600">
                    {Number(provider.distance_miles).toFixed(1)} miles away
                  </p>
                )}
              </div>
              {provider.approved && (
                <span className="badge-verified shrink-0">Verified</span>
              )}
            </div>
          </div>
        </div>

        <StarRating rating={Number(provider.rating_avg)} size="sm" />

        <div className="mt-2 flex flex-wrap gap-1">
          {tags.map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>

        <p className="mt-3 line-clamp-2 text-sm text-gray-600">
          {provider.description || "Professional house services provider."}
        </p>

        <div className="mt-3 flex flex-wrap gap-1">
          {provider.services.slice(0, 3).map((service) => (
            <span key={service} className="badge-tag">
              {service}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-gray-200 pt-4">
          <div>
            <p className="text-xl font-bold text-gray-900">
              ${Number(provider.hourly_rate).toFixed(0)}
              <span className="text-sm font-normal text-gray-500">/hr</span>
            </p>
            {provider.jobs_completed != null && (
              <p className="text-xs text-gray-400">{provider.jobs_completed} jobs done</p>
            )}
          </div>
          <div className="flex gap-2">
            <Link href={`/provider/${provider.id}`} className="btn-secondary px-3 py-1.5">
              View
            </Link>
            {showHire && (
              <button type="button" onClick={() => setHireOpen(true)} className="btn-primary px-3 py-1.5">
                Hire
              </button>
            )}
          </div>
        </div>
      </article>

      <HireModal
        open={hireOpen}
        onClose={() => setHireOpen(false)}
        providerId={provider.id}
        providerName={user?.name ?? "Provider"}
        hourlyRate={Number(provider.hourly_rate)}
        defaultService={defaultService}
      />
    </>
  );
}
