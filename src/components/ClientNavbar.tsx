"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMockApp } from "@/context/MockAppContext";
import { AccountSwitcher } from "@/components/AccountSwitcher";
import { NotificationBell } from "@/components/NotificationBell";

export function ClientNavbar() {
  const { user, logout, ready } = useMockApp();
  const router = useRouter();

  const dashboardHref =
    user?.role === "admin"
      ? "/admin"
      : user?.role === "provider"
        ? "/provider/dashboard"
        : user?.role === "customer"
          ? "/customer/dashboard"
          : null;

  function handleSignOut() {
    logout();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5">
        <Link href="/" className="text-lg font-bold text-green-600">
          HomeServe
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium text-gray-600 sm:gap-2">
          <Link
            href="/customer/dashboard"
            className="rounded-lg px-2.5 py-1.5 transition hover:bg-gray-50 hover:text-green-700"
          >
            Browse
          </Link>
          {user?.role === "customer" && (
            <Link
              href="/customer/saved"
              className="hidden rounded-lg px-2.5 py-1.5 transition hover:bg-gray-50 hover:text-green-700 sm:inline"
            >
              Saved
            </Link>
          )}
          {dashboardHref && user?.role !== "customer" && (
            <Link
              href={dashboardHref}
              className="hidden rounded-lg px-2.5 py-1.5 transition hover:bg-gray-50 hover:text-green-700 sm:inline"
            >
              {user?.role === "admin" ? "Admin" : "Dashboard"}
            </Link>
          )}
          <div className="ml-1 flex items-center gap-1 border-l border-gray-200 pl-2 sm:ml-2 sm:pl-3">
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
    </header>
  );
}
