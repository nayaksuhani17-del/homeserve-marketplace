"use client";

import { useState } from "react";
import Link from "next/link";
import { StarRating } from "@/components/StarRating";
import { TagBadge } from "@/components/ChatProviderCard";
import { HireModal } from "@/components/HireModal";
import { ProviderAISummary, ReviewInsightsPanel } from "@/components/ProviderAIInsights";
import { ReviewForm } from "@/components/ReviewForm";
import { computeProviderTags } from "@/lib/providers";

type ProviderProfileClientProps = {
  provider: {
    id: string;
    services: string[];
    hourly_rate: number;
    location: string;
    description: string;
    availability: string;
    rating_avg: number;
    approved: boolean;
    distance_miles?: number | null;
    jobs_completed?: number | null;
    years_experience?: number | null;
    available_today?: boolean | null;
    available_tomorrow?: boolean | null;
    tags?: string[] | null;
    users?: { name?: string; avatar_url?: string | null } | { name?: string; avatar_url?: string | null }[];
  };
  reviews: Array<{
    rating: number;
    comment: string;
    created_at?: string;
    users?: { name?: string } | { name?: string }[] | null;
  }>;
  defaultService: string;
  isLoggedIn: boolean;
};

export function ProviderProfileClient({
  provider,
  reviews,
  defaultService,
  isLoggedIn,
}: ProviderProfileClientProps) {
  const [hireOpen, setHireOpen] = useState(false);
  const user = Array.isArray(provider.users) ? provider.users[0] : provider.users;
  const tags = computeProviderTags(provider as Parameters<typeof computeProviderTags>[0]);

  return (
    <>
      <article className="card p-8">
        <div className="flex flex-wrap items-start gap-5">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt=""
              className="h-24 w-24 rounded-2xl object-cover ring-2 ring-gray-100"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-green-100 text-3xl font-bold text-green-700">
              {(user?.name ?? "P").charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{user?.name ?? "Provider"}</h1>
                <p className="mt-1 text-gray-500">{provider.location}</p>
                {provider.distance_miles != null && (
                  <p className="mt-1 text-sm font-medium text-green-600">
                    {Number(provider.distance_miles).toFixed(1)} miles away
                  </p>
                )}
              </div>
              {provider.approved && (
                <span className="badge-verified px-3 py-1 text-sm">✓ Verified</span>
              )}
            </div>
            <div className="mt-3">
              <StarRating rating={Number(provider.rating_avg)} />
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.map((tag) => (
                <TagBadge key={tag} tag={tag} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-gray-50 p-4 text-center ring-1 ring-gray-100">
            <p className="text-2xl font-bold text-gray-900">${Number(provider.hourly_rate).toFixed(0)}</p>
            <p className="text-xs text-gray-500">per hour</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4 text-center ring-1 ring-gray-100">
            <p className="text-2xl font-bold text-gray-900">{provider.jobs_completed ?? "—"}</p>
            <p className="text-xs text-gray-500">jobs completed</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4 text-center ring-1 ring-gray-100">
            <p className="text-2xl font-bold text-gray-900">{provider.years_experience ?? "—"}+</p>
            <p className="text-xs text-gray-500">years experience</p>
          </div>
        </div>

        <div className="mt-6">
          <ProviderAISummary providerId={provider.id} />
        </div>

        <div className="mt-6">
          <h2 className="font-semibold text-gray-900">Services</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {provider.services.map((service) => (
              <span key={service} className="badge-tag">
                {service}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <h2 className="font-semibold text-gray-900">About</h2>
          <p className="mt-2 text-gray-600">{provider.description}</p>
        </div>

        <div className="mt-6">
          <h2 className="font-semibold text-gray-900">Availability</h2>
          <p className="mt-2 text-gray-600">{provider.availability}</p>
          {(provider.available_today || provider.available_tomorrow) && (
            <p className="mt-2 text-sm font-medium text-green-600">
              {provider.available_today && "Available today"}
              {provider.available_today && provider.available_tomorrow && " · "}
              {provider.available_tomorrow && "Available tomorrow"}
            </p>
          )}
        </div>

        {provider.approved && isLoggedIn ? (
          <button type="button" onClick={() => setHireOpen(true)} className="btn-primary mt-8">
            Hire Now
          </button>
        ) : !provider.approved ? (
          <p className="mt-8 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            This provider is not yet approved and cannot be booked.
          </p>
        ) : (
          <Link
            href={`/login?redirect=/provider/${provider.id}?service=${encodeURIComponent(defaultService)}&hire=1`}
            className="btn-primary mt-8 inline-block"
          >
            Log in to Hire
          </Link>
        )}
      </article>

      {reviews.length > 0 && (
        <>
          <div className="mt-8">
            <ReviewInsightsPanel providerId={provider.id} />
          </div>
          <section className="mt-8">
            <h2 className="text-xl font-bold text-gray-900">Reviews ({reviews.length})</h2>
            <div className="mt-4 space-y-3">
              {reviews.map((review, i) => {
                const reviewUser = Array.isArray(review.users) ? review.users[0] : review.users;
                return (
                  <div key={i} className="card bg-white p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">{reviewUser?.name ?? "Customer"}</p>
                      <StarRating rating={review.rating} size="sm" />
                    </div>
                    {review.comment && (
                      <p className="mt-2 text-sm text-gray-600">{review.comment}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {isLoggedIn && provider.approved && (
        <div className="mt-8">
          <ReviewForm providerId={provider.id} />
        </div>
      )}

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
