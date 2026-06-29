import type { MockDatabase, MockProvider } from "@/lib/mock/types";
import {
  getDaySlotsForConfig,
  normalizeConfig,
  resolveWeeklySchedule,
} from "@/lib/availability-config";

export function slotKey(date: string, time: string) {
  return `${date}:${time}`;
}

export function isSlotBlocked(
  provider: MockProvider,
  date: string,
  time: string
): boolean {
  return (provider.blockedSlots ?? []).includes(slotKey(date, time));
}

export function isSlotTaken(
  db: MockDatabase,
  providerId: string,
  date: string,
  time: string,
  excludeBookingId?: string
): boolean {
  return db.bookings.some(
    (b) =>
      b.id !== excludeBookingId &&
      b.providerId === providerId &&
      b.date === date &&
      b.time === time &&
      (b.status === "pending" || b.status === "confirmed")
  );
}

export const DAY_LABELS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export type DayScheduleEntry = {
  enabled: boolean;
  start: string;
  end: string;
};

/** Index 0 = Monday … 6 = Sunday */
export type WeeklySchedule = DayScheduleEntry[];

export const DEFAULT_WEEKLY_SCHEDULE: WeeklySchedule = [
  { enabled: true, start: "09:00", end: "17:00" },
  { enabled: true, start: "09:00", end: "17:00" },
  { enabled: true, start: "09:00", end: "17:00" },
  { enabled: true, start: "09:00", end: "17:00" },
  { enabled: true, start: "09:00", end: "17:00" },
  { enabled: false, start: "09:00", end: "17:00" },
  { enabled: false, start: "09:00", end: "17:00" },
];

export const TIME_OPTIONS = Array.from({ length: 15 }, (_, i) => {
  const hour = i + 6;
  return `${String(hour).padStart(2, "0")}:00`;
});

export function weekdayIndex(date: string): number {
  const day = new Date(`${date}T12:00:00`).getDay();
  return day === 0 ? 6 : day - 1;
}

export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function formatTimeDisplay(time: string): string {
  const mins = parseTimeToMinutes(time);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  if (m === 0) return `${h12} ${ampm}`;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function formatDateLabel(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function generateHourlySlots(start: string, end: string): string[] {
  const startM = parseTimeToMinutes(start);
  const endM = parseTimeToMinutes(end);
  if (endM <= startM) return [];
  const slots: string[] = [];
  for (let m = startM; m < endM; m += 60) {
    const h = Math.floor(m / 60);
    slots.push(`${String(h).padStart(2, "0")}:00`);
  }
  return slots;
}

export function getWeeklySchedule(provider: MockProvider): WeeklySchedule {
  if (provider.availabilityConfig) {
    return resolveWeeklySchedule(provider.availabilityConfig);
  }
  if (provider.weeklySchedule?.length === 7) {
    return provider.weeklySchedule.map((entry) => ({
      enabled: entry.enabled,
      start: entry.start || "09:00",
      end: entry.end || "17:00",
    }));
  }
  const flags = provider.weekAvailability ?? [
    true,
    true,
    true,
    true,
    true,
    false,
    false,
  ];
  return flags.map((enabled) => ({
    enabled,
    start: "09:00",
    end: "17:00",
  }));
}

export function weekAvailabilityFromSchedule(schedule: WeeklySchedule): boolean[] {
  return schedule.map((entry) => entry.enabled);
}

export function isDayEnabled(provider: MockProvider, date: string): boolean {
  if (provider.availabilityConfig) {
    const config = normalizeConfig(provider.availabilityConfig);
    return getDaySlotsForConfig(config, weekdayIndex(date)).length > 0;
  }
  const schedule = getWeeklySchedule(provider);
  return schedule[weekdayIndex(date)]?.enabled ?? false;
}

export function getScheduleSlotsForDate(
  provider: MockProvider,
  date: string
): string[] {
  if (!isDayEnabled(provider, date)) return [];

  if (provider.availabilityConfig) {
    const config = normalizeConfig(provider.availabilityConfig);
    const daySlots = getDaySlotsForConfig(config, weekdayIndex(date));
    const hourly = daySlots.flatMap((slot) =>
      generateHourlySlots(slot.start, slot.end)
    );
    return [...new Set(hourly)].sort();
  }

  const entry = getWeeklySchedule(provider)[weekdayIndex(date)]!;
  return generateHourlySlots(entry.start, entry.end);
}

export function isSlotWithinSchedule(
  provider: MockProvider,
  date: string,
  time: string
): boolean {
  return getScheduleSlotsForDate(provider, date).includes(time);
}

export function formatAvailabilitySummary(schedule: WeeklySchedule): string {
  const enabled = schedule
    .map((entry, i) => (entry.enabled ? DAY_SHORT[i] : null))
    .filter(Boolean);
  if (enabled.length === 0) return "Currently unavailable";
  const first = schedule.find((entry) => entry.enabled);
  const range = first
    ? `${formatTimeDisplay(first.start)}–${formatTimeDisplay(first.end)}`
    : "";
  if (enabled.length === 7) return `Daily ${range}`;
  if (
    enabled.length === 5 &&
    enabled.join("") === "MonTueWedThuFri"
  ) {
    return `Mon–Fri ${range}`;
  }
  return `${enabled.join(", ")} ${range}`;
}

export function buildWeeklySchedule(
  enabledDays: boolean[],
  start: string,
  end: string
): WeeklySchedule {
  return enabledDays.map((enabled) => ({
    enabled,
    start,
    end,
  }));
}

export function getAvailableSlotsForDate(
  db: MockDatabase,
  providerId: string,
  date: string
): string[] {
  const provider = db.providers.find((p) => p.id === providerId);
  if (!provider || !isDayEnabled(provider, date)) return [];

  const today = new Date().toISOString().split("T")[0]!;
  const currentHour = new Date().getHours();

  return getScheduleSlotsForDate(provider, date).filter((time) => {
    if (isSlotTaken(db, providerId, date, time)) return false;
    if (isSlotBlocked(provider, date, time)) return false;
    if (date === today) {
      const hour = Number(time.split(":")[0]);
      if (hour <= currentHour) return false;
    }
    return true;
  });
}

export function getAvailableDates(
  db: MockDatabase,
  providerId: string,
  maxDays = 14
): string[] {
  const dates: string[] = [];
  const base = new Date();
  for (let i = 0; i < maxDays; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const dateStr = d.toISOString().split("T")[0]!;
    if (getAvailableSlotsForDate(db, providerId, dateStr).length > 0) {
      dates.push(dateStr);
    }
  }
  return dates;
}

export function providerHasAnyAvailability(
  db: MockDatabase,
  providerId: string
): boolean {
  return getAvailableDates(db, providerId).length > 0;
}
