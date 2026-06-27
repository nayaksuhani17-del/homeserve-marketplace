"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AdminSummaryCard } from "@/components/admin/AdminSummaryCard";
import { AdminBookingsChart } from "@/components/admin/AdminBookingsChart";
import { AdminActivityFeed } from "@/components/admin/AdminActivityFeed";
import { BookingStatusBadge } from "@/components/BookingStatusBadge";
import { StarRating } from "@/components/StarRating";
import { useMockApp } from "@/context/MockAppContext";
import { useToast } from "@/components/Toast";
import { isDemoAccount, roleBadgeClass, roleLabel } from "@/lib/accounts";
import { countAdmins } from "@/lib/mock/operations";
import {
  getAdminActivitySeed,
  getProviderAdminStatus,
  PROVIDER_STATUS_STYLES,
} from "@/lib/admin/dashboard";
import { isProviderVerified } from "@/lib/provider-verification";
import type { MockUser } from "@/lib/mock/types";

type AdminTab = "overview" | "providers" | "users" | "bookings" | "reports" | "reviews";
type BookingFilter = "active" | "completed";

const TABS: { id: AdminTab; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "providers", label: "Providers", icon: "🔧" },
  { id: "users", label: "Users", icon: "👥" },
  { id: "bookings", label: "Bookings", icon: "📅" },
  { id: "reports", label: "Reports", icon: "🛡️" },
  { id: "reviews", label: "Reviews", icon: "⭐" },
];

function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-gray-500">
        {message}
      </td>
    </tr>
  );
}

export function AdminPanelClient() {
  const router = useRouter();
  const {
    user,
    ready,
    db,
    approveProvider,
    rejectProvider,
    banUser,
    deleteUser,
    setUserRole,
    removeReview,
    dismissReport,
    banProviderFromReport,
    getStats,
    getAnalytics,
    systemEvents,
    loading,
  } = useMockApp();
  const { toast } = useToast();
  const [, startTransition] = useTransition();
  const [tab, setTab] = useState<AdminTab>("overview");
  const [bookingFilter, setBookingFilter] = useState<BookingFilter>("active");
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    action: () => Promise<{ error?: string } | void>;
    success: string;
  } | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace("/login?redirect=/admin");
    else if (user.role !== "admin") router.replace("/customer/dashboard");
  }, [ready, user, router]);

  const stats = getStats();
  const analytics = getAnalytics();
  const activitySeed = useMemo(
    () => (db ? getAdminActivitySeed(db) : []),
    [db]
  );

  const providers = db?.providers ?? [];
  const allUsers = useMemo(() => {
    if (!db) return [];
    return [...db.users].sort((a, b) => {
      const roleOrder = { admin: 0, provider: 1, customer: 2 };
      const ra = roleOrder[a.role];
      const rb = roleOrder[b.role];
      if (ra !== rb) return ra - rb;
      return a.name.localeCompare(b.name);
    });
  }, [db]);
  const adminCount = db ? countAdmins(db) : 0;
  const bookings = db?.bookings ?? [];
  const reviews = db?.reviews ?? [];
  const reports = db?.reports ?? [];

  const activeBookings = useMemo(
    () =>
      bookings.filter((b) => b.status === "pending" || b.status === "confirmed"),
    [bookings]
  );
  const completedBookings = useMemo(
    () => bookings.filter((b) => b.status === "completed"),
    [bookings]
  );
  const visibleBookings =
    bookingFilter === "active" ? activeBookings : completedBookings;

  if (!ready || !db) {
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

  if (!user || user.role !== "admin") {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center text-gray-500">Redirecting…</div>
    );
  }

  function run(action: () => Promise<{ error?: string } | void>, success: string) {
    startTransition(async () => {
      const result = await action();
      if (result && "error" in result && result.error) {
        toast(result.error, "error");
        return;
      }
      toast(success, "success");
    });
  }

  function requestConfirm(opts: {
    title: string;
    message: string;
    action: () => Promise<{ error?: string } | void>;
    success: string;
  }) {
    setConfirmAction(opts);
  }

  async function executeConfirm() {
    if (!confirmAction) return;
    const { action, success } = confirmAction;
    setConfirmAction(null);
    run(action, success);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 page-enter">
      <header className="border-b border-gray-100 pb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
          Platform control center
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">Admin Panel</h1>
        <p className="mt-1 text-gray-600">
          Full visibility and moderation — {adminCount} admin{adminCount === 1 ? "" : "s"} with
          platform access.
        </p>
      </header>

      {confirmAction && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">{confirmAction.title}</h2>
            <p className="mt-2 text-sm text-gray-600">{confirmAction.message}</p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeConfirm}
                className="btn-primary px-4 py-2 text-sm"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {(stats.pendingProviders > 0 || analytics.openReports > 0) && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {stats.pendingProviders > 0 && (
            <button
              type="button"
              onClick={() => setTab("providers")}
              className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-left transition hover:border-amber-300"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-lg">
                ⚠
              </span>
              <div>
                <p className="font-semibold text-amber-900">
                  {stats.pendingProviders} provider
                  {stats.pendingProviders === 1 ? "" : "s"} pending approval
                </p>
                <p className="text-sm text-amber-700">Review new applications →</p>
              </div>
            </button>
          )}
          {analytics.openReports > 0 && (
            <button
              type="button"
              onClick={() => setTab("reports")}
              className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-left transition hover:border-red-300"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-lg">
                🛡
              </span>
              <div>
                <p className="font-semibold text-red-900">
                  {analytics.openReports} report
                  {analytics.openReports === 1 ? "" : "s"} require review
                </p>
                <p className="text-sm text-red-700">Open safety queue →</p>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Summary stats */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <AdminSummaryCard icon="👥" label="Total users" value={stats.totalUsers} sub="All accounts" />
        <AdminSummaryCard
          icon="🛡️"
          label="Admins"
          value={stats.adminCount ?? adminCount}
          sub="Platform operators"
        />
        <AdminSummaryCard
          icon="🔧"
          label="Total providers"
          value={stats.totalProviders}
          sub={`${stats.verifiedProviders} approved`}
        />
        <AdminSummaryCard icon="📅" label="Total bookings" value={stats.totalBookings} />
        <AdminSummaryCard
          icon="⏳"
          label="Pending approvals"
          value={stats.pendingProviders}
          sub="Awaiting review"
        />
        <AdminSummaryCard
          icon="⚡"
          label="Active jobs"
          value={stats.activeJobs}
          sub="Pending + confirmed"
        />
      </section>

      {/* Tabs */}
      <div className="mt-8 flex gap-1 overflow-x-auto border-b border-gray-200 pb-px">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-t-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
              tab === t.id
                ? "bg-green-600 text-white shadow-md"
                : "text-gray-600 hover:bg-green-50"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div key={tab} className="animate-fade-in mt-6">
        {tab === "overview" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <section className="card p-6 lg:col-span-2">
              <h2 className="text-lg font-bold text-gray-900">Analytics</h2>
              <AdminBookingsChart data={analytics.bookingsPerDay} />
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">Most popular services</h3>
                  {analytics.popularServices.length === 0 ? (
                    <p className="mt-2 text-sm text-gray-500">No data available</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {analytics.popularServices.map((s) => (
                        <li
                          key={s.service}
                          className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm"
                        >
                          <span className="font-medium text-gray-800">{s.service}</span>
                          <span className="text-green-700">{s.count} bookings</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">Top providers</h3>
                  {analytics.topProviders.length === 0 ? (
                    <p className="mt-2 text-sm text-gray-500">No data available</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {analytics.topProviders.map((p) => (
                        <li
                          key={p.id}
                          className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm"
                        >
                          <span className="font-medium text-gray-800">{p.name}</span>
                          <span className="text-gray-500">
                            {p.rating.toFixed(1)} ⭐ · {p.jobsCompleted} jobs
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </section>
            <section className="card p-6">
              <h2 className="text-lg font-bold text-gray-900">Platform activity</h2>
              <p className="mt-1 text-sm text-gray-500">Live feed of marketplace events</p>
              <div className="mt-4">
                <AdminActivityFeed liveEvents={systemEvents} seedItems={activitySeed} />
              </div>
            </section>
          </div>
        )}

        {tab === "providers" && (
          <section className="card overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Services</th>
                  <th className="px-4 py-3 font-medium">Rating</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {providers.length === 0 ? (
                  <EmptyRow colSpan={5} message="No providers available" />
                ) : (
                  providers.map((p) => {
                    const providerUser = db.users.find((u) => u.id === p.userId);
                    const isBanned = providerUser?.banned ?? false;
                    const status = getProviderAdminStatus(
                      isProviderVerified(p),
                      p.rejected,
                      isBanned
                    );
                    return (
                      <tr
                        key={p.id}
                        className="border-b border-gray-100 transition hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.location}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {p.services.slice(0, 2).join(", ")}
                        </td>
                        <td className="px-4 py-3">
                          {p.ratingAvg.toFixed(1)} ⭐ ({p.reviewCount})
                        </td>
                        <td className="px-4 py-3">
                          <span className={`tag-pill ${PROVIDER_STATUS_STYLES[status]}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            {!isProviderVerified(p) && !isBanned && !p.rejected && (
                              <>
                                <button
                                  type="button"
                                  disabled={loading}
                                  onClick={() =>
                                    run(
                                      () => approveProvider(p.id, true),
                                      `${p.name} verified — badge visible to customers`
                                    )
                                  }
                                  className="btn-primary px-3 py-1 text-xs disabled:opacity-60"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  disabled={loading}
                                  onClick={() =>
                                    run(
                                      () => rejectProvider(p.id),
                                      `${p.name} rejected`
                                    )
                                  }
                                  className="btn-secondary px-3 py-1 text-xs text-red-600 disabled:opacity-60"
                                >
                                  ❌ Reject
                                </button>
                              </>
                            )}
                            {isProviderVerified(p) && !isBanned && (
                              <button
                                type="button"
                                disabled={loading}
                                onClick={() =>
                                  run(
                                    () => approveProvider(p.id, false),
                                    `${p.name} unlisted from search`
                                  )
                                }
                                className="btn-secondary px-3 py-1 text-xs disabled:opacity-60"
                              >
                                Unlist
                              </button>
                            )}
                            {providerUser && (
                              <button
                                type="button"
                                disabled={loading}
                                onClick={() =>
                                  run(
                                    () => banUser(providerUser.id, !isBanned),
                                    isBanned
                                      ? `${p.name} unbanned`
                                      : `${p.name} banned — removed from search`
                                  )
                                }
                                className={`rounded-lg px-3 py-1 text-xs font-medium disabled:opacity-60 ${
                                  isBanned
                                    ? "bg-green-600 text-white"
                                    : "bg-red-100 text-red-600"
                                }`}
                              >
                                {isBanned ? "Unban" : "🚫 Ban"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </section>
        )}

        {tab === "users" && (
          <section className="card overflow-x-auto">
            <div className="border-b border-gray-100 px-4 py-3">
              <p className="text-sm text-gray-600">
                {allUsers.length} accounts — demo and real users. Promote trusted users to admin
                without removing existing admins.
              </p>
            </div>
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.length === 0 ? (
                  <EmptyRow colSpan={5} message="No users available" />
                ) : (
                  allUsers.map((u) => (
                    <UserAdminRow
                      key={u.id}
                      user={u}
                      isSelf={u.id === user.id}
                      canDemote={u.role === "admin" && adminCount > 1}
                      loading={loading}
                      onPromote={() =>
                        requestConfirm({
                          title: "Promote to admin",
                          message: `Are you sure you want to promote ${u.name} to admin? They will get full platform access immediately.`,
                          action: () => setUserRole(u.id, "admin"),
                          success: `${u.name} promoted to admin`,
                        })
                      }
                      onDemote={() => {
                        const restoreRole = db?.providers.some((p) => p.userId === u.id)
                          ? "provider"
                          : "customer";
                        requestConfirm({
                          title: "Remove admin access",
                          message: `Remove admin access from ${u.name}? Their role will become ${roleLabel(restoreRole)}.`,
                          action: () => setUserRole(u.id, restoreRole),
                          success: `${u.name} is no longer an admin`,
                        });
                      }}
                      onBan={() =>
                        run(
                          () => banUser(u.id, !u.banned),
                          u.banned ? `${u.name} unbanned` : `${u.name} banned`
                        )
                      }
                      onDelete={() =>
                        requestConfirm({
                          title: "Delete account",
                          message: `Are you sure you want to delete ${u.name}'s account? This permanently removes their profile, bookings, reviews, and messages.`,
                          action: () => deleteUser(u.id),
                          success: `${u.name}'s account deleted`,
                        })
                      }
                    />
                  ))
                )}
              </tbody>
            </table>
          </section>
        )}

        {tab === "bookings" && (
          <section>
            <div className="mb-4 flex gap-2">
              {(
                [
                  { id: "active" as const, label: "Active bookings", count: activeBookings.length },
                  {
                    id: "completed" as const,
                    label: "Completed bookings",
                    count: completedBookings.length,
                  },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setBookingFilter(f.id)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    bookingFilter === f.id
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-green-50"
                  }`}
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>
            <div className="card overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Provider</th>
                    <th className="px-4 py-3 font-medium">Service</th>
                    <th className="px-4 py-3 font-medium">Time</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleBookings.length === 0 ? (
                    <EmptyRow colSpan={5} message="No bookings in this category" />
                  ) : (
                    visibleBookings.map((b) => (
                      <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{b.customerName}</td>
                        <td className="px-4 py-3">{b.providerName}</td>
                        <td className="px-4 py-3">{b.service}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {b.date}
                          {b.time ? ` · ${b.time}` : ""}
                        </td>
                        <td className="px-4 py-3">
                          <BookingStatusBadge status={b.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === "reports" && (
          <section className="card overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium">Reporter</th>
                  <th className="px-4 py-3 font-medium">Provider</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <EmptyRow colSpan={5} message="No reports available" />
                ) : (
                  reports.map((r) => (
                    <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{r.reporterName}</td>
                      <td className="px-4 py-3">{r.providerName}</td>
                      <td className="max-w-xs px-4 py-3 text-gray-600">
                        {r.reason}
                        {r.details ? ` — ${r.details}` : ""}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`tag-pill ${
                            r.status === "open"
                              ? "badge-pending"
                              : r.status === "dismissed"
                                ? "bg-gray-200 text-gray-700"
                                : "badge-verified"
                          }`}
                        >
                          {r.status === "open"
                            ? "Open"
                            : r.status === "dismissed"
                              ? "Dismissed"
                              : "Resolved"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {r.status === "open" && (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() =>
                                run(
                                  () => dismissReport(r.id),
                                  "Report dismissed"
                                )
                              }
                              className="btn-secondary px-3 py-1 text-xs disabled:opacity-60"
                            >
                              Dismiss
                            </button>
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() =>
                                run(
                                  () => banProviderFromReport(r.id),
                                  `${r.providerName} banned — report resolved`
                                )
                              }
                              className="btn-primary px-3 py-1 text-xs disabled:opacity-60"
                            >
                              Take action (ban)
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        )}

        {tab === "reviews" && (
          <section className="card overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Rating</th>
                  <th className="px-4 py-3 font-medium">Comment</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.length === 0 ? (
                  <EmptyRow colSpan={4} message="No reviews available" />
                ) : (
                  reviews.map((r) => (
                    <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{r.customerName}</td>
                      <td className="px-4 py-3">
                        <StarRating rating={r.rating} size="sm" />
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 text-gray-600">
                        {r.comment || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() =>
                            run(
                              () => removeReview(r.id),
                              "Review deleted — provider rating updated"
                            )
                          }
                          className="rounded-lg bg-red-100 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-200 disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </div>
  );
}

function UserAdminRow({
  user,
  isSelf,
  canDemote,
  loading,
  onPromote,
  onDemote,
  onBan,
  onDelete,
}: {
  user: MockUser;
  isSelf: boolean;
  canDemote: boolean;
  loading: boolean;
  onPromote: () => void;
  onDemote: () => void;
  onBan: () => void;
  onDelete: () => void;
}) {
  const demo = isDemoAccount(user);

  return (
    <tr
      className={`border-b border-gray-100 hover:bg-gray-50 ${
        user.role === "admin" ? "bg-violet-50/40" : ""
      }`}
    >
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-gray-900">{user.name}</span>
          {isSelf && (
            <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-green-800">
              You
            </span>
          )}
          {demo && (
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-gray-500">
              Demo
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-gray-600">{user.email}</td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleBadgeClass(user.role)}`}
        >
          {roleLabel(user.role)}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className={`tag-pill ${
            user.banned ? "bg-gray-800 text-white" : "badge-verified"
          }`}
        >
          {user.banned ? "Banned" : "Active"}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-2">
          {user.role !== "admin" && (
            <button
              type="button"
              disabled={loading || user.banned}
              onClick={onPromote}
              className="rounded-lg bg-violet-600 px-3 py-1 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-60"
            >
              Promote to Admin
            </button>
          )}
          {user.role === "admin" && canDemote && (
            <button
              type="button"
              disabled={loading}
              onClick={onDemote}
              className="rounded-lg bg-violet-100 px-3 py-1 text-xs font-medium text-violet-800 hover:bg-violet-200 disabled:opacity-60"
            >
              Remove Admin
            </button>
          )}
          {user.role === "admin" && !canDemote && (
            <span className="text-xs text-gray-400">Last admin</span>
          )}
          <button
            type="button"
            disabled={loading || (user.role === "admin" && !canDemote && !user.banned)}
            onClick={onBan}
            className={`rounded-lg px-3 py-1 text-xs font-medium disabled:opacity-60 ${
              user.banned ? "bg-green-600 text-white" : "bg-red-100 text-red-600"
            }`}
          >
            {user.banned ? "Unban" : "🚫 Ban"}
          </button>
          <button
            type="button"
            disabled={loading || isSelf || (user.role === "admin" && !canDemote)}
            onClick={onDelete}
            className="rounded-lg bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
            title={
              isSelf
                ? "Cannot delete your own account while logged in"
                : user.role === "admin" && !canDemote
                  ? "Cannot delete the last admin"
                  : undefined
            }
          >
            Delete Account
          </button>
        </div>
      </td>
    </tr>
  );
}
