"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMockApp } from "@/context/MockAppContext";

const DEMO_ACCOUNTS = [
  { label: "Sarah Mitchell (Customer)", role: "customer" as const },
  { label: "Marcus Reed (Provider)", role: "provider" as const },
  { label: "Admin User", role: "admin" as const },
];

export function DemoSwitcher() {
  const router = useRouter();
  const { demoLogin, loading } = useMockApp();
  const [busy, setBusy] = useState(false);

  async function switchAccount(role: "customer" | "provider" | "admin") {
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
        disabled={loading || busy}
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
            {account.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function DemoLoginButtons() {
  const router = useRouter();
  const { demoLogin, loading } = useMockApp();
  const [active, setActive] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loginAs(role: "customer" | "provider" | "admin") {
    setActive(role);
    setError(null);
    const result = await demoLogin(role);
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
        One-click access — all data persists in localStorage.
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
            disabled={loading || active !== null}
            onClick={() => loginAs(account.role)}
            className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-green-900 shadow-sm ring-1 ring-green-200 transition-all duration-200 hover:bg-green-100 disabled:opacity-50"
          >
            {active === account.role ? "Signing in…" : account.label}
          </button>
        ))}
      </div>
    </div>
  );
}
