"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { ChatProviderCard } from "./ChatProviderCard";
import { useMockApp } from "@/context/MockAppContext";
import { simulateDelay } from "@/lib/mock/operations";
import type { ProviderCardData } from "@/lib/providers";

const STARTER_PROMPTS = [
  "My kitchen sink is leaking",
  "Need a house cleaner today",
  "Affordable electrician near me",
];

type Message = {
  role: "user" | "assistant";
  text: string;
  providers?: ProviderCardData[];
  service?: string;
};

export function SmartAssistant({ compact = false }: { compact?: boolean }) {
  const { assist, ready } = useMockApp();
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Describe your issue and I'll suggest matching pros.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!expanded) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, expanded]);

  function ask(text: string) {
    if (!text.trim() || loading || !ready) return;
    setExpanded(true);
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);

    startTransition(async () => {
      await simulateDelay(280);
      const data = assist(text);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: data.message.replace(/\*\*(.*?)\*\*/g, "$1"),
          providers: data.providers,
          service: data.service,
        },
      ]);
      setLoading(false);
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    ask(input);
  }

  return (
    <div className={`overflow-hidden rounded-xl border border-gray-200 bg-gray-50 ${compact ? "" : "card"}`}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-gray-100/80"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-600 text-sm text-white">
            ?
          </span>
          <div className="min-w-0">
            <p className="font-medium text-gray-900">Need help choosing?</p>
            <p className="truncate text-sm text-gray-500">
              Optional assistant — quick pro suggestions
            </p>
          </div>
        </div>
        <span className="shrink-0 text-sm text-green-700">{expanded ? "Hide" : "Open"}</span>
      </button>

      {expanded && (
        <div className="flex h-72 flex-col border-t border-gray-200 bg-white">
          <div className="flex flex-wrap gap-2 border-b border-gray-100 px-3 py-2">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => ask(prompt)}
                disabled={loading || !ready}
                className="rounded-full bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200 transition hover:bg-green-50 hover:text-green-800 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-green-600 text-white"
                      : "bg-gray-50 text-gray-700 ring-1 ring-gray-200"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  {msg.providers && msg.providers.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {msg.providers.slice(0, 3).map((p) => (
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
                <div className="rounded-xl bg-gray-50 px-3 py-2 ring-1 ring-gray-200">
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-green-500 [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-green-500 [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-green-500 [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t border-gray-200 p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe your issue…"
                className="input-field min-w-0 flex-1"
                disabled={!ready}
              />
              <button type="submit" disabled={loading || !ready} className="btn-primary shrink-0 disabled:opacity-60">
                Ask
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
