"use client";

import type { MockBooking } from "@/lib/mock/types";
import { bookingStatusLabel } from "@/lib/mock/simulation";

type JobGroup = {
  title: string;
  bookings: MockBooking[];
  empty: string;
};

type CustomerJobSidebarProps = {
  pending: MockBooking[];
  active: MockBooking[];
  completed: MockBooking[];
  selectedId: string | null;
  onNewRequest: () => void;
  onSelectJob: (bookingId: string) => void;
  onBecomeProvider?: () => void;
  becomingProvider?: boolean;
  showBecomeProvider?: boolean;
};

function JobList({
  group,
  selectedId,
  onSelectJob,
}: {
  group: JobGroup;
  selectedId: string | null;
  onSelectJob: (id: string) => void;
}) {
  return (
    <section className="px-3 py-2">
      <h3 className="px-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        {group.title}
      </h3>
      {group.bookings.length === 0 ? (
        <p className="px-2 py-2 text-xs text-gray-400">{group.empty}</p>
      ) : (
        <ul className="mt-1 space-y-0.5">
          {group.bookings.map((b) => {
            const active = selectedId === b.id;
            return (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => onSelectJob(b.id)}
                  className={`w-full rounded-lg px-2.5 py-2 text-left transition ${
                    active
                      ? "bg-white shadow-sm ring-1 ring-gray-200"
                      : "hover:bg-white/70"
                  }`}
                >
                  <p className="truncate text-sm font-medium text-gray-900">
                    {b.service}
                  </p>
                  <p className="truncate text-xs text-gray-500">{b.providerName}</p>
                  <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-400">
                    {bookingStatusLabel(b.status)}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function CustomerJobSidebar({
  pending,
  active,
  completed,
  selectedId,
  onNewRequest,
  onSelectJob,
  onBecomeProvider,
  becomingProvider,
  showBecomeProvider,
}: CustomerJobSidebarProps) {
  const groups: JobGroup[] = [
    {
      title: "Pending Jobs",
      bookings: pending,
      empty: "No pending requests",
    },
    {
      title: "Active Jobs",
      bookings: active,
      empty: "No active jobs",
    },
    {
      title: "Completed Jobs",
      bookings: completed,
      empty: "No completed jobs yet",
    },
  ];

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-gray-200 bg-[#f7f7f8] md:w-64 md:border-b-0 md:border-r lg:w-72">
      <div className="border-b border-gray-200 p-3">
        <button
          type="button"
          onClick={onNewRequest}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-800 shadow-sm transition hover:bg-gray-50"
        >
          <span className="text-lg leading-none" aria-hidden>
            +
          </span>
          New Request
        </button>
      </div>

      <div className="max-h-48 overflow-y-auto md:max-h-none md:flex-1 md:overflow-y-auto">
        {groups.map((group) => (
          <JobList
            key={group.title}
            group={group}
            selectedId={selectedId}
            onSelectJob={onSelectJob}
          />
        ))}
      </div>

      {showBecomeProvider && onBecomeProvider && (
        <div className="mt-auto hidden border-t border-gray-200 p-3 md:block">
          <button
            type="button"
            onClick={onBecomeProvider}
            disabled={becomingProvider}
            className="w-full rounded-lg px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-white hover:text-green-700 disabled:opacity-60"
          >
            {becomingProvider ? "Setting up…" : "Become a Provider"}
          </button>
        </div>
      )}
    </aside>
  );
}
