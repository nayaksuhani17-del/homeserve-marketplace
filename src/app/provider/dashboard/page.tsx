import { redirect } from "next/navigation";
import { ProviderProfileForm } from "@/components/ProviderProfileForm";
import { StatCard } from "@/components/StatCard";
import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";
import { createClient } from "@/lib/supabase/server";

export default async function ProviderDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/provider/dashboard");

  const { data: profile } = await supabase
    .from("users")
    .select("role, name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "provider" && profile?.role !== "admin") {
    redirect("/customer/dashboard");
  }

  const { data: provider } = await supabase
    .from("providers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, service, date, time, status, users(name)")
    .eq("provider_id", provider?.id ?? "none")
    .order("created_at", { ascending: false });

  const confirmedCount = bookings?.filter((b) => b.status === "confirmed").length ?? 0;
  const totalJobs = provider?.jobs_completed ?? confirmedCount;
  const hourlyRate = Number(provider?.hourly_rate ?? 0);
  const avgRating = Number(provider?.rating_avg ?? 0);
  const fakeEarnings = Math.round(totalJobs * hourlyRate * 2.5);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Provider Dashboard</h1>
      <p className="mt-1 text-gray-600">
        Welcome back, {profile?.name}. Manage your profile and track your business.
      </p>

      {provider && (
        <>
          <div
            className={`mt-6 rounded-2xl border p-4 text-sm ${
              provider.approved
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            {provider.approved
              ? "✓ Your profile is verified and visible to customers."
              : "⏳ Your profile is pending admin approval."}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Jobs completed"
              value={totalJobs}
              sub="All time"
              accent="primary"
            />
            <StatCard
              label="Average rating"
              value={avgRating.toFixed(1)}
              sub="From customer reviews"
              accent="medium"
            />
            <StatCard
              label="Est. earnings"
              value={`$${fakeEarnings.toLocaleString()}`}
              sub="Demo estimate"
              accent="dark"
            />
          </div>

          <div className="mt-8">
            <AvailabilityCalendar
              availability={provider.availability}
              availableToday={provider.available_today}
              availableTomorrow={provider.available_tomorrow}
            />
          </div>
        </>
      )}

      <div className="mt-8">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Edit profile</h2>
        <ProviderProfileForm
          defaultValues={
            provider
              ? {
                  services: provider.services ?? [],
                  hourly_rate: Number(provider.hourly_rate),
                  location: provider.location,
                  description: provider.description,
                  availability: provider.availability,
                }
              : undefined
          }
        />
      </div>

      {provider && bookings && bookings.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-gray-900">Incoming bookings</h2>
          <div className="mt-4 space-y-3">
            {bookings.map((booking) => {
              const customer = Array.isArray(booking.users)
                ? booking.users[0]
                : booking.users;
              return (
                <div key={booking.id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">
                      {customer?.name ?? "Customer"} — {booking.service}
                    </p>
                    <span
                      className={`tag-pill ${
                        booking.status === "confirmed"
                          ? "badge-verified"
                          : "tag-pill bg-amber-100 text-amber-700"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {booking.date}
                    {booking.time ? ` at ${booking.time}` : ""}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
