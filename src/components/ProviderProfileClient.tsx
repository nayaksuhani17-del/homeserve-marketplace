"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { StarRating } from "./StarRating";
import { TagBadge } from "./ChatProviderCard";
import { HireModal } from "./HireModal";
import { QuoteModal } from "./QuoteModal";
import { ProviderAISummary, ReviewInsightsPanel, BehavioralInsightsPanel } from "./ProviderAIInsights";
import { TrustBadges } from "./TrustBadges";
import { FavoriteButton } from "./FavoriteButton";
import { getViewerCount } from "@/lib/trust";
import { getServiceMeta } from "@/lib/services";
import { ReviewForm } from "./ReviewForm";
import { ReportProviderModal } from "./ReportProviderModal";
import { DirectMessageModal } from "./DirectMessagePanel";
import { useMockApp } from "@/context/MockAppContext";
import { computeProviderTags } from "@/lib/providers";
import { formatProviderPrice, PRICING_TYPE_LABELS } from "@/lib/pricing";
import type { PricingType } from "@/lib/pricing";
import type { ServicePackage } from "@/lib/quotes";
import { toQuoteProfile } from "@/lib/quotes";
import { formatResponseTime } from "@/lib/recommendations";

type ProviderProfileClientProps = {
  provider: {
    id: string;
    services: string[];
    pricing_type: PricingType;
    price: number;
    base_price?: number;
    hourly_rate?: number;
    service_packages?: ServicePackage[];
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
    response_time_mins?: number | null;
    review_count?: number | null;
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
  autoOpenHire?: boolean;
  quickRebook?: boolean;
};

export function ProviderProfileClient({
  provider,
  reviews,
  defaultService,
  isLoggedIn,
  autoOpenHire,
  quickRebook = false,
}: ProviderProfileClientProps) {
  const [hireOpen, setHireOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const autoHireOpened = useRef(false);
  const {
    user: sessionUser,
    db,
    getBookingsForCustomer,
    getRebookPrefill,
    getAvailabilityHint,
  } = useMockApp();

  useEffect(() => {
    if (
      autoOpenHire &&
      isLoggedIn &&
      provider.approved &&
      !autoHireOpened.current
    ) {
      autoHireOpened.current = true;
      queueMicrotask(() => setHireOpen(true));
    }
  }, [autoOpenHire, isLoggedIn, provider.approved]);

  const user = Array.isArray(provider.users) ? provider.users[0] : provider.users;
  const liveProvider = db?.providers.find((p) => p.id === provider.id);
  const liveReviews = db?.reviews.filter((r) => r.providerId === provider.id) ?? reviews;

  const reviewableBooking =
    sessionUser?.role === "customer"
      ? getBookingsForCustomer(sessionUser.id).find(
          (b) =>
            b.providerId === provider.id &&
            b.status === "completed" &&
            !db?.reviews.some((r) => r.bookingId === b.id)
        )
      : undefined;
  const rebookPrefill = getRebookPrefill(provider.id);
  const availabilityHint = getAvailabilityHint(provider.id);
  const tags = computeProviderTags(provider as Parameters<typeof computeProviderTags>[0]);
  const reviewCount = liveProvider?.reviewCount ?? liveReviews.length;
  const displayRating = liveProvider?.ratingAvg ?? provider.rating_avg ?? 0;
  const responseLabel = formatResponseTime(provider.response_time_mins);
  const priceDisplay = formatProviderPrice(provider.pricing_type, Number(provider.price));
  const viewers = getViewerCount(provider.id);
  const legacyProvider = provider as Parameters<typeof computeProviderTags>[0];

  return (
    <>
      <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="relative h-48 bg-gradient-to-br from-green-600 to-green-400 sm:h-56">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0tNiA2aC0ydi00aDJ2NHptMC02aC0ydi00aDJ2NHptLTYgNmgtdjRoMnY0em0wLTZoLTJ2LTRoMnY0em0tNiA2aC0ydi00aDJ2NHptMC02aC0ydi00aDJ2NHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        </div>

        <div className="relative px-6 pb-8 sm:px-8">
          <div className="-mt-16 flex flex-col gap-4 sm:-mt-20 sm:flex-row sm:items-end sm:justify-between">
            {user?.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt=""
                width={144}
                height={144}
                className="h-28 w-28 rounded-2xl object-cover ring-4 ring-white shadow-lg sm:h-36 sm:w-36"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-green-100 text-4xl font-bold text-green-700 ring-4 ring-white shadow-lg sm:h-36 sm:w-36">
                {(user?.name ?? "P").charAt(0)}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 sm:mb-2">
              <FavoriteButton
                providerId={provider.id}
                providerName={user?.name ?? "Provider"}
                className="!p-2"
              />
              {provider.approved ? (
                <span className="badge-verified px-3 py-1 text-sm">✓ Verified</span>
              ) : (
                <span className="badge-pending px-3 py-1 text-sm">Pending review</span>
              )}
              {tags.includes("Top Rated") && (
                <span className="tag-pill bg-amber-500 font-semibold text-white">Top Rated</span>
              )}
              {tags.includes("Fast Responder") && (
                <span className="tag-pill bg-green-600 font-semibold text-white">Fast Responder</span>
              )}
            </div>
          </div>

          <TrustBadges provider={legacyProvider} />

          <p className="mt-2 text-xs text-amber-700">
            {viewers} {viewers === 1 ? "person is" : "people are"} viewing this profile now
          </p>

          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">{user?.name ?? "Provider"}</h1>
            <p className="mt-1 text-lg text-gray-500">{provider.location}</p>
            {provider.distance_miles != null && (
              <p className="mt-1 text-sm font-medium text-green-600">
                {Number(provider.distance_miles).toFixed(1)} miles away
              </p>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <StarRating rating={Number(displayRating)} />
            <span className="text-sm text-gray-500">
              {reviewCount} reviews · {provider.jobs_completed ?? 0} jobs completed
            </span>
            <span className="text-sm font-medium text-green-600">{responseLabel}</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-1">
            {tags.map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            <div className="rounded-2xl bg-gray-50 p-4 text-center ring-1 ring-gray-100">
              <p className="text-2xl font-bold text-gray-900">{priceDisplay}</p>
              <p className="text-xs text-gray-500">
                {PRICING_TYPE_LABELS[provider.pricing_type]}
              </p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4 text-center ring-1 ring-gray-100">
              <p className="text-2xl font-bold text-gray-900">{provider.jobs_completed ?? "—"}</p>
              <p className="text-xs text-gray-500">jobs completed</p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4 text-center ring-1 ring-gray-100">
              <p className="text-2xl font-bold text-gray-900">{provider.years_experience ?? "—"}+</p>
              <p className="text-xs text-gray-500">years experience</p>
            </div>
            <div className="rounded-2xl bg-green-50 p-4 text-center ring-1 ring-green-100">
              <p className="text-sm font-semibold text-green-800">{provider.availability}</p>
              <p className="mt-1 text-xs text-green-600">
                {provider.available_today && "Available today"}
                {provider.available_today && provider.available_tomorrow && " · "}
                {provider.available_tomorrow && "Tomorrow"}
              </p>
            </div>
          </div>

        <div className="mt-6">
          <BehavioralInsightsPanel
            provider={{
              services: provider.services,
              rating_avg: Number(provider.rating_avg),
              jobs_completed: provider.jobs_completed,
              available_today: provider.available_today,
              response_time_mins: provider.response_time_mins,
            }}
            reviews={reviews.map((r) => ({ rating: r.rating, comment: r.comment }))}
          />
        </div>

        <div className="mt-6">
          <ProviderAISummary
            provider={{
              name: user?.name ?? "Provider",
              services: provider.services,
              rating_avg: Number(provider.rating_avg),
              pricing_type: provider.pricing_type,
              price: Number(provider.price),
              years_experience: provider.years_experience,
              jobs_completed: provider.jobs_completed,
              description: provider.description,
            }}
          />
        </div>

          <div className="mt-6">
            <h2 className="font-semibold text-gray-900">Services</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {provider.services.map((service) => (
                <span key={service} className="badge-tag inline-flex items-center gap-1">
                  <span aria-hidden>{getServiceMeta(service).icon}</span>
                  {service}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h2 className="font-semibold text-gray-900">About</h2>
            <p className="mt-2 leading-relaxed text-gray-600">{provider.description}</p>
          </div>

          {provider.approved ? (
            <div className="mt-8">
              <div className="flex flex-wrap gap-3">
                {isLoggedIn &&
                  liveProvider?.userId &&
                  sessionUser?.id !== liveProvider.userId && (
                    <button
                      type="button"
                      onClick={() => setMessageOpen(true)}
                      className="btn-secondary px-8 py-3 text-base"
                    >
                      Message
                    </button>
                  )}
                <button
                  type="button"
                  onClick={() => setQuoteOpen(true)}
                  className="btn-secondary px-8 py-3 text-base"
                >
                  Get Instant Quote
                </button>
                {isLoggedIn ? (
                  <button
                    type="button"
                    onClick={() => setHireOpen(true)}
                    className="btn-primary px-8 py-3 text-base"
                  >
                    Hire Now
                  </button>
                ) : (
                  <Link
                    href={`/login?redirect=${encodeURIComponent(
                      `/provider/${provider.id}?service=${encodeURIComponent(defaultService)}&hire=1`
                    )}`}
                    className="btn-primary px-8 py-3 text-base"
                  >
                    Log in to Hire
                  </Link>
                )}
              </div>
              <p className="mt-3 text-sm text-green-700">{availabilityHint}</p>
              {isLoggedIn && sessionUser?.role === "customer" && (
                <button
                  type="button"
                  onClick={() => setReportOpen(true)}
                  className="mt-2 text-xs text-gray-500 underline hover:text-red-600"
                >
                  Report a safety concern
                </button>
              )}
            </div>
          ) : (
            <p className="mt-8 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              This provider is not yet approved and cannot be booked.
            </p>
          )}
        </div>
      </article>

      {reviews.length > 0 && (
        <>
          <div className="mt-8">
            <ReviewInsightsPanel
              reviews={reviews.map((r) => ({ rating: r.rating, comment: r.comment }))}
            />
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

      {isLoggedIn && provider.approved && reviewableBooking && (
        <div className="mt-8">
          <ReviewForm
            providerId={provider.id}
            bookingId={reviewableBooking.id}
          />
        </div>
      )}

      <QuoteModal
        open={quoteOpen}
        onClose={() => setQuoteOpen(false)}
        providerName={user?.name ?? "Provider"}
        profile={toQuoteProfile({
          id: provider.id,
          pricing_type: provider.pricing_type,
          price: Number(provider.price),
          base_price: provider.base_price,
          hourly_rate: provider.hourly_rate,
          services: provider.services,
          service_packages: provider.service_packages,
        })}
        defaultService={defaultService}
      />

      <HireModal
        open={hireOpen}
        onClose={() => setHireOpen(false)}
        providerId={provider.id}
        providerName={user?.name ?? "Provider"}
        pricingType={provider.pricing_type}
        price={Number(provider.price)}
        basePrice={Number(provider.base_price ?? 0)}
        hourlyRate={Number(provider.hourly_rate ?? provider.price)}
        availableToday={Boolean(provider.available_today)}
        defaultService={defaultService}
        rebookPrefill={rebookPrefill ?? undefined}
        quickBook={quickRebook}
      />

      <ReportProviderModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        providerId={provider.id}
        providerName={user?.name ?? "Provider"}
      />

      {liveProvider?.userId && (
        <DirectMessageModal
          open={messageOpen}
          onClose={() => setMessageOpen(false)}
          otherUserId={liveProvider.userId}
          otherUserName={user?.name ?? "Provider"}
        />
      )}
    </>
  );
}
