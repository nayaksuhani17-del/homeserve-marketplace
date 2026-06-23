"use client";

import type { SystemEvent } from "@/lib/mock/types";
import type { AdminActivityItem } from "@/lib/admin/dashboard";

const EVENT_ICONS: Record<SystemEvent["type"], string> = {
  booking_created: "📅",
  booking_accepted: "✅",
  booking_declined: "❌",
  booking_cancelled: "🚫",
  job_completed: "🏁",
  payment: "💳",
  report: "🛡️",
};

type AdminActivityFeedProps = {
  liveEvents: SystemEvent[];
  seedItems: AdminActivityItem[];
};

export function AdminActivityFeed({ liveEvents, seedItems }: AdminActivityFeedProps) {
  const live: AdminActivityItem[] = liveEvents.map((e) => ({
    id: e.id,
    icon: EVENT_ICONS[e.type] ?? "🔔",
    message: e.message,
    at: e.at,
  }));

  const merged = [...live, ...seedItems]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 12);

  if (merged.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-sm text-gray-500">
        No platform activity yet
      </p>
    );
  }

  return (
    <ul className="max-h-80 space-y-2 overflow-y-auto">
      {merged.map((item) => (
        <li
          key={item.id}
          className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm transition hover:border-green-200 hover:bg-green-50/50"
        >
          <span className="text-lg">{item.icon}</span>
          <div className="min-w-0 flex-1">
            <p className="text-gray-800">{item.message}</p>
            <p className="mt-0.5 text-xs text-gray-400">
              {new Date(item.at).toLocaleString()}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
