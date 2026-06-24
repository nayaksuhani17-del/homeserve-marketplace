"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { StarRating } from "./StarRating";
import { TagBadge } from "./ChatProviderCard";
import { RecommendationBadge } from "./RecommendationBadge";
import { TrustBadges } from "./TrustBadges";
import { FavoriteButton } from "./FavoriteButton";
import { computeProviderTags, getProviderUser } from "@/lib/providers";
import { formatProviderPriceAmount } from "@/lib/pricing";
import { formatResponseTime, type RecommendationLabel } from "@/lib/recommendations";
import { getViewerCount } from "@/lib/trust";
import { getServiceMeta } from "@/lib/services";
import { useMockApp } from "@/context/MockAppContext";
import type { ProviderWithUser } from "@/lib/types";

const HireModal = dynamic(
  () => import("./HireModal").then((m) => m.HireModal),
  { ssr: false }
);

const DirectMessageModal = dynamic(
  () => import("./DirectMessagePanel").then((m) => m.DirectMessageModal),
  { ssr: false }
);

const QuoteModal = dynamic(
  () => import("./QuoteModal").then((m) => m.QuoteModal),
  { ssr: false }
);

type ProviderCardProps = {
  provider: ProviderWithUser;
  showHire?: boolean;
  selectedService?: string;
  isTopRated?: boolean;
  rank?: number;
  recommendationLabel?: RecommendationLabel;
  isBestMatch?: boolean;
};

export function ProviderCard({
  provider,
  showHire = true,
  selectedService,
  isTopRated,
  rank,
  recommendationLabel,
  isBestMatch,
}: ProviderCardProps) {
  const { trackProviderClick, user: sessionUser } = useMockApp();
  const [hireOpen, setHireOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [viewers] = useState(() => getViewerCount(provider.id));

  const defaultService = selectedService || provider.services[0] || "General";
  const providerUser = getProviderUser(provider);
  const tags = computeProviderTags(provider);
  const responseLabel = formatResponseTime(provider.response_time_mins);
  const reviewCount = provider.review_count ?? Math.floor((provider.jobs_completed ?? 20) / 8);
  const hireCount = provider.jobs_completed ?? 0;
  const priceDisplay = formatProviderPriceAmount(
    provider.pricing_type,
    Number(provider.price)
  );
  const serviceIcon = getServiceMeta(provider.services[0] ?? "").icon;

  return (
    <>
      <article
        className={`card card-hover group relative flex flex-col overflow-hidden p-0 transition-all duration-300 ${
          isBestMatch
            ? "ring-2 ring-green-500 ring-offset-2 shadow-md shadow-green-100"
            : isTopRated
              ? "ring-2 ring-green-200 ring-offset-2"
              : ""
        }`}
      >
        {/* Cover banner */}
        <div className="relative h-24 bg-gradient-to-br from-green-600 via-green-500 to-emerald-400">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_50%)]" />
          <span className="absolute bottom-3 left-4 text-4xl opacity-90" aria-hidden>
            {serviceIcon}
          </span>
          <div className="absolute right-3 top-3 z-10">
            <FavoriteButton providerId={provider.id} providerName={providerUser?.name ?? "Provider"} />
          </div>
        </div>

        <div className="relative flex flex-1 flex-col p-5 pt-0">
          <div className="-mt-8 mb-3 flex items-end gap-3">
            {providerUser?.avatar_url ? (
              <Image
                src={providerUser.avatar_url}
                alt=""
                width={64}
                height={64}
                className="h-16 w-16 shrink-0 rounded-2xl border-4 border-white object-cover shadow-md transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-green-100 text-xl font-semibold text-green-700 shadow-md">
                {(providerUser?.name ?? "P").charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1 pb-1">
              <h3 className="truncate text-lg font-semibold text-gray-900 transition-colors group-hover:text-green-700">
                {providerUser?.name ?? "Provider"}
              </h3>
              {provider.distance_miles != null && (
                <p className="text-xs font-medium text-green-600">
                  {Number(provider.distance_miles).toFixed(1)} miles away
                </p>
              )}
            </div>
          </div>

        {(recommendationLabel || (isTopRated && rank)) && (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {recommendationLabel && <RecommendationBadge label={recommendationLabel} />}
            {isTopRated && rank && !recommendationLabel && (
              <span className="badge-tag bg-green-600 font-semibold text-white">
                #{rank} Top Rated
              </span>
            )}
            {isBestMatch && (
              <span className="animate-fade-in badge-tag bg-emerald-600 font-semibold text-white">
                ✨ Best Match
              </span>
            )}
          </div>
        )}

        <div className="mb-2 flex items-center gap-2 text-xs text-amber-700">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
          </span>
          {viewers} {viewers === 1 ? "person is" : "people are"} viewing this pro
        </div>

        <p className="truncate text-sm text-gray-500">{provider.location || "Local area"}</p>
        <TrustBadges provider={provider} compact />

        <StarRating rating={Number(provider.rating_avg)} size="sm" />
        <p className="mt-1 text-xs text-gray-500">
          {reviewCount} reviews · {hireCount} people hired
        </p>
        <p className="mt-0.5 text-xs font-medium text-green-600">{responseLabel}</p>

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
            <span key={service} className="badge-tag inline-flex items-center gap-1">
              <span aria-hidden>{getServiceMeta(service).icon}</span>
              {service}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-end justify-between border-t border-gray-200 pt-4">
          <div>
            <p className="text-xs text-gray-400">{serviceIcon} Smart estimate available</p>
            <p className="text-xl font-bold text-gray-900">
              {priceDisplay.main}
              {priceDisplay.suffix && (
                <span className="text-sm font-normal text-gray-500">{priceDisplay.suffix}</span>
              )}
            </p>
            {provider.jobs_completed != null && (
              <p className="text-xs text-gray-400">{provider.jobs_completed} jobs done</p>
            )}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Link
              href={`/provider/${provider.id}`}
              onClick={() => trackProviderClick(provider.id)}
              className="btn-secondary px-3 py-1.5"
            >
              View Profile
            </Link>
            {sessionUser && provider.user_id && sessionUser.id !== provider.user_id && (
              <button
                type="button"
                onClick={() => setMessageOpen(true)}
                className="btn-secondary px-3 py-1.5"
              >
                Message
              </button>
            )}
            {showHire && provider.approved && (
              <>
                <button
                  type="button"
                  onClick={() => setQuoteOpen(true)}
                  className="btn-secondary px-3 py-1.5"
                >
                  Get Quote
                </button>
                <button
                  type="button"
                  onClick={() => setHireOpen(true)}
                  className="btn-primary px-3 py-1.5"
                >
                  Hire
                </button>
              </>
            )}
          </div>
        </div>
        </div>
      </article>

      <QuoteModal
        open={quoteOpen}
        onClose={() => setQuoteOpen(false)}
        providerName={providerUser?.name ?? "Provider"}
        profile={{
          pricingType: provider.pricing_type,
          price: Number(provider.price),
          basePrice: Number(provider.base_price ?? 0),
          hourlyRate: Number(provider.hourly_rate ?? provider.price),
          services: provider.services,
          servicePackages: provider.service_packages,
        }}
        defaultService={defaultService}
      />

      <HireModal
        open={hireOpen}
        onClose={() => setHireOpen(false)}
        providerId={provider.id}
        providerName={providerUser?.name ?? "Provider"}
        pricingType={provider.pricing_type}
        price={Number(provider.price)}
        basePrice={Number(provider.base_price ?? 0)}
        hourlyRate={Number(provider.hourly_rate ?? provider.price)}
        availableToday={Boolean(provider.available_today)}
        defaultService={defaultService}
      />

      {provider.user_id && (
        <DirectMessageModal
          open={messageOpen}
          onClose={() => setMessageOpen(false)}
          otherUserId={provider.user_id}
          otherUserName={providerUser?.name ?? "Provider"}
        />
      )}
    </>
  );
}
