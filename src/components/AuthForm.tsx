"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMockApp, DEFAULT_DEMO_PASSWORD } from "@/context/MockAppContext";
import type { UserRole } from "@/lib/constants";

type AuthFormProps = {
  redirectTo?: string;
  defaultMode?: "login" | "signup";
};

export function AuthForm({ redirectTo = "/", defaultMode = "login" }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : defaultMode;
  const { login, register, loading, ready } = useMockApp();
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Exclude<UserRole, "admin">>("customer");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (mode === "signup") {
      const result = await register(name, email, password, role);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      router.push(result.redirect ?? "/customer/dashboard");
      router.refresh();
      return;
    }

    const result = await login(email, password, redirectTo);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    router.push(result.redirect ?? "/customer/dashboard");
    router.refresh();
  }

  return (
    <div className="card mx-auto w-full max-w-md bg-white p-8 shadow-md">
      <div className="mb-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </p>
        <p className="mt-1 text-sm text-gray-600">
          {mode === "signup"
            ? "Join HomeServe as a customer or service provider. Your data stays saved in this browser."
            : "Sign in to book services, manage jobs, or access your dashboard."}
        </p>
      </div>

      <div className="mb-6 flex rounded-xl bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-200 ${
            mode === "login" ? "bg-white text-gray-900 shadow" : "text-gray-500"
          }`}
        >
          Log in
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-200 ${
            mode === "signup" ? "bg-white text-gray-900 shadow" : "text-gray-500"
          }`}
        >
          Sign up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Full name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                I am a
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["customer", "provider"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`rounded-xl border px-4 py-2.5 text-sm transition-all duration-200 ${
                      role === r
                        ? "border-green-600 bg-green-100 font-medium text-green-800"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {r === "customer" ? "Customer" : "Service Provider"}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-gray-500">
                {role === "provider"
                  ? "Provider profiles are verified instantly and visible to customers."
                  : "Book verified pros, track bookings, and leave reviews."}
              </p>
            </div>
          </>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
        </div>

        {message && (
          <p
            className={`rounded-lg px-3 py-2 text-sm ${
              message.includes("Welcome") || message.includes("created")
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !ready}
          className="btn-primary w-full py-3 disabled:opacity-60"
        >
          {loading
            ? "Please wait…"
            : mode === "login"
              ? "Log in"
              : role === "provider"
                ? "Create provider account"
                : "Create customer account"}
        </button>
      </form>

      <p className="mt-4 rounded-xl bg-gray-50 px-3 py-2 text-center text-xs text-gray-500">
        Demo seed accounts use password{" "}
        <code className="font-mono text-gray-700">{DEFAULT_DEMO_PASSWORD}</code>
      </p>
    </div>
  );
}
