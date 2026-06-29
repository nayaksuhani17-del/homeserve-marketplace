import type { MockBooking, MockDatabase, MockProvider, ResponseSpeed } from "./types";
import { DEMO_MODE } from "@/lib/demo/mode";
import {
  getAvailableSlotsForDate,
  getAvailableDates as getAvailableDatesForProvider,
  getWeeklySchedule,
  isSlotBlocked,
  isSlotTaken,
  providerHasAnyAvailability,
  slotKey,
} from "@/lib/availability";

export { isSlotBlocked, isSlotTaken, slotKey, getWeeklySchedule, providerHasAnyAvailability };

/** @deprecated Use provider weekly schedule via getAvailableSlots */
export const DEFAULT_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
];

export function getResponseSpeed(provider: MockProvider): ResponseSpeed {
  if (provider.responseSpeed) return provider.responseSpeed;
  const mins = provider.responseTimeMins ?? 60;
  if (mins <= 20) return "fast";
  if (mins <= 60) return "medium";
  return "slow";
}

export function getResponseDelayMs(speed: ResponseSpeed): number {
  if (DEMO_MODE) {
    return 600 + Math.floor(Math.random() * 600);
  }
  switch (speed) {
    case "fast":
      return 1000 + Math.floor(Math.random() * 1000);
    case "medium":
      return 3000 + Math.floor(Math.random() * 2000);
    case "slow":
      return 5000 + Math.floor(Math.random() * 3000);
  }
}

export function getAvailableSlots(
  db: MockDatabase,
  providerId: string,
  date: string
): string[] {
  return getAvailableSlotsForDate(db, providerId, date);
}

export function getAvailableDates(
  db: MockDatabase,
  providerId: string,
  maxDays = 14
): string[] {
  return getAvailableDatesForProvider(db, providerId, maxDays);
}

export function getNextAvailableSlot(
  db: MockDatabase,
  providerId: string,
  maxDays = 7
): { date: string; time: string } | null {
  const today = new Date();
  for (let d = 0; d < maxDays; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);
    const dateStr = date.toISOString().split("T")[0]!;
    const slots = getAvailableSlots(db, providerId, dateStr);
    if (slots.length > 0) {
      return { date: dateStr, time: slots[0]! };
    }
  }
  return null;
}

export function getAvailabilityHint(
  db: MockDatabase,
  provider: MockProvider
): string {
  if (!provider.approved) return "Not accepting bookings until verified.";
  if (!providerHasAnyAvailability(db, provider.id)) {
    return "This provider is currently unavailable.";
  }
  if (provider.availableToday) {
    const today = new Date().toISOString().split("T")[0]!;
    const todaySlots = getAvailableSlots(db, provider.id, today);
    if (todaySlots.length > 0) {
      return `Available today from ${todaySlots[0]}`;
    }
  }
  const next = getNextAvailableSlot(db, provider.id);
  if (next) return `Next opening: ${next.date} at ${next.time}`;
  return "This provider is currently unavailable.";
}

const CHAT_REPLIES: { pattern: RegExp; reply: string }[] = [
  {
    pattern: /what time|when.*arriv|arrive/i,
    reply: "I'll be there on time. I'll send a message when I'm 15 minutes away.",
  },
  {
    pattern: /cheaper|discount|lower|price|cost/i,
    reply: "We can discuss pricing when I arrive. I always aim to offer fair value.",
  },
  {
    pattern: /bring|tool|equipment|material/i,
    reply: "Yes, I bring all standard tools and materials needed for the job.",
  },
  {
    pattern: /how long|duration|take/i,
    reply: "Based on your booking, I estimate the job will take about as long as scheduled.",
  },
  {
    pattern: /parking|access|door|gate|cancel/i,
    reply: "No problem — message me here if plans change and we'll work it out.",
  },
];

export const CHAT_QUICK_PROMPTS = [
  "What time will you arrive?",
  "Can you do it cheaper?",
  "Do you bring your own tools?",
  "How long will the job take?",
];

export function generateProviderChatReply(customerMessage: string): string {
  for (const { pattern, reply } of CHAT_REPLIES) {
    if (pattern.test(customerMessage)) return reply;
  }
  return "Thanks for your message! I'll confirm everything before the appointment.";
}

export function providerHasAutoReply(
  provider: { autoReplyEnabled?: boolean } | undefined
): boolean {
  return provider?.autoReplyEnabled === true;
}

export function getChatReplyDelayMs(): number {
  return 2000 + Math.floor(Math.random() * 3000);
}

export function shouldAcceptBooking(_seed?: string): boolean {
  if (DEMO_MODE) return true;
  if (_seed) {
    let h = 0;
    for (let i = 0; i < _seed.length; i++) h = (h * 31 + _seed.charCodeAt(i)) >>> 0;
    return h % 100 < 70;
  }
  return Math.random() < 0.7;
}

export function bookingStatusLabel(status: MockBooking["status"]): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "confirmed":
      return "Confirmed";
    case "declined":
      return "Declined";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
  }
}

export function paymentStatusLabel(status: MockBooking["paymentStatus"]): string {
  switch (status) {
    case "none":
      return "Not charged";
    case "authorized":
      return "Payment Authorized";
    case "released":
      return "Payment Released";
    case "refunded":
      return "Payment Refunded";
  }
}
