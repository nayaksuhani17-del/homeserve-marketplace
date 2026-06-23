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
  { emoji: "💻", text: "Alex got computer repair in under 30 mins" },
  { emoji: "🍳", text: "Priya booked a private chef for this weekend" },
  { emoji: "🚗", text: "Tom found a mobile mechanic 1.8 mi away" },
  { emoji: "✨", text: "Sarah saved a top-rated cleaner to favorites" },
  { emoji: "📦", text: "A family just booked a local move — same-day quote" },
];

const EVENT_EMOJI: Record<SystemEvent["type"], string> = {
  booking_accepted: "✅",
  booking_declined: "❌",
  booking_created: "📅",
  job_completed: "🏁",
  payment: "💳",
};

const NAMES = ["Sarah", "Mike", "Emily", "James", "Lisa", "Alex", "Priya", "Tom", "Nina", "David"];
const SERVICES = ["House Cleaning", "Plumber", "Electrician", "Painting", "Lawn Mowing"];

type LiveItem = { emoji: string; text: string; live?: boolean };

export function LiveActivity() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
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
      setLiveItem({
        emoji: EVENT_EMOJI[detail.type] ?? "🔔",
        text: detail.message,
        live: true,
      });
      setVisible(true);
      setTimeout(() => {
        setLiveItem(null);
      }, 8000);
    }

    window.addEventListener(SYSTEM_EVENT, onSystemEvent);
    return () => window.removeEventListener(SYSTEM_EVENT, onSystemEvent);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (liveItem) return;
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % activities.length);
        setVisible(true);
      }, 300);
    }, 6500);
    return () => clearInterval(interval);
  }, [activities.length, liveItem]);

  const activity = liveItem ?? activities[index]!;

  return (
    <div className="fixed bottom-4 left-4 z-40 hidden sm:block">
      <div
        className={`flex max-w-xs items-center gap-3 rounded-2xl border border-green-200 bg-white/95 px-4 py-3 text-sm shadow-lg backdrop-blur transition-all duration-300 ${
          visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-base">
          {activity.emoji}
        </span>
        <div>
          <p className="text-xs font-medium text-green-700">
            {liveItem?.live ? "Just now" : "Live activity"}
          </p>
          <p className="text-gray-700">{activity.text}</p>
        </div>
        <span className="relative ml-1 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
        </span>
      </div>
    </div>
  );
}
