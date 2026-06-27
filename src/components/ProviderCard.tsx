"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { StarRating } from "./StarRating";
import { ProviderRatingDisplay } from "./ProviderRatingDisplay";
import { RecommendationBadge } from "./RecommendationBadge";
import { TrustBadges } from "./TrustBadges";
import { ProviderStatusBadges } from "./ProviderStatusBadges";
import { resolveProviderRating } from "@/lib/ratings";
import { ProviderNameWithVerification } from "./ProviderVerifiedBadge";
import { FavoriteButton } from "./FavoriteButton";
import { getProviderUser } from "@/lib/providers";
import * as pricing from "@/lib/pricing";
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
  const router = useRouter();
  const { trackProviderClick, user: sessionUser, db } = useMockApp();
  const [hireOpen, setHireOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [viewers] = useState(() => getViewerCount(provider.id));

  const defaultService = selectedService || provider.services[0] || "General";
  const providerUser = getProviderUser(provider);
  const responseLabel = formatResponseTime(provider.response_time_mins);
  const liveProvider = db?.providers.find((p) => p.id === provider.id);
  const { ratingAvg, reviewCount } = resolveProviderRating(liveProvider, {
    ratingAvg: Number(provider.rating_avg),
    reviewCount: Number(provider.review_count ?? 0),
  });
  const verified = liveProvider?.verified === true;
  const priceDisplay = pricing.formatProviderPriceAmount(
    provider.pricing_type,
    Number(provider.price)
  );
  const serviceIcon = getServiceMeta(provider.services[0] ?? "").icon;
  const profileHref = `/provider/${provider.id}?service=${encodeURIComponent(defaultService)}`;

  function openProfile() {
    trackProviderClick(provider.id);
    router.push(profileHref);
  }

  return (
    <>
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
        className={`card card-hover group relative flex cursor-pointer flex-col overflow-hidden p-0 outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${
          isBestMatch
            ? "ring-2 ring-green-500 ring-offset-2"
            : isTopRated
              ? "ring-1 ring-green-200"
              : ""
        }`}
      >
        <div className="relative h-20 bg-gradient-to-br from-green-700 to-green-500">
          <span className="absolute bottom-3 left-4 text-4xl opacity-90" aria-hidden>
            {serviceIcon}
          </span>
          <div className="absolute right-3 top-3 z-10">
            <FavoriteButton providerId={provider.id} providerName={providerUser?.name ?? "Provider"} />
          </div>
        </div>

        <div className="relative flex flex-1 flex-col p-4 pt-0">
          <div className="-mt-7 mb-2 flex items-end gap-3">
            {providerUser?.avatar_url ? (
              <Image
                src={providerUser.avatar_url}
                alt=""
                width={64}
                height={64}
                className="h-14 w-14 shrink-0 rounded-xl border-2 border-white object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 border-white bg-green-100 text-lg font-semibold text-green-700 shadow-sm">
                {(providerUser?.name ?? "P").charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1 pb-1">
              <ProviderNameWithVerification
                name={providerUser?.name ?? "Provider"}
                verified={verified}
                nameClassName="truncate font-semibold text-gray-900 group-hover:text-green-700"
                className="min-w-0"
              />
              {provider.distance_miles != null && (
                <p className="text-xs font-medium text-green-600">
                  {Number(provider.distance_miles).toFixed(1)} miles away
                </p>
              )}
            </div>
          </div>

        {(recommendationLabel || isBestMatch || (isTopRated && rank)) && (
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            {recommendationLabel && <RecommendationBadge label={recommendationLabel} />}
            {isTopRated && rank && !recommendationLabel && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-800">
                #{rank} rated
              </span>
            )}
            {isBestMatch && (
              <span className="rounded-full bg-green-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                Best match
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <ProviderRatingDisplay ratingAvg={ratingAvg} reviewCount={reviewCount} size="sm" />
          <ProviderStatusBadges
            ratingAvg={ratingAvg}
            reviewCount={reviewCount}
            verified={verified}
          />
          <span className="text-gray-400">·</span>
          <span className="text-xs text-green-600">{responseLabel}</span>
        </div>

        <p className="mt-1 text-xs text-gray-400">
          {provider.location || "Local area"}
          {provider.distance_miles != null && ` · ${Number(provider.distance_miles).toFixed(1)} mi`}
          {" · ~"}
          {viewers} recent views
        </p>

        <TrustBadges provider={provider} compact />

        <p className="mt-2 line-clamp-2 text-sm text-gray-600">
          {provider.description || "Professional house services provider."}
        </p>

        <p className="mt-2 text-xs text-gray-500">
          {provider.services.slice(0, 2).join(" · ")}
          {provider.services.length > 2 ? ` +${provider.services.length - 2} more` : ""}
        </p>

        <div className="mt-auto border-t border-gray-100 pt-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-lg font-bold text-gray-900">
                {priceDisplay.main}
                {priceDisplay.suffix && (
                  <span className="text-sm font-normal text-gray-500">{priceDisplay.suffix}</span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-1.5">
              <Link
                href={profileHref}
                onClick={(e) => {
                  e.stopPropagation();
                  trackProviderClick(provider.id);
                }}
                className="btn-secondary px-3 py-1.5 text-xs"
              >
                View Profile
              </Link>
              {sessionUser &&
                provider.user_id &&
                sessionUser.id !== provider.user_id &&
                db?.users.some((u) => u.id === provider.user_id) && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMessageOpen(true);
                  }}
                  className="btn-secondary px-3 py-1.5 text-xs"
                >
                  Message
                </button>
              )}
              {showHire && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuoteOpen(true);
                    }}
                    className="btn-ghost px-2 py-1.5 text-xs ring-1 ring-gray-200"
                  >
                    Quote
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setHireOpen(true);
                    }}
                    className="btn-primary px-3 py-1.5 text-xs"
                  >
                    Hire
                  </button>
                </>
              )}
            </div>
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
