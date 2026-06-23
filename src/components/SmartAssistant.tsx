"use client";

import { useState, useRef, useEffect } from "react";
import { ChatProviderCard } from "./ChatProviderCard";
import type { ProviderCardData } from "@/lib/providers";

type Message = {
  role: "user" | "assistant";
  text: string;
  providers?: ProviderCardData[];
  service?: string;
};

export function SmartAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hi! I'm your HomeServe assistant. Tell me what's going on — like \"my sink is leaking badly\" — and I'll find the right pro for you.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: data.message.replace(/\*\*(.*?)\*\*/g, "$1"),
          providers: data.providers,
          service: data.service,
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: "Sorry, I had trouble with that. Try describing your issue differently, or browse categories below.",
        },
      ]);
    } finally {
      setLoading(false);
    }
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

      <div className="flex h-80 flex-col bg-gradient-to-b from-gray-50 to-white">
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
                <p>{msg.text}</p>
                {msg.providers && msg.providers.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-gray-500">Top matches for you:</p>
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
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='e.g. "My sink is leaking badly"'
              className="input-field flex-1"
            />
            <button type="submit" disabled={loading} className="btn-primary shrink-0 disabled:opacity-60">
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
