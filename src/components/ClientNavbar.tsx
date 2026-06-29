"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandName";
import { useMockApp } from "@/context/MockAppContext";
import { AccountSwitcher } from "@/components/AccountSwitcher";
import { NotificationBell } from "@/components/NotificationBell";
import { ActiveModeControl, ActiveModeStrip } from "@/components/ModeSwitcher";
import { hasCustomerRole, hasProviderRole, isAdmin } from "@/lib/user-capabilities";

export function ClientNavbar() {
  const { user, logout, ready, activeMode } = useMockApp();
  const router = useRouter();

  function handleSignOut() {
    logout();
    router.push("/");
    router.refresh();
  }

  const showBrowse =
    (!user || !isAdmin(user)) &&
    (!user || activeMode === "customer" || activeMode === null);
  const showSaved = user && hasCustomerRole(user) && activeMode === "customer";
  const showProviderDash =
    user && hasProviderRole(user) && activeMode === "provider";
  const showAdmin = user && isAdmin(user);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
          <Link href="/" className="shrink-0">
            <BrandLogo />
          </Link>
          <nav className="flex min-w-0 items-center gap-1 text-sm font-medium text-gray-600 sm:gap-2">
            {showBrowse && (
              <Link
                href="/customer/dashboard"
                className="hidden rounded-lg px-2.5 py-1.5 transition hover:bg-gray-50 hover:text-green-700 sm:inline"
              >
                Browse
              </Link>
            )}
            {showSaved && (
              <Link
                href="/customer/saved"
                className="hidden rounded-lg px-2.5 py-1.5 transition hover:bg-gray-50 hover:text-green-700 md:inline"
              >
                Saved
              </Link>
            )}
            {showSaved && (
              <Link
                href="/customer/messages"
                className="hidden rounded-lg px-2.5 py-1.5 transition hover:bg-gray-50 hover:text-green-700 md:inline"
              >
                Messages
              </Link>
            )}
            {showProviderDash && (
              <Link
                href="/provider/dashboard"
                className="hidden rounded-lg px-2.5 py-1.5 transition hover:bg-gray-50 hover:text-green-700 md:inline"
              >
                Dashboard
              </Link>
            )}
            {showProviderDash && (
              <Link
                href="/provider/messages"
                className="hidden rounded-lg px-2.5 py-1.5 transition hover:bg-gray-50 hover:text-green-700 md:inline"
              >
                Messages
              </Link>
            )}
            {showAdmin && (
              <Link
                href="/admin"
                className="hidden rounded-lg px-2.5 py-1.5 transition hover:bg-gray-50 hover:text-green-700 sm:inline"
              >
                Admin
              </Link>
            )}
            <div className="ml-auto flex min-w-0 items-center gap-1.5 border-l border-gray-200 pl-2 sm:pl-3">
              <ActiveModeControl />
              <AccountSwitcher />
              <NotificationBell />
              {ready && user ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="hidden rounded-lg px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-50 sm:inline"
                  title="Clear session"
                >
                  Exit
                </button>
              ) : (
                <Link
                  href="/login"
                  className="rounded-lg px-2.5 py-1.5 text-gray-700 hover:bg-gray-50"
                >
                  Log in
                </Link>
              )}
            </div>
          </nav>
      </div>
      <ActiveModeStrip />
    </header>
  );
}
