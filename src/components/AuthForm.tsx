"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMockApp, DEFAULT_DEMO_PASSWORD } from "@/context/MockAppContext";
import type { SignupRoles } from "@/context/MockAppContext";

type AuthFormProps = {
  redirectTo?: string;
  defaultMode?: "login" | "signup";
};

type SignupChoice = "customer" | "provider" | "both";

function rolesFromChoice(choice: SignupChoice): SignupRoles {
  if (choice === "both") return { customerRole: true, providerRole: true };
  if (choice === "provider") return { customerRole: false, providerRole: true };
  return { customerRole: true, providerRole: false };
}

export function AuthForm({ redirectTo = "/", defaultMode = "login" }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : defaultMode;
  const { login, register, loading, ready } = useMockApp();
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [signupChoice, setSignupChoice] = useState<SignupChoice>("customer");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (mode === "signup") {
      const result = await register(
        { firstName, lastName, email, phoneNumber, address, password },
        rolesFromChoice(signupChoice)
      );
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

  const roles = rolesFromChoice(signupChoice);

  return (
    <div className="card mx-auto w-full max-w-md bg-white p-8 shadow-md">
      <div className="mb-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </p>
        <p className="mt-1 text-sm text-gray-600">
          {mode === "signup"
            ? "One account can book services, offer services, or both. Switch modes anytime."
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  First name
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input-field"
                  placeholder="Jane"
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Last name
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input-field"
                  placeholder="Smith"
                  autoComplete="family-name"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Phone number
              </label>
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="input-field"
                placeholder="(555) 123-4567"
                autoComplete="tel"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="input-field"
                placeholder="123 Oak Street, Springfield, IL 62701"
                autoComplete="street-address"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                I want to
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["customer", "Customer"],
                    ["provider", "Provider"],
                    ["both", "Both"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSignupChoice(value)}
                    className={`rounded-xl border px-2 py-2.5 text-xs transition-all duration-200 sm:text-sm ${
                      signupChoice === value
                        ? "border-green-600 bg-green-100 font-medium text-green-800"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-gray-500">
                {signupChoice === "both"
                  ? "Book services and receive job requests on one account. Switch modes from the header."
                  : signupChoice === "provider"
                    ? "Access your provider dashboard instantly. Admin verification adds the trusted badge."
                    : "Book local pros, track bookings, and leave reviews."}
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
              : roles.providerRole && roles.customerRole
                ? "Create account (Customer + Provider)"
                : roles.providerRole
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
