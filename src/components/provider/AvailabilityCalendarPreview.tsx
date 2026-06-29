"use client";

import { useMemo } from "react";
import {
  DAY_LABELS,
  DAY_SHORT,
  formatDateLabel,
  weekdayIndex,
} from "@/lib/availability";
import {
  formatDaySlotsSummary,
  formatSlotsCompact,
  getDaySlotsForConfig,
  getProviderAvailabilityConfig,
} from "@/lib/availability-config";
import type { MockProvider, ProviderAvailabilityConfig } from "@/lib/mock/types";

type AvailabilityCalendarPreviewProps = {
  provider: MockProvider;
  config?: ProviderAvailabilityConfig;
  days?: number;
};

export function AvailabilityCalendarPreview({
  provider,
  config: configProp,
  days = 14,
}: AvailabilityCalendarPreviewProps) {
  const config = configProp ?? getProviderAvailabilityConfig(provider);

  const dates = useMemo(() => {
    const list: string[] = [];
    const base = new Date();
    for (let i = 0; i < days; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      list.push(d.toISOString().split("T")[0]!);
    }
    return list;
  }, [days]);

  return (
    <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/80 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        Next {days} days
      </p>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {DAY_SHORT.map((day) => (
          <div
            key={day}
            className="text-center text-[10px] font-medium text-gray-400"
          >
            {day}
          </div>
        ))}
        {dates.map((date) => {
          const idx = weekdayIndex(date);
          const slots = getDaySlotsForConfig(config, idx);
          const enabled = slots.length > 0;
          return (
            <div
              key={date}
              title={
                enabled
                  ? `${formatDateLabel(date)} · ${formatSlotsCompact(slots)}`
                  : `${formatDateLabel(date)} · Unavailable`
              }
              className={`flex h-9 flex-col items-center justify-center rounded-lg text-[10px] font-medium ${
                enabled
                  ? "bg-green-100 text-green-800 ring-1 ring-green-200"
                  : "bg-gray-200/60 text-gray-400"
              }`}
            >
              <span>{date.slice(8)}</span>
            </div>
          );
        })}
      </div>
      {config.mode === "custom" && (
        <ul className="mt-3 space-y-0.5 border-t border-gray-200 pt-2 text-xs text-gray-600">
          {DAY_LABELS.map((label) => (
            <li key={label}>
              {formatDaySlotsSummary(label.slice(0, 3), config.custom[label] ?? [])}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
