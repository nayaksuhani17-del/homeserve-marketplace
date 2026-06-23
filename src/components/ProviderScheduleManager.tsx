"use client";

import { useMemo, useState, useTransition } from "react";
import { DEFAULT_SLOTS } from "@/lib/mock/simulation";
import { useMockApp } from "@/context/MockAppContext";
import { useToast } from "./Toast";

export function ProviderScheduleManager() {
  const { user, getProviderForUser, getAvailableSlots, toggleBlockedSlot, loading } =
    useMockApp();
  const { toast } = useToast();
  const [, startTransition] = useTransition();

  const today = new Date().toISOString().split("T")[0]!;
  const [selectedDate, setSelectedDate] = useState(today);

  const provider = user ? getProviderForUser(user.id) : undefined;
  const blocked = provider?.blockedSlots ?? [];

  const dates = useMemo(() => {
    const list: string[] = [];
    const base = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      list.push(d.toISOString().split("T")[0]!);
    }
    return list;
  }, []);

  if (!provider) return null;

  const available = getAvailableSlots(provider.id, selectedDate);

  function toggleSlot(time: string) {
    startTransition(async () => {
      const result = await toggleBlockedSlot(selectedDate, time);
      if (result.error) {
        toast(result.error, "error");
        return;
      }
      const key = `${selectedDate}:${time}`;
      const nowBlocked = !blocked.includes(key);
      toast(nowBlocked ? "Slot blocked" : "Slot opened", "success");
    });
  }

  return (
    <section className="card bg-white p-5">
      <h2 className="text-lg font-bold text-gray-900">Schedule & availability</h2>
      <p className="mt-1 text-sm text-gray-500">
        Block time slots you&apos;re unavailable — customers won&apos;t be able to book them.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {dates.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setSelectedDate(d)}
            className={`rounded-xl border px-3 py-1.5 text-sm ${
              selectedDate === d
                ? "border-green-600 bg-green-50 text-green-800"
                : "border-gray-200 hover:border-green-300"
            }`}
          >
            {d === today ? "Today" : d.slice(5)}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {DEFAULT_SLOTS.map((time) => {
          const key = `${selectedDate}:${time}`;
          const isBlocked = blocked.includes(key);
          const isBooked = !available.includes(time) && !isBlocked;
          return (
            <button
              key={time}
              type="button"
              disabled={loading || isBooked}
              onClick={() => toggleSlot(time)}
              className={`rounded-xl border px-2 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                isBlocked
                  ? "border-red-200 bg-red-50 text-red-700"
                  : isBooked
                    ? "border-gray-200 bg-gray-100 text-gray-400"
                    : "border-green-200 bg-green-50 text-green-800 hover:border-green-400"
              }`}
            >
              {time}
              <span className="mt-0.5 block text-[10px] font-normal">
                {isBlocked ? "Blocked" : isBooked ? "Booked" : "Open"}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
