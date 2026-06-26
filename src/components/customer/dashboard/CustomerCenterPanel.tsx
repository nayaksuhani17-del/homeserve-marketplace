"use client";

import { useState } from "react";
import Link from "next/link";
import { HireModal } from "@/components/HireModal";
import { BookingStatusBadge } from "@/components/BookingStatusBadge";
import { ReviewForm } from "@/components/ReviewForm";
import { StarRating } from "@/components/StarRating";
import { DirectMessageModal } from "@/components/DirectMessagePanel";
import { useMockApp } from "@/context/MockAppContext";
import type { MockBooking, MockProvider } from "@/lib/mock/types";
import { formatProviderPrice } from "@/lib/pricing";
import { parseSearchFallback } from "@/lib/ai/parse-search";

const EXAMPLE_PROMPTS = [
  "My sink is leaking",
  "Need a cleaner today",
  "Looking for electrician",
] as const;

export type CenterView =
  | { type: "search" }
  | { type: "results"; query: string; providers: MockProvider[] }
  | { type: "job"; bookingId: string };

type HireTarget = {
  providerId: string;
  providerName: string;
  pricingType: MockProvider["pricingType"];
  price: number;
  basePrice: number;
  hourlyRate: number;
  availableToday: boolean;
  defaultService: string;
};

type CustomerCenterPanelProps = {
  view: CenterView;
  bookings: MockBooking[];
  canBook: boolean;
  isLoggedIn: boolean;
  hasReview: (bookingId: string) => boolean;
  onSearch: (query: string) => void;
  onReset: () => void;
};

function pickService(provider: MockProvider, query: string): string {
  const { service } = parseSearchFallback(query);
  if (service && provider.services.some((s) => s === service)) return service;
  if (service) return service;
  return provider.services[0] ?? "General";
}

function SearchHome({
  canBook,
  isLoggedIn,
  onSearch,
}: {
  canBook: boolean;
  isLoggedIn: boolean;
  onSearch: (query: string) => void;
}) {
  const [query, setQuery] = useState("");

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    onSearch(q);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-8">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
          What do you need help with?
        </h1>
        <p className="mt-3 text-sm text-gray-500">
          Describe your issue and we&apos;ll match you with verified local pros.
        </p>

        {!isLoggedIn && (
          <p className="mt-4 text-sm text-amber-800">
            <Link href="/login?redirect=/customer/dashboard" className="font-medium underline">
              Log in
            </Link>{" "}
            to book a provider.
          </p>
        )}

        <form onSubmit={submit} className="mt-10">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-100 focus-within:ring-2 focus-within:ring-green-500/30">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={4}
              placeholder="Describe the service you need..."
              className="w-full resize-none border-0 bg-transparent px-5 py-4 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
            />
            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
              <p className="text-xs text-gray-400">Press Enter or tap Find Providers</p>
              <button
                type="submit"
                disabled={!query.trim()}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Find Providers
              </button>
            </div>
          </div>
        </form>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {EXAMPLE_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => {
                setQuery(prompt);
                onSearch(prompt);
              }}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 transition hover:border-gray-300 hover:bg-gray-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        {!canBook && isLoggedIn && (
          <p className="mt-8 text-sm text-gray-500">
            Switch to <strong>Customer mode</strong> in the header to book services.
          </p>
        )}
      </div>
    </div>
  );
}

function ProviderResults({
  query,
  providers,
  canBook,
  isLoggedIn,
  onBack,
  onHire,
}: {
  query: string;
  providers: MockProvider[];
  canBook: boolean;
  isLoggedIn: boolean;
  onBack: () => void;
  onHire: (provider: MockProvider) => void;
}) {
  return (
    <div className="flex flex-1 flex-col px-4 py-8 sm:px-10">
      <div className="mx-auto w-full max-w-2xl">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 text-sm text-gray-500 transition hover:text-gray-800"
        >
          ← New request
        </button>
        <h2 className="text-xl font-semibold text-gray-900">Providers for you</h2>
        <p className="mt-1 text-sm text-gray-500">&ldquo;{query}&rdquo;</p>

        {providers.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-gray-200 py-16 text-center">
            <p className="text-gray-600">No verified providers matched that request.</p>
            <button type="button" onClick={onBack} className="btn-primary mt-6">
              Try another search
            </button>
          </div>
        ) : (
          <ul className="mt-8 divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">
            {providers.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{p.name}</p>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {p.services.slice(0, 2).join(" · ")}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                    <span className="font-medium text-gray-800">
                      {formatProviderPrice(p.pricingType, p.price)}
                    </span>
                    <StarRating rating={p.ratingAvg} size="sm" />
                  </div>
                </div>
                {canBook && isLoggedIn ? (
                  <button
                    type="button"
                    onClick={() => onHire(p)}
                    className="shrink-0 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
                  >
                    Hire
                  </button>
                ) : (
                  <Link
                    href={`/login?redirect=${encodeURIComponent("/customer/dashboard")}`}
                    className="shrink-0 rounded-lg border border-gray-300 px-5 py-2.5 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    Log in to hire
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function JobDetail({
  booking,
  hasReview,
  onNewRequest,
}: {
  booking: MockBooking;
  hasReview: boolean;
  onNewRequest: () => void;
}) {
  const { db } = useMockApp();
  const [messageOpen, setMessageOpen] = useState(false);
  const providerUserId = db?.providers.find((p) => p.id === booking.providerId)?.userId;
  const showReview = booking.status === "completed" && !hasReview;
  const canMessage =
    providerUserId &&
    (booking.status === "pending" ||
      booking.status === "confirmed" ||
      booking.status === "completed");

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-8">
      <div className="w-full max-w-lg">
        <button
          type="button"
          onClick={onNewRequest}
          className="mb-6 text-sm text-gray-500 transition hover:text-gray-800"
        >
          ← New request
        </button>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Job details
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-gray-900">{booking.service}</h2>
          <p className="mt-1 text-gray-600">{booking.providerName}</p>

          {canMessage && (
            <button
              type="button"
              onClick={() => setMessageOpen(true)}
              className="mt-4 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Message {booking.providerName}
            </button>
          )}

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">When</dt>
              <dd className="font-medium text-gray-900">
                {booking.date}
                {booking.time ? ` at ${booking.time}` : ""}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Status</dt>
              <dd>
                <BookingStatusBadge
                  status={booking.status}
                  paymentStatus={booking.paymentStatus}
                  showPayment
                />
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Estimated cost</dt>
              <dd className="font-medium text-gray-900">
                ${booking.estimatedCost.toFixed(0)}
              </dd>
            </div>
          </dl>

          {booking.status === "confirmed" && (
            <p className="mt-6 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
              Your provider confirmed this job. They&apos;ll mark it complete when finished.
            </p>
          )}
          {booking.status === "pending" && (
            <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Waiting for {booking.providerName} to accept or decline your request.
            </p>
          )}
        </div>

        {showReview && (
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Leave feedback</h3>
            <ReviewForm providerId={booking.providerId} bookingId={booking.id} />
          </div>
        )}

        {booking.status === "completed" && hasReview && (
          <p className="mt-6 text-center text-sm text-gray-500">
            Thanks — you already left a review for this job.
          </p>
        )}
      </div>

      {providerUserId && (
        <DirectMessageModal
          open={messageOpen}
          otherUserId={providerUserId}
          otherUserName={booking.providerName}
          onClose={() => setMessageOpen(false)}
        />
      )}
    </div>
  );
}

export function CustomerCenterPanel({
  view,
  bookings,
  canBook,
  isLoggedIn,
  hasReview,
  onSearch,
  onReset,
}: CustomerCenterPanelProps) {
  const [hireTarget, setHireTarget] = useState<HireTarget | null>(null);

  const booking =
    view.type === "job"
      ? bookings.find((b) => b.id === view.bookingId)
      : undefined;

  function openHire(provider: MockProvider) {
    const query = view.type === "results" ? view.query : "";
    setHireTarget({
      providerId: provider.id,
      providerName: provider.name,
      pricingType: provider.pricingType,
      price: provider.price,
      basePrice: provider.basePrice,
      hourlyRate: provider.hourlyRate,
      availableToday: provider.availableToday,
      defaultService: pickService(provider, query),
    });
  }

  if (view.type === "job" && booking) {
    return (
      <main className="flex min-h-[calc(100dvh-9rem)] flex-1 flex-col bg-white">
        <JobDetail
          booking={booking}
          hasReview={hasReview(booking.id)}
          onNewRequest={onReset}
        />
      </main>
    );
  }

  if (view.type === "job" && !booking) {
    return (
      <main className="flex min-h-[calc(100dvh-9rem)] flex-1 items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-gray-500">This job is no longer available.</p>
          <button type="button" onClick={onReset} className="btn-primary mt-4">
            New request
          </button>
        </div>
      </main>
    );
  }

  if (view.type === "results") {
    return (
      <main className="flex min-h-[calc(100dvh-9rem)] flex-1 flex-col bg-white">
        <ProviderResults
          query={view.query}
          providers={view.providers}
          canBook={canBook}
          isLoggedIn={isLoggedIn}
          onBack={onReset}
          onHire={openHire}
        />
        {hireTarget && (
          <HireModal
            open
            onClose={() => setHireTarget(null)}
            providerId={hireTarget.providerId}
            providerName={hireTarget.providerName}
            pricingType={hireTarget.pricingType}
            price={hireTarget.price}
            basePrice={hireTarget.basePrice}
            hourlyRate={hireTarget.hourlyRate}
            availableToday={hireTarget.availableToday}
            defaultService={hireTarget.defaultService}
          />
        )}
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100dvh-9rem)] flex-1 flex-col bg-white">
      <SearchHome
        canBook={canBook}
        isLoggedIn={isLoggedIn}
        onSearch={onSearch}
      />
    </main>
  );
}
