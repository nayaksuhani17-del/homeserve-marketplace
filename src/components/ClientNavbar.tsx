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
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold text-green-600">
          HomeServe
        </Link>
        <nav className="flex items-center gap-2 text-sm font-medium text-gray-700 sm:gap-3">
          <Link href="/" className="hidden transition-colors duration-200 hover:text-green-600 sm:inline">
            Home
          </Link>
          <Link
            href="/customer/dashboard"
            className="transition-colors duration-200 hover:text-green-600"
          >
            Browse
          </Link>
          {user?.role === "customer" && (
            <Link
              href="/customer/saved"
              className="hidden transition-colors duration-200 hover:text-green-600 sm:inline"
            >
              Saved
            </Link>
          )}
          {dashboardHref && dashboardHref !== "/customer/dashboard" && (
            <Link
              href={dashboardHref}
              className="hidden transition-colors duration-200 hover:text-green-600 sm:inline"
            >
              Dashboard
            </Link>
          )}
          <AccountSwitcher />
          <NotificationBell />
          {ready && user ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="hidden rounded-lg px-2 py-1.5 text-xs text-gray-500 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-700 sm:inline"
              title="Clear session — use Switch Account to change profiles instead"
            >
              Exit
            </button>
          ) : (
            <Link
              href="/login"
              className="hidden rounded-lg px-3 py-1.5 text-gray-700 transition hover:bg-gray-100 sm:inline"
            >
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
