import { redirect } from "next/navigation";
import { approveProvider, toggleUserBan } from "@/lib/actions";
import { StatCard } from "@/components/StatCard";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPanelPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/admin");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/customer/dashboard");
  }

  const { data: providers } = await supabase
    .from("providers")
    .select("id, services, hourly_rate, location, approved, rating_avg, users(name, email)")
    .order("created_at", { ascending: false });

  const { data: users } = await supabase
    .from("users")
    .select("id, name, email, role, banned")
    .order("created_at", { ascending: false });

  const { count: bookingCount } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true });

  const totalUsers = users?.length ?? 0;
  const totalProviders = providers?.length ?? 0;
  const pendingApprovals = providers?.filter((p) => !p.approved).length ?? 0;
  const activeProviders = providers?.filter((p) => p.approved).length ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Admin Panel</h1>
      <p className="mt-1 text-gray-600">Platform overview and moderation tools.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value={totalUsers} accent="primary" />
        <StatCard label="Total providers" value={totalProviders} sub={`${activeProviders} active`} accent="medium" />
        <StatCard label="Pending approvals" value={pendingApprovals} accent="dark" />
        <StatCard label="Total bookings" value={bookingCount ?? 0} accent="light" />
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-gray-900">Providers</h2>
        <div className="card mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Services</th>
                <th className="px-4 py-3 font-medium">Rate</th>
                <th className="px-4 py-3 font-medium">Rating</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {providers?.map((p) => {
                const u = Array.isArray(p.users) ? p.users[0] : p.users;
                return (
                  <tr key={p.id} className="border-b border-gray-100 transition hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{u?.name}</p>
                      <p className="text-xs text-gray-500">{p.location}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {(p.services ?? []).slice(0, 2).join(", ")}
                    </td>
                    <td className="px-4 py-3">${Number(p.hourly_rate).toFixed(0)}/hr</td>
                    <td className="px-4 py-3">{Number(p.rating_avg).toFixed(1)} ⭐</td>
                    <td className="px-4 py-3">
                      <span
                        className={`tag-pill ${
                        p.approved
                          ? "badge-verified"
                          : "tag-pill bg-amber-100 text-amber-700"
                        }`}
                      >
                        {p.approved ? "Approved" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <form
                        action={async () => {
                          "use server";
                          await approveProvider(p.id, !p.approved);
                        }}
                      >
                        <button
                          type="submit"
                          className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                          p.approved
                            ? "bg-red-100 text-red-500 hover:bg-red-200"
                            : "bg-green-600 text-white hover:bg-green-800"
                          }`}
                        >
                          {p.approved ? "Reject" : "Approve"}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
              {!providers?.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No providers yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-gray-900">Users</h2>
        <div className="card mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 transition hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 capitalize">{u.role}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`tag-pill ${
                        u.banned
                          ? "bg-red-100 text-red-500"
                          : "badge-tag"
                      }`}
                    >
                      {u.banned ? "Banned" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.role !== "admin" && (
                      <form
                        action={async () => {
                          "use server";
                          await toggleUserBan(u.id, !u.banned);
                        }}
                      >
                        <button
                          type="submit"
                          className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                            u.banned
                              ? "bg-green-600 text-white hover:bg-green-800"
                              : "bg-red-100 text-red-500 hover:bg-red-200"
                          }`}
                        >
                          {u.banned ? "Unban" : "Ban"}
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
