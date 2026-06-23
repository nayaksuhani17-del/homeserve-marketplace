"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMockApp } from "@/context/MockAppContext";
import { DemoSwitcher } from "@/components/DemoSwitcher";

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
        <nav className="flex items-center gap-3 text-sm font-medium text-gray-700">
          <Link href="/" className="transition-colors duration-200 hover:text-green-600">
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
              className="transition-colors duration-200 hover:text-green-600"
            >
              Saved
            </Link>
          )}
          {dashboardHref && dashboardHref !== "/customer/dashboard" && (
            <Link href={dashboardHref} className="transition-colors duration-200 hover:text-green-600">
              Dashboard
            </Link>
          )}
          <DemoSwitcher />
          {ready && user ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-lg bg-gray-100 px-3 py-1.5 transition-colors duration-200 hover:bg-gray-200"
            >
              Sign out ({user.name.split(" ")[0]})
            </button>
          ) : (
            <Link href="/login" className="btn-primary px-4 py-2">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
