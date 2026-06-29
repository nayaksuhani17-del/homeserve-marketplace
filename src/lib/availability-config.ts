import {
  DAY_LABELS,
  DAY_SHORT,
  formatAvailabilitySummary,
  formatTimeDisplay,
  parseTimeToMinutes,
  type WeeklySchedule,
} from "@/lib/availability";
import type {
  AvailabilityDayLabel,
  AvailabilityTimeSlot,
  DayScheduleEntry,
  ProviderAvailabilityConfig,
} from "@/lib/mock/types";

const DEFAULT_SLOT: AvailabilityTimeSlot = { start: "09:00", end: "17:00" };

/** @deprecated Legacy single-range custom day entry */
type LegacyCustomDay = DayScheduleEntry;

/** @deprecated Legacy general block */
type LegacyGeneral = {
  days: string[];
  start?: string;
  end?: string;
  slots?: AvailabilityTimeSlot[];
};

export function sortSlots(slots: AvailabilityTimeSlot[]): AvailabilityTimeSlot[] {
  return [...slots].sort(
    (a, b) => parseTimeToMinutes(a.start) - parseTimeToMinutes(b.start)
  );
}

export function isValidTimeRange(start: string, end: string): boolean {
  return parseTimeToMinutes(end) > parseTimeToMinutes(start);
}

export function hasOverlappingSlots(slots: AvailabilityTimeSlot[]): boolean {
  const sorted = sortSlots(slots);
  for (let i = 1; i < sorted.length; i++) {
    if (parseTimeToMinutes(sorted[i]!.start) < parseTimeToMinutes(sorted[i - 1]!.end)) {
      return true;
    }
  }
  return false;
}

function normalizeSlots(slots: AvailabilityTimeSlot[]): AvailabilityTimeSlot[] {
  return sortSlots(
    slots
      .map((s) => ({
        start: s.start || "09:00",
        end: s.end || "17:00",
      }))
      .filter((s) => isValidTimeRange(s.start, s.end))
  );
}

function slotsFromLegacyDay(entry: LegacyCustomDay | AvailabilityTimeSlot[] | undefined): AvailabilityTimeSlot[] {
  if (!entry) return [];
  if (Array.isArray(entry)) return normalizeSlots(entry);
  if (!entry.enabled) return [];
  return normalizeSlots([{ start: entry.start, end: entry.end }]);
}

function migrateGeneral(general: LegacyGeneral): ProviderAvailabilityConfig["general"] {
  const days = (general.days ?? []).filter((d) =>
    (DAY_SHORT as readonly string[]).includes(d)
  );
  if (general.slots?.length) {
    return {
      days: days.length > 0 ? days : ["Mon", "Tue", "Wed", "Thu", "Fri"],
      slots: normalizeSlots(general.slots),
    };
  }
  if (general.start && general.end && isValidTimeRange(general.start, general.end)) {
    return {
      days: days.length > 0 ? days : ["Mon", "Tue", "Wed", "Thu", "Fri"],
      slots: [{ start: general.start, end: general.end }],
    };
  }
  return {
    days: days.length > 0 ? days : ["Mon", "Tue", "Wed", "Thu", "Fri"],
    slots: [DEFAULT_SLOT],
  };
}

export function defaultAvailabilityConfig(): ProviderAvailabilityConfig {
  const custom = Object.fromEntries(
    DAY_LABELS.map((label, i) => [
      label,
      i < 5 ? [DEFAULT_SLOT] : [],
    ])
  ) as ProviderAvailabilityConfig["custom"];

  return {
    mode: "general",
    general: {
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      slots: [DEFAULT_SLOT],
    },
    custom,
  };
}

export function getDaySlotsForConfig(
  config: ProviderAvailabilityConfig,
  dayIndex: number
): AvailabilityTimeSlot[] {
  const normalized = normalizeConfig(config);
  if (normalized.mode === "custom") {
    return normalized.custom[DAY_LABELS[dayIndex] as AvailabilityDayLabel] ?? [];
  }
  const short = DAY_SHORT[dayIndex]!;
  if (!normalized.general.days.includes(short)) return [];
  return normalized.general.slots;
}

export function resolveWeeklySchedule(
  config: ProviderAvailabilityConfig
): WeeklySchedule {
  return DAY_SHORT.map((short, i) => {
    const slots = getDaySlotsForConfig(config, i);
    const enabled = slots.length > 0;
    const sorted = sortSlots(slots);
    return {
      enabled,
      start: sorted[0]?.start ?? "09:00",
      end: sorted[sorted.length - 1]?.end ?? "17:00",
    };
  });
}

export function configFromWeeklySchedule(schedule: WeeklySchedule): ProviderAvailabilityConfig {
  const custom = Object.fromEntries(
    DAY_LABELS.map((label, i) => [
      label,
      schedule[i]?.enabled
        ? [{ start: schedule[i]!.start, end: schedule[i]!.end }]
        : [],
    ])
  ) as ProviderAvailabilityConfig["custom"];

  const generalDays = schedule
    .map((entry, i) => (entry.enabled ? DAY_SHORT[i]! : null))
    .filter(Boolean) as string[];

  const enabledEntries = schedule.filter((e) => e.enabled);
  const uniform =
    enabledEntries.length > 0 &&
    enabledEntries.every(
      (e) => e.start === enabledEntries[0]!.start && e.end === enabledEntries[0]!.end
    );

  if (uniform) {
    return {
      mode: "general",
      general: {
        days: generalDays,
        slots: [{ start: enabledEntries[0]!.start, end: enabledEntries[0]!.end }],
      },
      custom,
    };
  }

  return {
    mode: "custom",
    general: {
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      slots: [DEFAULT_SLOT],
    },
    custom,
  };
}

export function getProviderAvailabilityConfig(
  provider: {
    availabilityConfig?: ProviderAvailabilityConfig | Record<string, unknown>;
    weeklySchedule?: DayScheduleEntry[];
    weekAvailability?: boolean[];
  }
): ProviderAvailabilityConfig {
  if (provider.availabilityConfig) {
    return normalizeConfig(provider.availabilityConfig as ProviderAvailabilityConfig);
  }

  const schedule: WeeklySchedule =
    provider.weeklySchedule?.length === 7
      ? provider.weeklySchedule.map((entry) => ({
          enabled: entry.enabled,
          start: entry.start || "09:00",
          end: entry.end || "17:00",
        }))
      : (provider.weekAvailability ?? [true, true, true, true, true, false, false]).map(
          (enabled) => ({
            enabled,
            start: "09:00",
            end: "17:00",
          })
        );

  return configFromWeeklySchedule(schedule);
}

export function normalizeConfig(
  config: ProviderAvailabilityConfig | Record<string, unknown>
): ProviderAvailabilityConfig {
  const raw = config as ProviderAvailabilityConfig & {
    general?: LegacyGeneral;
    custom?: Record<string, LegacyCustomDay | AvailabilityTimeSlot[]>;
  };

  const custom = {} as ProviderAvailabilityConfig["custom"];
  for (const label of DAY_LABELS) {
    custom[label] = slotsFromLegacyDay(raw.custom?.[label]);
  }

  return {
    mode: raw.mode === "custom" ? "custom" : "general",
    general: migrateGeneral(raw.general ?? { days: [] }),
    custom,
  };
}

export function formatSlotsCompact(slots: AvailabilityTimeSlot[]): string {
  const sorted = sortSlots(slots);
  if (sorted.length === 0) return "OFF";
  return sorted
    .map((s) => `${formatTimeDisplay(s.start).replace(" ", "")}–${formatTimeDisplay(s.end).replace(" ", "")}`)
    .join(", ");
}

export function formatDaySlotsSummary(
  label: string,
  slots: AvailabilityTimeSlot[]
): string {
  if (slots.length === 0) return `${label}: OFF`;
  return `${label}: ${formatSlotsCompact(slots)}`;
}

export function formatAvailabilityConfigSummary(
  config: ProviderAvailabilityConfig
): string {
  const normalized = normalizeConfig(config);

  if (normalized.mode === "custom") {
    const parts = DAY_LABELS.map((label) => {
      const slots = normalized.custom[label];
      if (slots.length === 0) return null;
      return formatDaySlotsSummary(label.slice(0, 3), slots);
    }).filter(Boolean);
    if (parts.length === 0) return "Currently unavailable";
    if (parts.length <= 2) return parts.join(" · ");
    return "Custom schedule set";
  }

  const { days, slots } = normalized.general;
  if (days.length === 0 || slots.length === 0) return "Currently unavailable";

  const dayPart =
    days.length === 7
      ? "Daily"
      : days.length === 5 && days.join("") === "MonTueWedThuFri"
        ? "Mon–Fri"
        : days.join(", ");

  return `${dayPart}: ${formatSlotsCompact(slots)}`;
}

export function validateAvailabilityConfig(
  config: ProviderAvailabilityConfig
): string | null {
  const normalized = normalizeConfig(config);

  if (normalized.mode === "general") {
    if (normalized.general.days.length === 0) {
      return "Select at least one available day.";
    }
    if (normalized.general.slots.length === 0) {
      return "Add at least one time slot.";
    }
    for (const slot of normalized.general.slots) {
      if (!isValidTimeRange(slot.start, slot.end)) {
        return "Each slot must end after it starts.";
      }
    }
    if (hasOverlappingSlots(normalized.general.slots)) {
      return "Time slots cannot overlap.";
    }
    return null;
  }

  let anySlots = false;
  for (const label of DAY_LABELS) {
    const slots = normalized.custom[label];
    if (slots.length === 0) continue;
    anySlots = true;
    for (const slot of slots) {
      if (!isValidTimeRange(slot.start, slot.end)) {
        return `${label}: end time must be after start time.`;
      }
    }
    if (hasOverlappingSlots(slots)) {
      return `${label}: time slots cannot overlap.`;
    }
  }
  if (!anySlots) return "Add at least one time slot on your custom schedule.";
  return null;
}

/** @deprecated Use formatDaySlotsSummary */
export function formatDayRange(label: string, entry: DayScheduleEntry): string {
  if (!entry.enabled) return `${label}: OFF`;
  return `${label}: ${formatTimeDisplay(entry.start)} – ${formatTimeDisplay(entry.end)}`;
}
