"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatCard } from "@/components/StatCard";
import { AdminAnalytics } from "@/components/AdminAnalytics";
import { useMockApp } from "@/context/MockAppContext";
import { useToast } from "@/components/Toast";
import { formatProviderPrice } from "@/lib/pricing";

export function AdminPanelClient() {
  const router = useRouter();
  const {
    user,
    ready,
    db,
    approveProvider,
    banUser,
    removeReview,
    resolveReport,
    getStats,
    loading,
  } = useMockApp();
  const { toast } = useToast();
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace("/login?redirect=/admin");
    else if (user.role !== "admin") router.replace("/customer/dashboard");
  }, [ready, user, router]);

  if (!ready || !db) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center text-gray-500">
        Loading…
      </div>
    );
  }

  const stats = getStats();
  const providers = db.providers.slice(0, 80);
  const customers = db.users.filter((u) => u.role === "customer");
  const providerUsers = db.users.filter((u) => u.role === "provider");
  const reviews = db.reviews.slice(0, 50);
  const reports = (db.reports ?? []).slice(0, 50);

  function handleApprove(providerId: string, approved: boolean) {
    startTransition(async () => {
      await approveProvider(providerId, approved);
      toast(
        approved ? "Provider approved — now visible in search" : "Provider unlisted",
        "success"
      );
    });
  }

  function handleBan(userId: string, banned: boolean, label: string) {
    startTransition(async () => {
      await banUser(userId, banned);
      toast(
        banned ? `${label} banned — removed from platform` : `${label} unbanned`,
        "success"
      );
    });
  }

  function handleRemoveReview(reviewId: string) {
    startTransition(async () => {
      await removeReview(reviewId);
      toast("Review removed — provider rating recalculated", "success");
    });
  }

  function handleResolveReport(reportId: string) {
    startTransition(async () => {
      await resolveReport(reportId);
      toast("Report resolved", "success");
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Admin Panel</h1>
      <p className="mt-1 text-gray-600">
        Platform overview and moderation — changes persist in localStorage.
      </p>

      {stats.pendingProviders > 0 && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-lg">
            ⚠
          </span>
          <div>
            <p className="font-semibold text-amber-900">
              {stats.pendingProviders} provider{stats.pendingProviders === 1 ? "" : "s"}{" "}
              pending approval
            </p>
            <p className="text-sm text-amber-700">Review and verify new providers below.</p>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value={stats.totalUsers} accent="primary" />
        <StatCard
          label="Total providers"
          value={stats.totalProviders}
          sub={`${stats.verifiedProviders} verified`}
          accent="medium"
        />
        <StatCard label="Pending approvals" value={stats.pendingProviders} accent="dark" />
        <StatCard label="Total bookings" value={stats.totalBookings} accent="light" />
      </div>

      <AdminAnalytics />

      <section className="mt-10">
        <h2 className="text-xl font-bold text-gray-900">Providers</h2>
        <div className="card mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Services</th>
                <th className="px-4 py-3 font-medium">Rate</th>
                <th className="px-4 py-3 font-medium">Rating</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {providers.map((p) => {
                const providerUser = providerUsers.find((u) => u.id === p.userId);
                const isBanned = providerUser?.banned ?? false;
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
                      {formatProviderPrice(p.pricingType, p.price)}
                    </td>
                    <td className="px-4 py-3">
                      {p.ratingAvg.toFixed(1)} ⭐ ({p.reviewCount})
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`tag-pill ${p.approved ? "badge-verified" : "badge-pending"}`}
                        >
                          {p.approved ? "Verified" : "Pending"}
                        </span>
                        {isBanned && (
                          <span className="tag-pill bg-red-100 text-red-500">Banned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleApprove(p.id, !p.approved)}
                          className={`rounded-lg px-3 py-1 text-xs font-medium transition disabled:opacity-50 ${
                            p.approved
                              ? "bg-red-100 text-red-500 hover:bg-red-200"
                              : "bg-green-600 text-white hover:bg-green-800"
                          }`}
                        >
                          {p.approved ? "Unlist" : "Approve"}
                        </button>
                        {providerUser && (
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() =>
                              handleBan(providerUser.id, !isBanned, p.name)
                            }
                            className={`rounded-lg px-3 py-1 text-xs font-medium transition disabled:opacity-50 ${
                              isBanned
                                ? "bg-green-600 text-white hover:bg-green-800"
                                : "bg-red-100 text-red-500 hover:bg-red-200"
                            }`}
                          >
                            {isBanned ? "Unban" : "Ban"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-gray-900">Safety reports</h2>
        <div className="card mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
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
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No reports yet
                  </td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{r.reporterName}</td>
                    <td className="px-4 py-3">{r.providerName}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-gray-600">
                      {r.reason}
                      {r.details ? ` — ${r.details}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`tag-pill ${
                          r.status === "open" ? "badge-pending" : "badge-verified"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.status === "open" && (
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleResolveReport(r.id)}
                          className="rounded-lg bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-800 disabled:opacity-50"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-gray-900">Reviews</h2>
        <div className="card mt-4 overflow-x-auto">
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
              {reviews.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-gray-100 transition hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium">{r.customerName}</td>
                  <td className="px-4 py-3">{r.rating} ⭐</td>
                  <td className="max-w-xs truncate px-4 py-3 text-gray-600">
                    {r.comment || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleRemoveReview(r.id)}
                      className="rounded-lg bg-red-100 px-3 py-1 text-xs font-medium text-red-500 transition hover:bg-red-200 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-gray-900">Customers</h2>
        <div className="card mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 transition hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`tag-pill ${u.banned ? "bg-red-100 text-red-500" : "badge-tag"}`}
                    >
                      {u.banned ? "Banned" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleBan(u.id, !u.banned, u.name)}
                      className={`rounded-lg px-3 py-1 text-xs font-medium transition disabled:opacity-50 ${
                        u.banned
                          ? "bg-green-600 text-white hover:bg-green-800"
                          : "bg-red-100 text-red-500 hover:bg-red-200"
                      }`}
                    >
                      {u.banned ? "Unban" : "Ban"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
