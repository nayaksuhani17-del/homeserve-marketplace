import Link from "next/link";
import { getAppUser } from "@/lib/auth/session";
import { signOut } from "@/lib/actions";
import { DemoSwitcher } from "@/components/DemoSwitcher";

export async function Navbar() {
  const appUser = await getAppUser();

  const dashboardHref =
    appUser?.role === "admin"
      ? "/admin"
      : appUser?.role === "provider"
        ? "/provider/dashboard"
        : appUser?.role === "customer"
          ? "/customer/dashboard"
          : null;

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
          {dashboardHref && dashboardHref !== "/customer/dashboard" && (
            <Link href={dashboardHref} className="transition-colors duration-200 hover:text-green-600">
              Dashboard
            </Link>
          )}
          <DemoSwitcher />
          {appUser ? (
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg bg-gray-100 px-3 py-1.5 transition-colors duration-200 hover:bg-gray-200"
              >
                Sign out ({appUser.name})
              </button>
            </form>
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
