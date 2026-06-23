import type { MockBooking, MockDatabase, MockProvider, ResponseSpeed } from "./types";
import { DEMO_MODE } from "@/lib/demo/mode";

export const DEFAULT_SLOTS = [
  "08:00",
  "10:00",
  "12:00",
  "14:00",
  "16:00",
  "18:00",
];

export function slotKey(date: string, time: string) {
  return `${date}:${time}`;
}

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

export function getAvailableSlots(
  db: MockDatabase,
  providerId: string,
  date: string
): string[] {
  const provider = db.providers.find((p) => p.id === providerId);
  const today = new Date().toISOString().split("T")[0]!;
  const now = new Date();
  const currentHour = now.getHours();

  return DEFAULT_SLOTS.filter((time) => {
    if (isSlotTaken(db, providerId, date, time)) return false;
    if (provider && isSlotBlocked(provider, date, time)) return false;
    if (date === today) {
      const hour = Number(time.split(":")[0]);
      if (hour <= currentHour) return false;
    }
    return true;
  });
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
  if (provider.availableToday) {
    const today = new Date().toISOString().split("T")[0]!;
    const todaySlots = getAvailableSlots(db, provider.id, today);
    if (todaySlots.length > 0) {
      return `Available today from ${todaySlots[0]}`;
    }
  }
  const next = getNextAvailableSlot(db, provider.id);
  if (next) return `Next opening: ${next.date} at ${next.time}`;
  return "Fully booked for the next week — try another provider.";
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
