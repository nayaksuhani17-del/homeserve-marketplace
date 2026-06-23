"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMockApp, DEFAULT_DEMO_PASSWORD } from "@/context/MockAppContext";
import type { UserRole } from "@/lib/constants";

type AuthFormProps = {
  redirectTo?: string;
};

export function AuthForm({ redirectTo = "/" }: AuthFormProps) {
  const router = useRouter();
  const { login, register, loading, ready } = useMockApp();
  const [mode, setMode] = useState<"login" | "signup">("login");
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

    const result = await login(email, password);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    router.push(result.redirect ?? redirectTo ?? "/customer/dashboard");
    router.refresh();
  }

  return (
    <div className="card mx-auto w-full max-w-md bg-white p-8">
      <p className="mb-4 rounded-xl bg-green-50 px-3 py-2 text-center text-xs text-green-800">
        Local demo — data saved in your browser. Seed accounts use password{" "}
        <code className="font-mono">{DEFAULT_DEMO_PASSWORD}</code>
      </p>

      <div className="mb-6 flex rounded-xl bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-200 ${
            mode === "login" ? "bg-white text-gray-900 shadow" : "text-gray-500"
          }`}
        >
          Login
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
                    className={`rounded-xl border px-4 py-2.5 text-sm capitalize transition-all duration-200 ${
                      role === r
                        ? "border-green-600 bg-green-100 text-green-800"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {r === "customer" ? "Customer" : "Service Provider"}
                  </button>
                ))}
              </div>
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
          />
        </div>

        {message && (
          <p className={`text-sm ${message.includes("created") ? "text-green-600" : "text-red-500"}`}>
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !ready}
          className="btn-primary w-full disabled:opacity-60"
        >
          {loading ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>
    </div>
  );
}
