"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  return profile;
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function createBooking(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be logged in to book a service." };

  const providerId = formData.get("provider_id") as string;
  const service = formData.get("service") as string;
  const date = formData.get("date") as string;
  const time = (formData.get("time") as string) || null;
  const hours = Number(formData.get("hours") || 2);

  if (!providerId || !service || !date) {
    return { error: "Missing booking details." };
  }

  const { data: provider } = await supabase
    .from("providers")
    .select("hourly_rate, users(name)")
    .eq("id", providerId)
    .single();

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      customer_id: user.id,
      provider_id: providerId,
      service,
      date,
      time,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const providerUser = provider?.users as
    | { name?: string }
    | { name?: string }[]
    | null
    | undefined;
  const name = Array.isArray(providerUser)
    ? providerUser[0]?.name
    : providerUser?.name;

  revalidatePath("/customer/dashboard");
  revalidatePath(`/provider/${providerId}`);

  const hourlyRate = Number(provider?.hourly_rate ?? 0);
  return {
    success: true,
    booking: {
      id: booking.id,
      service,
      date,
      time,
      providerName: name ?? "Provider",
      hourlyRate,
      estimatedCost: hourlyRate * hours,
      hours,
    },
  };
}

export async function createBookingAction(formData: FormData) {
  return createBooking(formData);
}

export async function createReview(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be logged in." };

  const providerId = formData.get("provider_id") as string;
  const bookingId = formData.get("booking_id") as string;
  const rating = Number(formData.get("rating"));
  const comment = (formData.get("comment") as string) || "";

  if (!providerId || !rating) return { error: "Missing review details." };

  const { error } = await supabase.from("reviews").insert({
    customer_id: user.id,
    provider_id: providerId,
    booking_id: bookingId || null,
    rating,
    comment,
  });

  if (error) return { error: error.message };

  revalidatePath("/customer/dashboard");
  revalidatePath(`/provider/${providerId}`);
  return { success: true };
}

export async function createReviewAction(formData: FormData) {
  await createReview(formData);
}

export async function upsertProviderProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be logged in." };

  const services = formData.getAll("services") as string[];
  const hourlyRate = Number(formData.get("hourly_rate"));
  const location = formData.get("location") as string;
  const description = formData.get("description") as string;
  const availability = formData.get("availability") as string;

  const { data: existing } = await supabase
    .from("providers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const payload = {
    user_id: user.id,
    services,
    hourly_rate: hourlyRate,
    location,
    description,
    availability,
  };

  const { error } = existing
    ? await supabase.from("providers").update(payload).eq("user_id", user.id)
    : await supabase.from("providers").insert(payload);

  if (error) return { error: error.message };

  revalidatePath("/provider/dashboard");
  return { success: true };
}

export async function upsertProviderProfileAction(formData: FormData) {
  await upsertProviderProfile(formData);
}

export async function approveProvider(providerId: string, approved: boolean) {
  const supabase = await createClient();
  const profile = await getCurrentUser();
  if (!profile || profile.role !== "admin") return { error: "Unauthorized" };

  const { error } = await supabase
    .from("providers")
    .update({ approved })
    .eq("id", providerId);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/customer/dashboard");
  return { success: true };
}

export async function toggleUserBan(userId: string, banned: boolean) {
  const supabase = await createClient();
  const profile = await getCurrentUser();
  if (!profile || profile.role !== "admin") return { error: "Unauthorized" };

  const { error } = await supabase
    .from("users")
    .update({ banned })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}
