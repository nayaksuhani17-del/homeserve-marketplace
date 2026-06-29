"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useMockApp } from "@/context/MockAppContext";
import { useToast } from "@/components/Toast";
import { AvailabilityCalendarPreview } from "@/components/provider/AvailabilityCalendarPreview";
import { AvailabilitySlotList } from "@/components/provider/AvailabilitySlotList";
import { DAY_LABELS, DAY_SHORT, weekAvailabilityFromSchedule } from "@/lib/availability";
import {
  formatAvailabilityConfigSummary,
  getProviderAvailabilityConfig,
  normalizeConfig,
  resolveWeeklySchedule,
  sortSlots,
  validateAvailabilityConfig,
} from "@/lib/availability-config";
import type {
  AvailabilityDayLabel,
  AvailabilityTimeSlot,
  MockProvider,
  ProviderAvailabilityConfig,
} from "@/lib/mock/types";

type ProviderAvailabilityEditorProps = {
  provider: MockProvider;
};

type ScheduleMode = ProviderAvailabilityConfig["mode"];

export function ProviderAvailabilityEditor({ provider }: ProviderAvailabilityEditorProps) {
  const { updateProvider } = useMockApp();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const initial = useMemo(
    () => getProviderAvailabilityConfig(provider),
    [provider]
  );

  const [mode, setMode] = useState<ScheduleMode>(initial.mode);
  const [generalDays, setGeneralDays] = useState<string[]>(initial.general.days);
  const [generalSlots, setGeneralSlots] = useState<AvailabilityTimeSlot[]>(
    initial.general.slots
  );
  const [custom, setCustom] = useState(initial.custom);

  useEffect(() => {
    const next = getProviderAvailabilityConfig(provider);
    setMode(next.mode);
    setGeneralDays(next.general.days);
    setGeneralSlots(next.general.slots);
    setCustom(next.custom);
  }, [provider.availabilityConfig, provider.weeklySchedule]);

  const draftConfig = useMemo(
    (): ProviderAvailabilityConfig =>
      normalizeConfig({
        mode,
        general: { days: generalDays, slots: generalSlots },
        custom,
      }),
    [mode, generalDays, generalSlots, custom]
  );

  const summary = formatAvailabilityConfigSummary(draftConfig);

  const todayIdx = useMemo(() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
  }, []);

  function persistConfig(next: ProviderAvailabilityConfig, options?: { silent?: boolean }) {
    const normalized = normalizeConfig(next);
    const validationError = validateAvailabilityConfig(normalized);
    if (validationError) {
      toast(validationError, "error");
      return;
    }

    const weeklySchedule = resolveWeeklySchedule(normalized);
    const weekAvailability = weekAvailabilityFromSchedule(weeklySchedule);

    startTransition(async () => {
      const result = await updateProvider({
        availabilityConfig: normalized,
        weeklySchedule,
        weekAvailability,
        availability: formatAvailabilityConfigSummary(normalized),
        availableToday: weekAvailability[todayIdx] ?? false,
        availableTomorrow: weekAvailability[(todayIdx + 1) % 7] ?? false,
      });
      if (result.error) {
        toast(result.error, "error");
        return;
      }
      if (!options?.silent) {
        toast("Availability updated", "success");
      }
    });
  }

  function applyGeneral(
    nextDays: string[],
    nextSlots: AvailabilityTimeSlot[],
    options?: { silent?: boolean }
  ) {
    setGeneralDays(nextDays);
    setGeneralSlots(sortSlots(nextSlots));
    persistConfig(
      normalizeConfig({
        mode: "general",
        general: { days: nextDays, slots: nextSlots },
        custom,
      }),
      options
    );
  }

  function applyCustom(
    nextCustom: ProviderAvailabilityConfig["custom"],
    options?: { silent?: boolean }
  ) {
    setCustom(nextCustom);
    persistConfig(
      normalizeConfig({
        mode: "custom",
        general: { days: generalDays, slots: generalSlots },
        custom: nextCustom,
      }),
      options
    );
  }

  function switchMode(nextMode: ScheduleMode) {
    setMode(nextMode);
    persistConfig(normalizeConfig({ ...draftConfig, mode: nextMode }));
  }

  function toggleGeneralDay(day: string) {
    const nextDays = generalDays.includes(day)
      ? generalDays.filter((d) => d !== day)
      : [...generalDays, day];
    applyGeneral(nextDays, generalSlots);
  }

  function updateCustomDaySlots(label: AvailabilityDayLabel, slots: AvailabilityTimeSlot[]) {
    applyCustom({ ...custom, [label]: sortSlots(slots) }, { silent: true });
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-gray-900">Availability</h2>
          <p className="mt-1 text-sm text-gray-500">{summary}</p>
        </div>
        <div className="flex rounded-xl bg-gray-100 p-1 text-sm">
          <button
            type="button"
            disabled={pending}
            onClick={() => switchMode("general")}
            className={`rounded-lg px-3 py-1.5 font-medium transition ${
              mode === "general"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            General schedule
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => switchMode("custom")}
            className={`rounded-lg px-3 py-1.5 font-medium transition ${
              mode === "custom"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Custom schedule
          </button>
        </div>
      </div>

      {mode === "general" ? (
        <div className="mt-4 space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              Available days
            </p>
            <div className="grid grid-cols-7 gap-1.5">
              {DAY_SHORT.map((day) => {
                const active = generalDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    disabled={pending}
                    onClick={() => toggleGeneralDay(day)}
                    className={`rounded-xl py-2.5 text-center text-xs font-semibold transition ${
                      active
                        ? "bg-green-50 text-green-800 ring-1 ring-green-200 hover:bg-green-100"
                        : "bg-gray-100 text-gray-400 ring-1 ring-gray-200 hover:bg-gray-200"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              Time slots (apply to all selected days)
            </p>
            <AvailabilitySlotList
              slots={generalSlots}
              disabled={pending}
              onChange={(slots) => applyGeneral(generalDays, slots, { silent: true })}
            />
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Per-day time slots
          </p>
          {DAY_LABELS.map((label) => (
            <div
              key={label}
              className="rounded-xl border border-gray-100 bg-gray-50/50 px-3 py-3"
            >
              <p className="mb-2 text-sm font-semibold text-gray-800">{label}</p>
              <AvailabilitySlotList
                slots={custom[label] ?? []}
                disabled={pending}
                onChange={(slots) => updateCustomDaySlots(label, slots)}
                addLabel="Add time slot"
              />
            </div>
          ))}
        </div>
      )}

      <AvailabilityCalendarPreview provider={provider} config={draftConfig} />
    </section>
  );
}
