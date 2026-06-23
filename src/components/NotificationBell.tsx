"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMockApp } from "@/context/MockAppContext";

export function NotificationBell() {
  const { user, getNotifications, unreadNotificationCount, markNotificationsRead } =
    useMockApp();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  if (!user) return null;

  const notifications = getNotifications();

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) markNotificationsRead();
        }}
        className="relative rounded-lg p-2 transition hover:bg-gray-100"
        aria-label="Notifications"
      >
        <span className="text-lg">🔔</span>
        {unreadNotificationCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="font-semibold text-gray-900">Notifications</p>
            <p className="text-xs text-gray-500">Bookings, payments & platform updates</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-400">
                No notifications yet
              </p>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <div
                  key={n.id}
                  className={`border-b border-gray-50 px-4 py-3 text-sm ${
                    n.read ? "bg-white" : "bg-green-50/50"
                  }`}
                >
                  <p className="font-medium text-gray-900">{n.title}</p>
                  <p className="mt-0.5 text-gray-600">{n.message}</p>
                  {n.href && (
                    <Link
                      href={n.href}
                      onClick={() => setOpen(false)}
                      className="mt-1 inline-block text-xs font-medium text-green-700 hover:underline"
                    >
                      View →
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
