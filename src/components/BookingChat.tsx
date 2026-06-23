"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useMockApp } from "@/context/MockAppContext";
import { CHAT_QUICK_PROMPTS } from "@/lib/mock/simulation";
import type { MockBooking } from "@/lib/mock/types";

type BookingChatProps = {
  booking: MockBooking;
};

export function BookingChat({ booking }: BookingChatProps) {
  const { user, getChatMessages, sendChatMessage } = useMockApp();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [providerTyping, setProviderTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const messages = getChatMessages(booking.id);
  const chatEnabled =
    booking.status === "confirmed" || booking.status === "completed";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, providerTyping]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  if (!chatEnabled) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
        Chat opens once the provider confirms your booking.
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setError(null);

    startTransition(async () => {
      const result = await sendChatMessage(booking.id, text.trim());
      if (result.error) {
        setError(result.error);
        return;
      }
      setText("");
      if (user?.role === "customer") {
        setProviderTyping(true);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setProviderTyping(false), 3500);
      }
    });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-4 py-2">
        <p className="text-sm font-medium text-gray-900">Messages</p>
        <p className="text-xs text-gray-500">Chat with {booking.providerName}</p>
      </div>

      <div className="max-h-56 space-y-2 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-gray-400">
            Ask about arrival time, pricing, or access details.
          </p>
        )}
        {messages.map((msg) => {
          const isMine =
            (user?.role === "customer" && msg.senderRole === "customer") ||
            (user?.role === "provider" && msg.senderRole === "provider");
          return (
            <div
              key={msg.id}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  isMine
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {!isMine && (
                  <p className="mb-0.5 text-xs font-medium opacity-70">
                    {msg.senderName}
                  </p>
                )}
                <p>{msg.text}</p>
              </div>
            </div>
          );
        })}
        {providerTyping && user?.role === "customer" && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-gray-100 px-3 py-2 text-sm text-gray-500">
              {booking.providerName} is typing…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-gray-100 p-3">
        <div className="mb-2 flex flex-wrap gap-1">
          {CHAT_QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => setText(prompt)}
              className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-200"
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
            className="input-field flex-1"
            disabled={pending}
          />
          <button
            type="submit"
            disabled={pending || !text.trim()}
            className="btn-primary shrink-0 px-4 disabled:opacity-60"
          >
            {pending ? "…" : "Send"}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </form>
    </div>
  );
}
