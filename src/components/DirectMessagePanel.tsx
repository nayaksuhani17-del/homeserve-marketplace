"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useMockApp } from "@/context/MockAppContext";
import { CHAT_QUICK_PROMPTS, providerHasAutoReply } from "@/lib/mock/simulation";
import type { StoredMessage } from "@/lib/messages/store";

type DirectMessagePanelProps = {
  otherUserId: string;
  otherUserName: string;
  onClose?: () => void;
  embedded?: boolean;
};

export function DirectMessagePanel({
  otherUserId,
  otherUserName,
  onClose,
  embedded,
}: DirectMessagePanelProps) {
  const { user, db, getDirectMessages, sendDirectMessage } = useMockApp();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const messages = getDirectMessages(otherUserId);
  const otherUser = db?.users.find((u) => u.id === otherUserId);
  const otherProvider = db?.providers.find((p) => p.userId === otherUserId);
  const autoReplyOn = providerHasAutoReply(otherProvider);

  const senderNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of db?.users ?? []) {
      map.set(u.id, u.name);
    }
    return map;
  }, [db?.users]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, typing]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  if (!user) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
        Log in to send messages.
      </div>
    );
  }

  if (!otherUser || otherUser.banned) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
        This user is no longer available. Their account has been removed from HomeServe.
      </div>
    );
  }

  if (user.id === otherUserId) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
        You cannot message yourself.
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setError(null);

    startTransition(async () => {
      const result = await sendDirectMessage(otherUserId, text.trim());
      if (result.error) {
        setError(result.error);
        return;
      }
      setText("");
      if (autoReplyOn) {
        setTyping(true);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setTyping(false), 3500);
      }
    });
  }

  const shellClass = embedded
    ? "rounded-xl border border-gray-200 bg-white"
    : "fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center";

  const panelClass = embedded
    ? ""
    : "w-full max-w-lg animate-slide-up rounded-2xl border border-gray-200 bg-white shadow-2xl";

  const content = (
    <div className={panelClass || shellClass}>
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">Message {otherUserName}</p>
          <p className="text-xs text-gray-500">Direct conversation — synced across accounts</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            ✕
          </button>
        )}
      </div>

      <div className="max-h-72 space-y-2 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-gray-400">
            Say hello — your message is saved and visible when they switch accounts.
          </p>
        )}
        {messages.map((msg: StoredMessage) => {
          const isMine = msg.sender_id === user.id;
          const senderLabel = senderNames.get(msg.sender_id) ?? otherUserName;
          return (
            <div
              key={msg.id}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  isMine
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                {!isMine && (
                  <p className="mb-0.5 text-[10px] font-medium opacity-70">{senderLabel}</p>
                )}
                <p>{msg.text}</p>
                <p
                  className={`mt-1 text-[10px] ${isMine ? "text-green-100" : "text-gray-400"}`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
        {typing && autoReplyOn && (
          <p className="text-xs text-gray-400 animate-pulse">{otherUserName} is typing…</p>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-gray-100 px-4 py-3">
        <div className="mb-2 flex flex-wrap gap-1">
          {CHAT_QUICK_PROMPTS.slice(0, 3).map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => setText(prompt)}
              className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600 hover:bg-green-50"
            >
              {prompt}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            className="input-field flex-1 text-sm"
            disabled={pending}
          />
          <button type="submit" disabled={pending || !text.trim()} className="btn-primary px-4 py-2 text-sm disabled:opacity-60">
            Send
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </form>
    </div>
  );

  if (embedded) return content;

  return (
    <div className={shellClass} role="dialog" aria-modal="true">
      {content}
    </div>
  );
}

type DirectMessageModalProps = {
  open: boolean;
  otherUserId: string;
  otherUserName: string;
  onClose: () => void;
};

export function DirectMessageModal({
  open,
  otherUserId,
  otherUserName,
  onClose,
}: DirectMessageModalProps) {
  if (!open) return null;
  return (
    <DirectMessagePanel
      otherUserId={otherUserId}
      otherUserName={otherUserName}
      onClose={onClose}
    />
  );
}
