"use client";

import { useMemo, useState, useTransition } from "react";
import { useMockApp } from "@/context/MockAppContext";
import { useToast } from "@/components/Toast";
import type { MockProvider } from "@/lib/mock/types";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type ProviderWeekAvailabilityProps = {
  provider: MockProvider;
};

export function ProviderWeekAvailability({ provider }: ProviderWeekAvailabilityProps) {
  const { updateProvider } = useMockApp();
  const { toast } = useToast();
  const [, startTransition] = useTransition();

  const todayIdx = useMemo(() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
  }, []);

  const [days, setDays] = useState<boolean[]>(
    () => provider.weekAvailability ?? [true, true, true, true, true, false, false]
  );

  function toggleDay(index: number) {
    const next = [...days];
    next[index] = !next[index];
    setDays(next);

    startTransition(async () => {
      const patch: {
        weekAvailability: boolean[];
        availableToday?: boolean;
        availableTomorrow?: boolean;
      } = { weekAvailability: next };

      if (index === todayIdx) patch.availableToday = next[index];
      if (index === (todayIdx + 1) % 7) patch.availableTomorrow = next[index];

      await updateProvider(patch);
      toast(
        next[index] ? `${DAYS[index]} marked available` : `${DAYS[index]} marked unavailable`,
        "success"
      );
    });
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="font-bold text-gray-900">📆 Weekly availability</h2>
      <p className="mt-1 text-sm text-gray-500">
        Tap any day to toggle. Changes save instantly and sync with your profile.
      </p>
      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {DAYS.map((day, i) => {
          const available = days[i];
          const isToday = i === todayIdx;
          return (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(i)}
              className={`rounded-xl py-2.5 text-center text-xs font-semibold transition-all duration-200 active:scale-95 ${
                isToday
                  ? available
                    ? "bg-green-600 text-white ring-2 ring-green-300"
                    : "bg-gray-400 text-white ring-2 ring-gray-300"
                  : available
                    ? "bg-green-50 text-green-800 ring-1 ring-green-200 hover:bg-green-100"
                    : "bg-gray-100 text-gray-400 ring-1 ring-gray-200 hover:bg-gray-200"
              }`}
            >
              {day}
              {isToday && <div className="mt-0.5 text-[9px] font-normal opacity-90">Today</div>}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-gray-300" /> Unavailable
        </span>
      </div>
    </section>
  );
}
