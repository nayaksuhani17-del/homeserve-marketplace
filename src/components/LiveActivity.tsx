"use client";

import { useEffect, useMemo, useState } from "react";
import { getServiceMeta } from "@/lib/services";
import { SYSTEM_EVENT } from "@/context/MockAppContext";
import type { SystemEvent } from "@/lib/mock/types";

const ACTIVITY_TEMPLATES = [
  { emoji: "🧹", text: "Someone just booked a {service} near you" },
  { emoji: "🔧", text: "{name} hired a plumber — 2.1 miles away" },
  { emoji: "⚡", text: "3 people are viewing an electrician right now" },
  { emoji: "🎨", text: "James booked a painter for tomorrow" },
  { emoji: "🌿", text: "Lisa scheduled lawn mowing nearby" },
];

const EVENT_EMOJI: Record<SystemEvent["type"], string> = {
  booking_accepted: "✅",
  booking_declined: "❌",
  booking_created: "📅",
  booking_cancelled: "🚫",
  job_completed: "🏁",
  payment: "💳",
  report: "🛡️",
};

const NAMES = ["Sarah", "Mike", "Emily", "James", "Lisa"];
const SERVICES = ["House Cleaning", "Plumber", "Electrician", "Painting", "Lawn Mowing"];

type LiveItem = { emoji: string; text: string; live?: boolean };

export function LiveActivity() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [liveItem, setLiveItem] = useState<LiveItem | null>(null);

  const activities = useMemo(
    () =>
      ACTIVITY_TEMPLATES.map((t, i) => {
        const service = SERVICES[i % SERVICES.length]!;
        const meta = getServiceMeta(service);
        return {
          emoji: t.emoji === "🧹" ? meta.icon : t.emoji,
          text: t.text
            .replace("{service}", service.toLowerCase())
            .replace("{name}", NAMES[i % NAMES.length]!),
        };
      }),
    []
  );

  useEffect(() => {
    function onSystemEvent(e: Event) {
      const detail = (e as CustomEvent<SystemEvent>).detail;
      if (!detail) return;
      setDismissed(false);
      setLiveItem({
        emoji: EVENT_EMOJI[detail.type] ?? "🔔",
        text: detail.message,
        live: true,
      });
      setVisible(true);
      setTimeout(() => setLiveItem(null), 6000);
    }

    window.addEventListener(SYSTEM_EVENT, onSystemEvent);
    return () => window.removeEventListener(SYSTEM_EVENT, onSystemEvent);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (liveItem || dismissed) return;
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % activities.length);
        setVisible(true);
      }, 300);
    }, 8000);
    return () => clearInterval(interval);
  }, [activities.length, liveItem, dismissed]);

  if (dismissed && !liveItem) return null;

  const activity = liveItem ?? activities[index]!;

  return (
    <div className="fixed bottom-4 left-4 z-40 hidden max-w-xs sm:block">
      <div
        className={`flex items-start gap-2.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-md transition-all duration-300 ${
          visible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
        }`}
      >
        <span className="text-base leading-none">{activity.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
            {liveItem?.live ? "Just now" : "Demo activity"}
          </p>
          <p className="text-xs text-gray-700">{activity.text}</p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 text-gray-400 hover:text-gray-600"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
