"use client";

import { useMockApp } from "@/context/MockAppContext";

export function HomeStats({ inline = false }: { inline?: boolean }) {
  const { ready, dbRevision, getStats } = useMockApp();
  void dbRevision;

  if (!ready) {
    return inline ? (
      <div className="mt-4 h-5 w-64 animate-pulse rounded bg-gray-100" />
    ) : (
      <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card h-20 animate-pulse bg-gray-100 p-4" />
        ))}
      </section>
    );
  }

  const stats = getStats();

  if (inline) {
    return (
      <p className="mt-4 text-sm text-gray-600">
        <span className="font-semibold text-gray-900">{stats.verifiedProviders}</span> verified pros
        {" · "}
        <span className="font-semibold text-gray-900">{stats.avgRating}★</span> avg rating
        {" · "}
        <span className="font-semibold text-gray-900">{stats.jobsCompleted.toLocaleString()}+</span> jobs completed
      </p>
    );
  }

  return (
    <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="card p-4 text-center">
        <p className="text-2xl font-bold text-green-700">{stats.verifiedProviders}</p>
        <p className="text-xs text-gray-500">Verified pros</p>
      </div>
      <div className="card p-4 text-center">
        <p className="text-2xl font-bold text-green-700">
          {stats.jobsCompleted.toLocaleString()}+
        </p>
        <p className="text-xs text-gray-500">Jobs completed</p>
      </div>
      <div className="card p-4 text-center">
        <p className="text-2xl font-bold text-amber-500">{stats.avgRating}★</p>
        <p className="text-xs text-gray-500">Average rating</p>
      </div>
      <div className="card p-4 text-center">
        <p className="text-2xl font-bold text-green-700">
          {stats.totalBookings.toLocaleString()}+
        </p>
        <p className="text-xs text-gray-500">Bookings on platform</p>
      </div>
    </section>
  );
}
