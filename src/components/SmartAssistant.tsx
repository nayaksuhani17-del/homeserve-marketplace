"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { ChatProviderCard } from "./ChatProviderCard";
import { useMockApp } from "@/context/MockAppContext";
import { simulateDelay } from "@/lib/mock/operations";
import type { ProviderCardData } from "@/lib/providers";

type Message = {
  role: "user" | "assistant";
  text: string;
  providers?: ProviderCardData[];
  service?: string;
  chips?: string[];
};

export function SmartAssistant() {
  const { assist, ready } = useMockApp();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hi! I'm your HomeServe assistant. Tell me what's going on — like \"my AC is broken\" or \"cheap cleaner near me today\" — and I'll find the right pro instantly.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading || !ready) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);

    startTransition(async () => {
      await simulateDelay(500);
      const data = assist(text);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: data.message.replace(/\*\*(.*?)\*\*/g, "$1"),
          providers: data.providers,
          service: data.service,
          chips: data.chips,
        },
      ]);
      setLoading(false);
    });
  }

  return (
    <div className="card overflow-hidden shadow-md">
      <div className="border-b border-green-100 bg-gradient-to-r from-green-600 to-green-500 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-xl">
            ✨
          </div>
          <div>
            <h2 className="font-semibold text-white">Smart AI Assistant</h2>
            <p className="text-sm text-green-100">Describe your problem — get matched instantly</p>
          </div>
        </div>
      </div>

      <div className="flex h-96 flex-col bg-gradient-to-b from-gray-50 to-white">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-700 shadow-sm ring-1 ring-gray-200"
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>
                {msg.chips && msg.chips.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {msg.chips.map((chip) => (
                      <span
                        key={chip}
                        className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700 ring-1 ring-green-200"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                )}
                {msg.providers && msg.providers.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-gray-500">Recommended for you:</p>
                    {msg.providers.map((p) => (
                      <ChatProviderCard key={p.id} provider={p} compact />
                    ))}
                    {msg.service && (
                      <a
                        href={`/customer/dashboard?service=${encodeURIComponent(msg.service)}`}
                        className="mt-1 inline-block text-xs font-medium text-green-600 hover:underline"
                      >
                        View all {msg.service} providers →
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-200">
                <span className="inline-flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-green-500 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-green-500 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-green-500 [animation-delay:300ms]" />
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <div className="input-with-icon min-w-0 flex-1">
              <span className="input-icon-slot text-sm" aria-hidden>
                💬
              </span>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder='e.g. "cheap cleaner near me today"'
                className="input-field"
                disabled={!ready}
              />
            </div>
            <button type="submit" disabled={loading || !ready} className="btn-primary shrink-0 disabled:opacity-60">
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
