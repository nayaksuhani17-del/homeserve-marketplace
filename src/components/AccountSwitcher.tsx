"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMockApp } from "@/context/MockAppContext";
import { capabilitySummary, roleBadgeClass, type AccountSummary } from "@/lib/accounts";
import type { SignupRoles } from "@/context/MockAppContext";

type SignupChoice = "customer" | "provider" | "both";

function rolesFromChoice(choice: SignupChoice): SignupRoles {
  if (choice === "both") return { customerRole: true, providerRole: true };
  if (choice === "provider") return { customerRole: false, providerRole: true };
  return { customerRole: true, providerRole: false };
}

export function AccountSwitcher() {
  const router = useRouter();
  const { user, ready, loading, listAccounts, switchAccount, register, deleteMyAccount } =
    useMockApp();
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const [createFirstName, setCreateFirstName] = useState("");
  const [createLastName, setCreateLastName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createAddress, setCreateAddress] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createSignupChoice, setCreateSignupChoice] = useState<SignupChoice>("customer");
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const accounts = listAccounts();
  const filteredAccounts = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.role.includes(q)
    );
  }, [accounts, filterQuery]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowCreate(false);
        setFilterQuery("");
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  async function handleSwitch(userId: string) {
    if (!ready || busyId) return;
    setBusyId(userId);
    const result = await switchAccount(userId);
    setBusyId(null);
    if (result.error) return;
    setOpen(false);
    setShowCreate(false);
    setFilterQuery("");
    if (result.redirect) {
      router.push(result.redirect);
      router.refresh();
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || creating) return;
    setCreateError(null);
    setCreating(true);
    const result = await register(
      {
        firstName: createFirstName,
        lastName: createLastName,
        email: createEmail,
        phoneNumber: createPhone,
        address: createAddress,
        password: createPassword,
      },
      rolesFromChoice(createSignupChoice)
    );
    setCreating(false);
    if (result.error) {
      setCreateError(result.error);
      return;
    }
    setCreateFirstName("");
    setCreateLastName("");
    setCreateEmail("");
    setCreatePhone("");
    setCreateAddress("");
    setCreatePassword("");
    setCreateSignupChoice("customer");
    setShowCreate(false);
    setOpen(false);
    setFilterQuery("");
    if (result.redirect) {
      router.push(result.redirect);
      router.refresh();
    }
  }

  async function handleDeleteAccount() {
    if (!ready || deleting) return;
    setDeleteError(null);
    setDeleting(true);
    const result = await deleteMyAccount();
    setDeleting(false);
    if (result.error) {
      setDeleteError(result.error);
      return;
    }
    setDeleteConfirm(false);
    setOpen(false);
    setFilterQuery("");
    router.push("/");
    router.refresh();
  }

  function scrollToFooter() {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={!ready || loading}
        className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-900 shadow-sm transition hover:border-green-300 hover:bg-green-100 disabled:opacity-50"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {user ? (
          <>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-600 to-emerald-500 text-[10px] font-bold text-white">
              {user.name.charAt(0)}
            </span>
            <span className="hidden max-w-[100px] truncate sm:inline">{user.name.split(" ")[0]}</span>
          </>
        ) : null}
        <span>Switch Account</span>
        <span className="text-green-700/60" aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close account switcher"
            className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent"
            onClick={() => {
              setOpen(false);
              setShowCreate(false);
              setFilterQuery("");
            }}
          />

          <div className="fixed inset-x-3 top-[4.25rem] z-50 flex max-h-[calc(100dvh-5.5rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:max-h-[min(85dvh,640px)] sm:w-[min(100vw-2rem,24rem)]">
            <div className="shrink-0 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">Switch account</p>
                  <p className="text-xs text-gray-600">
                    {accounts.length} account{accounts.length === 1 ? "" : "s"} · demo and yours
                    share one workspace
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setShowCreate(false);
                    setFilterQuery("");
                  }}
                  className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-white/80"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              {accounts.length > 5 && (
                <div className="input-with-icon mt-3">
                  <span className="input-icon-slot text-sm" aria-hidden>
                    🔍
                  </span>
                  <input
                    type="search"
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    placeholder="Filter by name, email, or role…"
                    className="input-field py-2 text-sm"
                  />
                </div>
              )}
            </div>

            <div
              ref={scrollRef}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <div className="p-2">
                {accounts.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-gray-500">
                    No accounts yet — create one below
                  </p>
                ) : filteredAccounts.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-gray-500">
                    No accounts match &quot;{filterQuery}&quot;
                  </p>
                ) : (
                  <ul className="space-y-1" role="listbox">
                    {filteredAccounts.map((account) => (
                      <AccountRow
                        key={account.id}
                        account={account}
                        busy={busyId === account.id}
                        onSwitch={() => handleSwitch(account.id)}
                      />
                    ))}
                  </ul>
                )}
              </div>

              {accounts.length > 8 && !showCreate && (
                <div className="px-4 pb-2">
                  <button
                    type="button"
                    onClick={scrollToFooter}
                    className="w-full rounded-lg border border-dashed border-gray-200 py-2 text-xs font-medium text-gray-500 hover:border-green-300 hover:text-green-700"
                  >
                    ↓ Jump to create / delete account
                  </button>
                </div>
              )}

              <div className="border-t border-gray-100 bg-gray-50 p-3">
                {showCreate ? (
                  <form onSubmit={handleCreate} className="space-y-3">
                    <p className="text-sm font-semibold text-gray-900">Create new account</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        value={createFirstName}
                        onChange={(e) => setCreateFirstName(e.target.value)}
                        className="input-field text-sm"
                        placeholder="First name"
                      />
                      <input
                        type="text"
                        required
                        value={createLastName}
                        onChange={(e) => setCreateLastName(e.target.value)}
                        className="input-field text-sm"
                        placeholder="Last name"
                      />
                    </div>
                    <input
                      type="email"
                      required
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                      className="input-field text-sm"
                      placeholder="Email"
                    />
                    <input
                      type="tel"
                      required
                      value={createPhone}
                      onChange={(e) => setCreatePhone(e.target.value)}
                      className="input-field text-sm"
                      placeholder="Phone number"
                    />
                    <input
                      type="text"
                      required
                      value={createAddress}
                      onChange={(e) => setCreateAddress(e.target.value)}
                      className="input-field text-sm"
                      placeholder="Address"
                    />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={createPassword}
                      onChange={(e) => setCreatePassword(e.target.value)}
                      className="input-field text-sm"
                      placeholder="Password (6+ chars)"
                    />
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
                          onClick={() => setCreateSignupChoice(value)}
                          className={`rounded-lg border px-2 py-2 text-xs font-medium transition ${
                            createSignupChoice === value
                              ? "border-green-600 bg-green-100 text-green-800"
                              : "border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {createError && (
                      <p className="rounded-lg bg-red-50 px-2 py-1.5 text-xs text-red-700">
                        {createError}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={creating || !ready}
                        className="btn-primary flex-1 py-2 text-sm disabled:opacity-60"
                      >
                        {creating ? "Creating…" : "Create & switch"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCreate(false)}
                        className="rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreate(true);
                        requestAnimationFrame(() => scrollToFooter());
                      }}
                      className="w-full rounded-xl border border-dashed border-green-300 bg-white px-3 py-2.5 text-sm font-medium text-green-800 transition hover:border-green-400 hover:bg-green-50"
                    >
                      + Create new account
                    </button>
                    <Link
                      href="/login?mode=signup"
                      onClick={() => setOpen(false)}
                      className="text-center text-xs text-gray-500 hover:text-green-700"
                    >
                      Or open full sign-up page
                    </Link>
                    {user && (
                      <div className="mt-3 border-t border-gray-200 pt-3">
                        {!deleteConfirm ? (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm(true)}
                            className="w-full rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            Delete My Account
                          </button>
                        ) : (
                          <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3">
                            <p className="text-xs text-red-800">
                              Are you sure you want to delete this account? This cannot be undone.
                            </p>
                            {deleteError && (
                              <p className="text-xs text-red-700">{deleteError}</p>
                            )}
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={deleting}
                                onClick={handleDeleteAccount}
                                className="flex-1 rounded-lg bg-red-600 px-2 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                              >
                                {deleting ? "Deleting…" : "Yes, delete"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteConfirm(false);
                                  setDeleteError(null);
                                }}
                                className="rounded-lg px-2 py-1.5 text-xs text-gray-600 hover:bg-white"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function AccountRow({
  account,
  busy,
  onSwitch,
}: {
  account: AccountSummary;
  busy: boolean;
  onSwitch: () => void;
}) {
  return (
    <li
      className={`flex items-center gap-2 rounded-xl px-2 py-2 transition ${
        account.isActive ? "bg-green-50 ring-1 ring-green-200" : "hover:bg-gray-50"
      }`}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-600 to-emerald-500 text-xs font-bold text-white">
        {account.name.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate text-sm font-medium text-gray-900">{account.name}</p>
          {account.isDemo && (
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-gray-500">
              Demo
            </span>
          )}
          {account.isActive && (
            <span className="rounded bg-green-200 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-green-900">
              Current
            </span>
          )}
        </div>
        <p className="truncate text-xs text-gray-500">{account.email}</p>
        <span
          className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${roleBadgeClass(account.role)}`}
        >
          {account.capabilities}
        </span>
      </div>
      <button
        type="button"
        onClick={onSwitch}
        disabled={busy || account.isActive}
        className="shrink-0 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700 disabled:cursor-default disabled:bg-gray-200 disabled:text-gray-500"
      >
        {busy ? "…" : account.isActive ? "Active" : "Switch"}
      </button>
    </li>
  );
}
