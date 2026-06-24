"use client";

import Link from "next/link";
import { useMockApp } from "@/context/MockAppContext";

export function BookingNotificationBanner() {
  const { user, db, getNotifications, markNotificationsRead } = useMockApp();

  if (!user || !db) return null;

  const latest = getNotifications().find(
    (n) =>
      !n.read &&
      n.type === "booking" &&
      (n.message.includes("accepted") || n.message.includes("declined"))
  );

  if (!latest) return null;

  const isAccepted = latest.message.includes("accepted");

  return (
    <div
      className={`mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
        isAccepted
          ? "border-green-200 bg-green-50 text-green-900"
          : "border-red-200 bg-red-50 text-red-900"
      }`}
      role="status"
    >
      <p className="font-medium">{latest.message}</p>
      <div className="flex gap-2">
        {latest.href && (
          <Link href={latest.href} className="btn-secondary px-3 py-1 text-xs">
            View bookings
          </Link>
        )}
        <button
          type="button"
          onClick={() => markNotificationsRead([latest.id])}
          className="text-xs font-medium underline opacity-80 hover:opacity-100"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
