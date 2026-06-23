"use client";

import { useEffect, useState } from "react";

const ACTIVITIES = [
  { emoji: "🧹", text: "Sarah just booked a house cleaner in Brooklyn" },
  { emoji: "🔧", text: "Mike hired a plumber — 2.1 miles away" },
  { emoji: "⚡", text: "Emily found an electrician available today" },
  { emoji: "🎨", text: "James booked a painter for tomorrow" },
  { emoji: "🌿", text: "Lisa scheduled lawn mowing nearby" },
  { emoji: "💻", text: "Alex got computer repair in under 30 mins" },
  { emoji: "🍳", text: "Priya booked a private chef for this weekend" },
  { emoji: "🚗", text: "Tom found a mobile mechanic 1.8 mi away" },
];

export function LiveActivity() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % ACTIVITIES.length);
        setVisible(true);
      }, 300);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  const activity = ACTIVITIES[index]!;

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
          <p className="text-xs font-medium text-green-700">Live activity</p>
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
