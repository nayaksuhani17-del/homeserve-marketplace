"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMockApp } from "@/context/MockAppContext";
import { DEMO_ROLE_REDIRECT } from "@/lib/demo/mode";

const DEMO_ACCOUNTS = [
  {
    label: "Enter Demo as Customer",
    shortLabel: "Customer",
    role: "customer" as const,
    icon: "🏠",
    description: "Search, book, and review pros",
  },
  {
    label: "Enter Demo as Provider",
    shortLabel: "Provider",
    role: "provider" as const,
    icon: "🔧",
    description: "Manage jobs and schedule",
  },
  {
    label: "Enter Demo as Admin",
    shortLabel: "Admin",
    role: "admin" as const,
    icon: "🛡️",
    description: "Moderate and approve providers",
  },
];

export function DemoSwitcher() {
  const router = useRouter();
  const { demoLogin, loading, ready } = useMockApp();
  const [busy, setBusy] = useState(false);

  async function switchAccount(role: "customer" | "provider" | "admin") {
    if (!ready) return;
    setBusy(true);
    const result = await demoLogin(role);
    if (result.redirect) {
      router.push(result.redirect);
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-xs text-green-700 sm:inline">Demo:</span>
      <select
        disabled={!ready || loading || busy}
        defaultValue=""
        onChange={(e) => {
          const role = e.target.value as "customer" | "provider" | "admin";
          if (role) switchAccount(role);
          e.target.value = "";
        }}
        className="max-w-[140px] rounded-lg border border-green-200 bg-green-50 px-2 py-1 text-xs text-green-900 sm:max-w-none"
      >
        <option value="">Switch account…</option>
        {DEMO_ACCOUNTS.map((account) => (
          <option key={account.role} value={account.role}>
            {account.shortLabel}
          </option>
        ))}
      </select>
    </div>
  );
}

export function HomeDemoButtons() {
  const router = useRouter();
  const { demoLogin, loading, ready, user } = useMockApp();
  const [active, setActive] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function enterAs(role: "customer" | "provider" | "admin") {
    if (!ready) return;
    setActive(role);
    setError(null);
    const result = await demoLogin(role, DEMO_ROLE_REDIRECT[role]);
    if (result.error) {
      setError(result.error);
    } else if (result.redirect) {
      router.push(result.redirect);
      router.refresh();
    }
    setActive(null);
  }

  return (
    <div className="mt-8">
      {user && (
        <p className="mb-3 text-sm text-gray-600">
          Signed in as <span className="font-semibold text-gray-900">{user.name}</span>
          {" — "}
          switch role to continue the demo:
        </p>
      )}
      {!user && (
        <p className="text-sm font-medium text-gray-700">Try the live demo — no signup required</p>
      )}
      {error && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      <div className={`grid gap-3 sm:grid-cols-3 ${user ? "mt-2" : "mt-3"}`}>
        {DEMO_ACCOUNTS.map((account) => (
          <button
            key={account.role}
            type="button"
            disabled={!ready || loading || active !== null}
            onClick={() => enterAs(account.role)}
            className={`card card-hover group flex flex-col items-start bg-white p-4 text-left transition-all disabled:opacity-60 ${
              user?.role === account.role ? "ring-2 ring-green-500" : ""
            }`}
          >
            <span className="text-2xl" aria-hidden>
              {account.icon}
            </span>
            <span className="mt-2 font-semibold text-gray-900 group-hover:text-green-700">
              {active === account.role ? "Signing in…" : account.label}
            </span>
            <span className="mt-1 text-xs text-gray-500">{account.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function DemoLoginButtons({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const { demoLogin, loading, ready } = useMockApp();
  const [active, setActive] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loginAs(role: "customer" | "provider" | "admin") {
    if (!ready) return;
    setActive(role);
    setError(null);
    const result = await demoLogin(role, redirectTo ?? DEMO_ROLE_REDIRECT[role]);
    if (result.error) {
      setError(result.error);
    } else if (result.redirect) {
      router.push(result.redirect);
      router.refresh();
    }
    setActive(null);
  }

  return (
    <div className="card mx-auto mt-8 max-w-md border-green-200 bg-green-50 p-6">
      <h2 className="text-center font-semibold text-green-900">Quick demo login</h2>
        <p className="mt-1 text-center text-sm text-green-800">
          One-click demo access — or create your own account above.
        </p>
      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="mt-4 flex flex-col gap-2">
        {DEMO_ACCOUNTS.map((account) => (
          <button
            key={account.role}
            type="button"
            disabled={!ready || loading || active !== null}
            onClick={() => loginAs(account.role)}
            className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-green-900 shadow-sm ring-1 ring-green-200 transition-all duration-200 hover:bg-green-100 disabled:opacity-50"
          >
            {!ready
              ? "Loading demo…"
              : active === account.role
                ? "Signing in…"
                : account.label}
          </button>
        ))}
      </div>
    </div>
  );
}
