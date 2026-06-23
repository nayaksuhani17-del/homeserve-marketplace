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

export function SmartAssistant() {
  const { assist, ready } = useMockApp();
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Need help finding the right pro? Describe your issue and I'll suggest top matches.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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
    <div className="card overflow-hidden bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 border-b border-green-100 bg-green-50 px-6 py-4 text-left transition-colors hover:bg-green-100/80"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-600 text-sm text-white">
            ?
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Need help choosing?</h2>
            <p className="text-sm text-gray-600">Optional assistant — describe your problem for quick matches</p>
          </div>
        </div>
        <span className="text-sm text-green-700">{expanded ? "Hide" : "Open"}</span>
      </button>

      {expanded && (
        <div className="flex h-80 flex-col bg-gradient-to-b from-gray-50 to-white">
          <div className="flex flex-wrap gap-2 border-b border-gray-100 px-4 py-3">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => ask(prompt)}
                disabled={loading || !ready}
                className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-green-800 ring-1 ring-green-200 transition hover:bg-green-50 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
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
                  {msg.providers && msg.providers.length > 0 && (
                    <div className="mt-3 space-y-2">
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
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder='Describe your issue…'
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
