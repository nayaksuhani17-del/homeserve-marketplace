"use client";

import { TIME_OPTIONS, formatTimeDisplay } from "@/lib/availability";
import type { AvailabilityTimeSlot } from "@/lib/mock/types";

type AvailabilitySlotListProps = {
  slots: AvailabilityTimeSlot[];
  disabled?: boolean;
  onChange: (slots: AvailabilityTimeSlot[]) => void;
  addLabel?: string;
};

export function AvailabilitySlotList({
  slots,
  disabled = false,
  onChange,
  addLabel = "Add time slot",
}: AvailabilitySlotListProps) {
  function updateSlot(index: number, patch: Partial<AvailabilityTimeSlot>) {
    const next = slots.map((slot, i) => (i === index ? { ...slot, ...patch } : slot));
    onChange(next);
  }

  function removeSlot(index: number) {
    onChange(slots.filter((_, i) => i !== index));
  }

  function addSlot() {
    const last = slots[slots.length - 1];
    const start = last ? last.end : "09:00";
    const startHour = Math.min(parseInt(start.split(":")[0]!, 10) + 1, 19);
    onChange([
      ...slots,
      {
        start: `${String(startHour).padStart(2, "0")}:00`,
        end: `${String(Math.min(startHour + 1, 20)).padStart(2, "0")}:00`,
      },
    ]);
  }

  return (
    <div className="space-y-2">
      {slots.length === 0 && (
        <p className="text-xs text-gray-400">No time slots — day is unavailable.</p>
      )}
      {slots.map((slot, index) => (
        <div
          key={`${index}-${slot.start}-${slot.end}`}
          className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-100 bg-white px-2 py-1.5"
        >
          <select
            value={slot.start}
            disabled={disabled}
            onChange={(e) => updateSlot(index, { start: e.target.value })}
            className="input-field min-w-[7rem] py-1.5 text-sm disabled:opacity-50"
          >
            {TIME_OPTIONS.map((time) => (
              <option key={time} value={time}>
                {formatTimeDisplay(time)}
              </option>
            ))}
          </select>
          <span className="text-xs text-gray-400">–</span>
          <select
            value={slot.end}
            disabled={disabled}
            onChange={(e) => updateSlot(index, { end: e.target.value })}
            className="input-field min-w-[7rem] py-1.5 text-sm disabled:opacity-50"
          >
            {TIME_OPTIONS.map((time) => (
              <option key={time} value={time}>
                {formatTimeDisplay(time)}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={disabled}
            onClick={() => removeSlot(index)}
            className="ml-auto rounded-lg px-2 py-1 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
            aria-label="Remove time slot"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        disabled={disabled}
        onClick={addSlot}
        className="text-sm font-medium text-green-700 hover:text-green-800 disabled:opacity-50"
      >
        + {addLabel}
      </button>
    </div>
  );
}
