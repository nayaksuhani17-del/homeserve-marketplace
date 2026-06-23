import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions";
import { DemoSwitcher } from "@/components/DemoSwitcher";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let profile = null;
  if (authUser) {
    const { data } = await supabase
      .from("users")
      .select("name, role")
      .eq("id", authUser.id)
      .single();
    profile = data;
  }

  const dashboardHref =
    profile?.role === "admin"
      ? "/admin"
      : profile?.role === "provider"
        ? "/provider/dashboard"
        : profile?.role === "customer"
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
          {dashboardHref && (
            <Link href={dashboardHref} className="transition-colors duration-200 hover:text-green-600">
              Dashboard
            </Link>
          )}
          <DemoSwitcher />
          {authUser ? (
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg bg-gray-100 px-3 py-1.5 transition-colors duration-200 hover:bg-gray-200"
              >
                Sign out{profile?.name ? ` (${profile.name})` : ""}
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
