"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMockApp } from "@/context/MockAppContext";
import type { MockNotification } from "@/lib/mock/types";
import {
  chatHrefForUser,
  resolveNotificationHref,
  scrollToNotificationTarget,
} from "@/lib/notification-links";

export function NotificationBell() {
  const router = useRouter();
  const { user, getNotifications, unreadNotificationCount, markNotificationsRead, dbRevision } =
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

  void dbRevision;
  const notifications = getNotifications();

  function navigateFromNotification(n: MockNotification) {
    let target: string;

    if (n.type === "message") {
      const otherUserId = n.senderId;
      target = otherUserId
        ? chatHrefForUser(user!, otherUserId)
        : n.href
          ? resolveNotificationHref(n.href, n.message)
          : chatHrefForUser(user!, "");
    } else {
      target = resolveNotificationHref(n.href ?? "/", n.message);
    }

    setOpen(false);
    markNotificationsRead([n.id]);

    const url = new URL(target, window.location.origin);
    const samePath =
      window.location.pathname === url.pathname &&
      window.location.search === url.search;

    if (samePath && !url.searchParams.has("chat")) {
      scrollToNotificationTarget(target);
      return;
    }

    router.push(target);
    if (!url.searchParams.has("chat")) {
      window.setTimeout(() => scrollToNotificationTarget(target), 200);
    }
  }

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
            <p className="text-xs text-gray-500">Bookings, messages & platform updates</p>
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
                  {(n.href || n.type === "message") && (
                    <button
                      type="button"
                      onClick={() => navigateFromNotification(n)}
                      className="mt-1 inline-block text-xs font-medium text-green-700 hover:underline"
                    >
                      View →
                    </button>
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
