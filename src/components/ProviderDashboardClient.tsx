"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProviderProfileForm } from "@/components/ProviderProfileForm";
import { ProviderWeekAvailability } from "@/components/provider/ProviderWeekAvailability";
import { BookingStatusBadge } from "@/components/BookingStatusBadge";
import { BookingChat } from "@/components/BookingChat";
import { ProviderScheduleManager } from "@/components/ProviderScheduleManager";
import { StarRating } from "@/components/StarRating";
import { ReviewInsightsPanel } from "@/components/ProviderAIInsights";
import { ProviderSummaryCard } from "@/components/provider/ProviderSummaryCard";
import { ProviderEarningsChart } from "@/components/provider/ProviderEarningsChart";
import { useMockApp } from "@/context/MockAppContext";
import { hasProviderRole, isAdmin } from "@/lib/user-capabilities";
import { useToast } from "@/components/Toast";
import {
  getBookingAddress,
  getProviderDisplayEarnings,
  getProviderEarnings,
  getProviderInsights,
  getResponseSpeedLabel,
  getReviewForBooking,
  getSmartAlerts,
  sortBookingsBySchedule,
} from "@/lib/provider/dashboard-stats";
import type { MockBooking, MockReview } from "@/lib/mock/types";

type BookingTab = "requests" | "upcoming" | "completed";

const TABS: { id: BookingTab; label: string; icon: string }[] = [
  { id: "requests", label: "New Requests", icon: "📥" },
  { id: "upcoming", label: "Upcoming Jobs", icon: "📅" },
  { id: "completed", label: "Completed Jobs", icon: "✅" },
];

function whenLabel(booking: MockBooking) {
  return `${booking.date}${booking.time ? ` · ${booking.time}` : ""}`;
}

function BookingCard({
  booking,
  variant,
  address,
  actionId,
  flashId,
  reviewRating,
  chatOpen,
  onToggleChat,
  onAccept,
  onReject,
  onComplete,
}: {
  booking: MockBooking;
  variant: BookingTab;
  address?: string;
  actionId: string | null;
  flashId: string | null;
  reviewRating?: number | null;
  chatOpen?: boolean;
  onToggleChat?: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  onComplete?: () => void;
}) {
  const busy = actionId === booking.id;
  const flash = flashId === booking.id;

  return (
    <article
      className={`rounded-xl border bg-white p-5 transition-all duration-300 hover:shadow-md ${
        flash
          ? "border-green-400 bg-green-50/50 shadow-green-100"
          : "border-gray-100 hover:border-green-200"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-gray-900">{booking.service}</h3>
            <BookingStatusBadge status={booking.status} />
          </div>
          <p className="mt-2 text-sm text-gray-700">
            <span className="text-gray-500">Customer:</span>{" "}
            <span className="font-medium">{booking.customerName}</span>
          </p>
          <p className="mt-1 text-sm text-gray-500">{whenLabel(booking)}</p>
          {address && variant === "upcoming" && (
            <p className="mt-1 text-sm text-gray-600">📍 {address}</p>
          )}
          <p className="mt-2 text-sm font-semibold text-green-700">
            Est. earnings: ${booking.estimatedCost.toFixed(0)}
          </p>
          {variant === "completed" && (
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
              <span className="font-medium text-green-700">
                +${booking.estimatedCost.toFixed(0)} earned
              </span>
              {reviewRating != null ? (
                <StarRating rating={reviewRating} size="sm" />
              ) : (
                <span className="text-gray-400">No review yet</span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {variant === "requests" && onAccept && onReject && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={onAccept}
                className="btn-primary px-4 py-2 text-sm active:scale-95 disabled:opacity-60"
              >
                {busy ? "…" : "✅ Accept"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onReject}
                className="btn-secondary px-4 py-2 text-sm active:scale-95 disabled:opacity-60"
              >
                ❌ Reject
              </button>
            </>
          )}
          {variant === "upcoming" && (
            <>
              {onComplete && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={onComplete}
                  className="btn-primary px-4 py-2 text-sm active:scale-95 disabled:opacity-60"
                >
                  {busy ? "…" : "Mark completed"}
                </button>
              )}
            </>
          )}
          {(variant === "upcoming" || variant === "completed") && onToggleChat && (
            <button
              type="button"
              onClick={onToggleChat}
              className="btn-secondary px-4 py-2 text-sm active:scale-95"
            >
              💬 {chatOpen ? "Hide chat" : "Message customer"}
            </button>
          )}
        </div>
      </div>

      {(variant === "upcoming" || variant === "completed") && chatOpen && (
        <div className="mt-4 animate-fade-in border-t border-gray-100 pt-4">
          <BookingChat booking={booking} />
        </div>
      )}
    </article>
  );
}

export function ProviderDashboardClient() {
  const router = useRouter();
  const {
    user,
    ready,
    db,
    dbRevision,
    activeMode,
    getProviderForUser,
    getBookingsForProvider,
    getProviderReviews,
    getNotifications,
    markNotificationsRead,
    completeBooking,
    respondToBooking,
  } = useMockApp();
  const { toast } = useToast();
  const [, startTransition] = useTransition();

  const [bookingTab, setBookingTab] = useState<BookingTab>("requests");
  const [actionId, setActionId] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [earningsPulse, setEarningsPulse] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [openChatId, setOpenChatId] = useState<string | null>(null);
  const profileSectionRef = useRef<HTMLElement>(null);
  const prevPending = useRef(0);

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace("/login?redirect=/provider/dashboard");
    else if (isAdmin(user)) router.replace("/admin");
    else if (!hasProviderRole(user)) router.replace("/customer/dashboard");
    else if (activeMode !== "provider") router.replace("/customer/dashboard");
  }, [ready, user, activeMode, router]);

  const provider = user ? getProviderForUser(user.id) : undefined;
  const bookings = useMemo(
    () => (provider ? getBookingsForProvider(provider.id) : []),
    [provider, getBookingsForProvider, db, dbRevision]
  );
  const displayReviews = provider ? getProviderReviews(provider.id) : [];
  const rawReviews: MockReview[] = useMemo(
    () => (db && provider ? db.reviews.filter((r) => r.providerId === provider.id) : []),
    [db, provider]
  );
  const notifications = getNotifications();

  const grouped = useMemo(() => {
    const pending = bookings.filter((b) => b.status === "pending");
    const upcoming = sortBookingsBySchedule(
      bookings.filter((b) => b.status === "confirmed")
    );
    const completed = bookings
      .filter((b) => b.status === "completed")
      .sort((a, b) => {
        const ta = new Date(a.completedAt ?? a.date).getTime();
        const tb = new Date(b.completedAt ?? b.date).getTime();
        return tb - ta;
      });
    return { pending, upcoming, completed };
  }, [bookings]);

  const earnings = useMemo(
    () => (provider ? getProviderDisplayEarnings(bookings, provider) : getProviderEarnings(bookings)),
    [bookings, provider]
  );
  const insights = provider ? getProviderInsights(provider, bookings, earnings) : [];
  const alerts = useMemo(
    () => getSmartAlerts(bookings, rawReviews, notifications),
    [bookings, rawReviews, notifications]
  );

  useEffect(() => {
    if (grouped.pending.length > prevPending.current) setBookingTab("requests");
    prevPending.current = grouped.pending.length;
  }, [grouped.pending.length]);

  useEffect(() => {
    if (!profileOpen) return;
    const timer = window.setTimeout(() => {
      profileSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
    return () => window.clearTimeout(timer);
  }, [profileOpen]);

  function toggleProfileEditor() {
    setProfileOpen((open) => {
      const next = !open;
      if (next) {
        window.setTimeout(() => {
          profileSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
      }
      return next;
    });
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card h-28 animate-pulse bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (!user || !hasProviderRole(user) || activeMode !== "provider") {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center text-gray-500">
        Redirecting…
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <p className="text-lg font-semibold text-gray-900">Provider profile not found</p>
        <p className="mt-2 text-sm text-gray-500">
          This account is set as a provider but has no service profile yet. Create a new
          provider account from Switch Account, or contact support.
        </p>
        <Link href="/" className="btn-primary mt-6 inline-block">
          Back to home
        </Link>
      </div>
    );
  }

  function pulseEarnings() {
    setEarningsPulse(true);
    window.setTimeout(() => setEarningsPulse(false), 1200);
  }

  function flashBooking(id: string) {
    setFlashId(id);
    window.setTimeout(() => setFlashId(null), 900);
  }

  function runAction(
    bookingId: string,
    action: () => Promise<{ error?: string }>,
    success: string,
    opts?: { pulse?: boolean; nextTab?: BookingTab }
  ) {
    setActionId(bookingId);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        toast(result.error, "error");
      } else {
        toast(success, "success");
        flashBooking(bookingId);
        if (opts?.pulse) pulseEarnings();
        if (opts?.nextTab) setBookingTab(opts.nextTab);
      }
      setActionId(null);
    });
  }

  const tabBookings =
    bookingTab === "requests"
      ? grouped.pending
      : bookingTab === "upcoming"
        ? grouped.upcoming
        : grouped.completed;

  const tabCounts = {
    requests: grouped.pending.length,
    upcoming: grouped.upcoming.length,
    completed: grouped.completed.length,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 page-enter">
      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-gray-100 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
            Provider workspace
          </p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Good {new Date().getHours() < 12 ? "morning" : "afternoon"},{" "}
            {user.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-gray-600">
            Your business command center — jobs, earnings, and reputation at a glance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {provider && (
            <Link href={`/provider/${provider.id}`} className="btn-secondary text-sm">
              View public profile
            </Link>
          )}
          <button
            type="button"
            onClick={toggleProfileEditor}
            className="btn-primary text-sm"
            aria-expanded={profileOpen}
            aria-controls="profile-editor"
          >
            ✏️ {profileOpen ? "Close editor" : "Edit profile"}
          </button>
        </div>
      </header>

      {provider && (
        <div
          className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${
            provider.approved
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          {provider.approved
            ? "✓ Verified provider — you're live and accepting bookings."
            : "⏳ Profile pending approval — keep your listing up to date."}
        </div>
      )}

      {profileOpen && (
        <section
          id="profile-editor"
          ref={profileSectionRef}
          className="animate-slide-up mt-6 scroll-mt-24 rounded-2xl border-2 border-green-300 bg-white p-6 shadow-md ring-4 ring-green-100"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Profile management</h2>
              <p className="mt-1 text-sm text-gray-500">
                Update services, pricing, description, and availability.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setProfileOpen(false)}
              className="rounded-lg px-3 py-1 text-sm text-gray-500 hover:bg-gray-100"
            >
              ✕ Close
            </button>
          </div>
          <div className="mt-6">
            <ProviderProfileForm
              defaultValues={{
                services: provider.services,
                pricing_type: provider.pricingType,
                price: provider.price,
                base_price: provider.basePrice,
                hourly_rate: provider.hourlyRate,
                location: provider.location,
                description: provider.description,
                availability: provider.availability,
                availableToday: provider.availableToday,
                availableTomorrow: provider.availableTomorrow,
                autoReplyEnabled: provider.autoReplyEnabled,
              }}
            />
          </div>
        </section>
      )}

      {/* 1. Summary cards */}
      {provider && (
        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <ProviderSummaryCard
            icon="💰"
            label="Total earnings"
            value={`$${earnings.total.toLocaleString()}`}
            sub="All time"
            pulse={earningsPulse}
          />
          <ProviderSummaryCard
            icon="✅"
            label="Jobs completed"
            value={`${provider.jobsCompleted} jobs`}
            sub="Lifetime"
          />
          <ProviderSummaryCard
            icon="⭐"
            label="Average rating"
            value={provider.ratingAvg.toFixed(1)}
            detail={<StarRating rating={provider.ratingAvg} size="sm" />}
            sub={`${provider.reviewCount} reviews`}
          />
          <ProviderSummaryCard
            icon="📅"
            label="Upcoming jobs"
            value={grouped.upcoming.length}
            sub={
              grouped.pending.length
                ? `${grouped.pending.length} new request${grouped.pending.length === 1 ? "" : "s"}`
                : "On your schedule"
            }
          />
          <ProviderSummaryCard
            icon="⚡"
            label="Response speed"
            value={getResponseSpeedLabel(provider.responseSpeed, provider.responseTimeMins)}
            sub={`~${provider.responseTimeMins ?? 30} min avg`}
          />
        </section>
      )}

      {/* Smart insights */}
      {insights.length > 0 && (
        <section className="mt-6 grid gap-3 md:grid-cols-3">
          {insights.map((item) => (
            <div
              key={item.text}
              className="flex items-start gap-3 rounded-xl border border-green-100 bg-gradient-to-br from-green-50 to-white p-4 text-sm text-gray-700"
            >
              <span className="text-xl">{item.icon}</span>
              <p>{item.text}</p>
            </div>
          ))}
        </section>
      )}

      <div className="mt-8 grid gap-8 xl:grid-cols-3">
        {/* Main column */}
        <div className="space-y-8 xl:col-span-2">
          {/* 2. Booking management */}
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-gray-50/80 px-5 py-4 sm:px-6">
              <h2 className="text-lg font-bold text-gray-900">Booking management</h2>
              <p className="text-sm text-gray-500">
                Accept requests, manage upcoming work, and review completed jobs.
              </p>
              <div className="mt-4 flex gap-1 overflow-x-auto">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setBookingTab(tab.id)}
                    className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                      bookingTab === tab.id
                        ? "bg-green-600 text-white shadow-md shadow-green-200"
                        : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-green-50"
                    }`}
                  >
                    {tab.icon} {tab.label}
                    {tabCounts[tab.id] > 0 && (
                      <span
                        className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                          bookingTab === tab.id ? "bg-white/25" : "bg-green-100 text-green-800"
                        }`}
                      >
                        {tabCounts[tab.id]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div key={bookingTab} className="animate-fade-in space-y-4 p-5 sm:p-6">
              {tabBookings.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 py-14 text-center">
                  <p className="text-4xl">
                    {bookingTab === "requests" ? "📭" : bookingTab === "upcoming" ? "📅" : "✅"}
                  </p>
                  <p className="mt-3 font-medium text-gray-800">
                    {bookingTab === "requests" && "No new requests right now"}
                    {bookingTab === "upcoming" && "No upcoming jobs scheduled"}
                    {bookingTab === "completed" && "No completed jobs yet"}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {bookingTab === "requests" &&
                      "New customer requests will appear here instantly."}
                    {bookingTab === "upcoming" &&
                      "Accepted jobs show here until you mark them complete."}
                    {bookingTab === "completed" &&
                      "Finished jobs and payout history appear here."}
                  </p>
                </div>
              ) : (
                tabBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    variant={bookingTab}
                    address={
                      provider ? getBookingAddress(booking, provider.location) : undefined
                    }
                    actionId={actionId}
                    flashId={flashId}
                    reviewRating={
                      bookingTab === "completed"
                        ? getReviewForBooking(rawReviews, booking.id)?.rating ?? null
                        : undefined
                    }
                    chatOpen={openChatId === booking.id}
                    onToggleChat={
                      bookingTab === "upcoming" || bookingTab === "completed"
                        ? () =>
                            setOpenChatId((id) => (id === booking.id ? null : booking.id))
                        : undefined
                    }
                    onAccept={
                      booking.status === "pending"
                        ? () =>
                            runAction(
                              booking.id,
                              () => respondToBooking(booking.id, true),
                              "Job accepted — moved to Upcoming Jobs",
                              { nextTab: "upcoming" }
                            )
                        : undefined
                    }
                    onReject={
                      booking.status === "pending"
                        ? () =>
                            runAction(
                              booking.id,
                              () => respondToBooking(booking.id, false),
                              "Request declined"
                            )
                        : undefined
                    }
                    onComplete={
                      booking.status === "confirmed"
                        ? () =>
                            runAction(
                              booking.id,
                              () => completeBooking(booking.id),
                              "Job completed — payment released",
                              { pulse: true, nextTab: "completed" }
                            )
                        : undefined
                    }
                  />
                ))
              )}
            </div>
          </section>

          {/* 3. Earnings */}
          {provider && (
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">💰 Earnings overview</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div
                  className={`rounded-xl bg-green-50 p-4 transition-all duration-500 ${
                    earningsPulse ? "scale-[1.02] ring-2 ring-green-300" : ""
                  }`}
                >
                  <p className="text-sm text-green-800">Total earnings</p>
                  <p className="mt-1 text-3xl font-bold text-green-900">
                    ${earnings.total.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-600">This week</p>
                  <p className="mt-1 text-3xl font-bold text-gray-900">
                    ${earnings.weekTotal.toLocaleString()}
                  </p>
                  {earnings.weekGrowthPercent > 0 && (
                    <p className="mt-1 text-xs font-medium text-green-600">
                      ↑ {earnings.weekGrowthPercent}% vs last week
                    </p>
                  )}
                </div>
              </div>

              <ProviderEarningsChart data={earnings.weeklyChart} />

              <div className="mt-6">
                <p className="text-sm font-semibold text-gray-800">Recent payouts</p>
                {earnings.perJob.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-500">
                    Complete jobs to see payouts here.
                  </p>
                ) : (
                  <ul className="mt-3 divide-y divide-gray-100">
                    {earnings.perJob.map((job) => (
                      <li
                        key={job.id}
                        className="flex items-center justify-between gap-3 py-3 text-sm"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {job.service} → ${job.amount.toFixed(0)}
                          </p>
                          <p className="text-gray-500">
                            {job.customerName} · {job.date}
                          </p>
                        </div>
                        <span className="font-bold text-green-700">+${job.amount.toFixed(0)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          )}

          {/* 4. Reviews & reputation */}
          {provider && (
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-gray-900">⭐ Reviews & reputation</h2>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{provider.ratingAvg.toFixed(1)}</p>
                  <p className="text-xs text-gray-500">{provider.reviewCount} total reviews</p>
                </div>
              </div>

              {rawReviews.length > 0 ? (
                <div className="mt-4">
                  <ReviewInsightsPanel
                    reviews={rawReviews.map((r) => ({
                      rating: r.rating,
                      comment: r.comment,
                    }))}
                  />
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
                  Complete jobs and collect reviews to unlock customer insights here.
                </div>
              )}

              {displayReviews.length > 0 && (
                <ul className="mt-4 space-y-3">
                  {displayReviews.slice(0, 5).map((review, i) => (
                    <li
                      key={`${review.created_at}-${i}`}
                      className="rounded-xl border border-gray-100 bg-gray-50 p-4 transition hover:border-green-200"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-gray-900">
                          {review.users?.name ?? "Customer"}
                        </p>
                        <StarRating rating={review.rating} size="sm" />
                      </div>
                      {review.comment && (
                        <p className="mt-2 text-sm leading-relaxed text-gray-600">
                          &ldquo;{review.comment}&rdquo;
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* 9. Notifications */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">🔔 Notifications & activity</h2>
              {notifications.some((n) => !n.read) && (
                <button
                  type="button"
                  onClick={() => markNotificationsRead()}
                  className="text-xs font-medium text-green-600 hover:underline"
                >
                  Mark read
                </button>
              )}
            </div>
            {alerts.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">All caught up — no new alerts.</p>
            ) : (
              <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto">
                {alerts.map((alert) => (
                  <li
                    key={alert.id}
                    className={`rounded-xl border p-3 text-sm transition hover:shadow-sm ${
                      alert.urgent
                        ? "border-amber-200 bg-amber-50"
                        : "border-gray-100 bg-gray-50"
                    }`}
                  >
                    <p className="font-medium text-gray-900">
                      {alert.icon} {alert.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-gray-600">
                      {alert.message}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 5. Availability / schedule */}
          {provider && (
            <>
              <ProviderWeekAvailability provider={provider} />
              <ProviderScheduleManager />
              <p className="text-xs text-gray-500">
                Accepted bookings automatically block the matching time slot for customers.
              </p>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
