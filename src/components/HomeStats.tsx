"use client";

import { useMockApp } from "@/context/MockAppContext";

export function HomeStats() {
  const { ready, getStats } = useMockApp();

  if (!ready) {
    return (
      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card h-20 animate-pulse bg-gray-100 p-4" />
        ))}
      </section>
    );
  }

  const stats = getStats();

  return (
    <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="card p-4 text-center">
        <p className="text-2xl font-bold text-green-700">{stats.totalProviders.toLocaleString()}+</p>
        <p className="text-xs text-gray-500">Providers on platform</p>
      </div>
      <div className="card p-4 text-center">
        <p className="text-2xl font-bold text-green-700">{stats.verifiedProviders.toLocaleString()}</p>
        <p className="text-xs text-gray-500">Verified pros</p>
      </div>
      <div className="card p-4 text-center">
        <p className="text-2xl font-bold text-amber-600">{stats.pendingProviders.toLocaleString()}</p>
        <p className="text-xs text-gray-500">Awaiting review</p>
      </div>
      <div className="card p-4 text-center">
        <p className="text-2xl font-bold text-green-700">{stats.totalBookings.toLocaleString()}</p>
        <p className="text-xs text-gray-500">Bookings on platform</p>
      </div>
    </section>
  );
}
