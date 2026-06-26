"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMockApp } from "@/context/MockAppContext";
import { ChatView } from "@/components/chat/ChatView";
import { ProfileNameLink } from "@/components/ProfileNameLink";
import {
  customerMessagesHref,
  providerMessagesHref,
} from "@/lib/notification-links";
import {
  hasCustomerRole,
  hasProviderRole,
  isAdmin,
} from "@/lib/user-capabilities";

type MessagingMode = "customer" | "provider";

type MessagingDashboardClientProps = {
  mode: MessagingMode;
};

function formatPreviewTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  if (sameDay) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function MessagingDashboardClient({ mode }: MessagingDashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatParam = searchParams.get("chat");
  const { user, ready, db, listConversations } = useMockApp();

  const basePath =
    mode === "customer" ? "/customer/messages" : "/provider/messages";
  const hrefForChat = (otherUserId: string) =>
    mode === "customer"
      ? customerMessagesHref(otherUserId)
      : providerMessagesHref(otherUserId);

  const conversations = useMemo(() => listConversations(), [listConversations]);

  const selectedId = chatParam;
  const selectedName = useMemo(() => {
    if (!selectedId || !db) return null;
    const fromList = conversations.find((c) => c.otherUserId === selectedId);
    if (fromList) return fromList.otherUserName;
    return db.users.find((u) => u.id === selectedId)?.name ?? null;
  }, [selectedId, db, conversations]);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(basePath)}`);
      return;
    }
    if (isAdmin(user)) {
      router.replace("/admin");
      return;
    }
    if (mode === "customer" && !hasCustomerRole(user)) {
      router.replace("/provider/messages");
      return;
    }
    if (mode === "provider" && !hasProviderRole(user)) {
      router.replace("/customer/messages");
      return;
    }
  }, [ready, user, mode, router, basePath]);

  function selectConversation(otherUserId: string) {
    router.replace(hrefForChat(otherUserId), { scroll: false });
  }

  if (!ready || !user) {
    return (
      <div className="flex min-h-[calc(100dvh-9rem)] items-center justify-center bg-white">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-100" />
      </div>
    );
  }

  const emptyLabel =
    mode === "customer"
      ? "Message a provider from a booking or profile to start chatting."
      : "Message a customer from a job request to start chatting.";

  return (
    <div className="flex min-h-[calc(100dvh-9rem)] w-full flex-col bg-white md:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-b border-gray-200 bg-[#f7f7f8] md:w-72 md:border-b-0 md:border-r lg:w-80">
        <div className="border-b border-gray-200 px-4 py-4">
          <h1 className="text-lg font-semibold text-gray-900">Messages</h1>
          <p className="mt-0.5 text-xs text-gray-500">
            {mode === "customer" ? "Your providers" : "Your customers"}
          </p>
        </div>

        <div className="max-h-56 overflow-y-auto md:max-h-none md:flex-1">
          {conversations.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-400">
              No conversations yet.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {conversations.map((c) => {
                const active = selectedId === c.otherUserId;
                return (
                  <li
                    key={c.otherUserId}
                    className={`px-4 py-3 transition hover:bg-white/80 ${
                      active ? "bg-white shadow-sm ring-1 ring-inset ring-gray-200" : ""
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <ProfileNameLink
                        userId={c.otherUserId}
                        name={c.otherUserName}
                        returnTo={hrefForChat(c.otherUserId)}
                        className="truncate text-sm"
                      />
                      <span className="shrink-0 text-[10px] text-gray-400">
                        {formatPreviewTime(c.lastTimestamp)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => selectConversation(c.otherUserId)}
                      className="mt-0.5 w-full truncate text-left text-xs text-gray-500 transition hover:text-gray-800"
                    >
                      {c.lastMessage}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      <main className="flex min-h-[320px] flex-1 flex-col">
        {selectedId && selectedName ? (
          <ChatView
            key={selectedId}
            otherUserId={selectedId}
            otherUserName={selectedName}
            layout="panel"
            profileReturnTo={hrefForChat(selectedId)}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <p className="text-4xl" aria-hidden>
              💬
            </p>
            <p className="mt-4 text-sm font-medium text-gray-700">
              Select a conversation
            </p>
            <p className="mt-1 max-w-sm text-sm text-gray-500">{emptyLabel}</p>
          </div>
        )}
      </main>
    </div>
  );
}
