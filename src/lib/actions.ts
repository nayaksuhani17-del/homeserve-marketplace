/** Supabase production server actions — inactive while DEMO_MODE uses MockAppContext. */
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/auth/session";
import {
  appendDemoBooking,
  clearDemoSession,
} from "@/lib/demo/session";
import { getDemoProviderById } from "@/lib/demo/providers";
import { getProviderUser } from "@/lib/providers";
import { estimateBookingCost } from "@/lib/pricing";

export async function getCurrentUser() {
  const appUser = await getAppUser();
  if (!appUser) return null;

  return {
    id: appUser.id,
    name: appUser.name,
    email: appUser.email,
    role: appUser.role,
    banned: false,
  };
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  await clearDemoSession();
  redirect("/");
}

export async function createBooking(formData: FormData) {
  const appUser = await getAppUser();
  if (!appUser) return { error: "You must be logged in to book a service." };

  const providerId = formData.get("provider_id") as string;
  const service = formData.get("service") as string;
  const date = formData.get("date") as string;
  const time = (formData.get("time") as string) || null;
  const hours = Number(formData.get("hours") || 2);

  if (!providerId || !service || !date) {
    return { error: "Missing booking details." };
  }

  if (appUser.source === "demo") {
    const provider = getDemoProviderById(providerId);
    const providerUser = provider ? getProviderUser(provider) : null;
    const pricingType = provider?.pricing_type ?? "hourly";
    const price = Number(provider?.price ?? 0);

    const booking = await appendDemoBooking({
      providerId,
      providerName: providerUser?.name ?? "Provider",
      service,
      date,
      time,
      status: "pending",
    });

    if (!booking) return { error: "Could not save booking." };

    revalidatePath("/customer/dashboard");
    revalidatePath(`/provider/${providerId}`);

    return {
      success: true,
      booking: {
        id: booking.id,
        service,
        date,
        time,
        providerName: booking.providerName,
        pricingType,
        price,
        estimatedCost: estimateBookingCost(pricingType, price, hours),
        hours,
      },
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be logged in to book a service." };

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

  const price = Number(provider?.hourly_rate ?? 0);
  return {
    success: true,
    booking: {
      id: booking.id,
      service,
      date,
      time,
      providerName: name ?? "Provider",
      pricingType: "hourly" as const,
      price,
      estimatedCost: estimateBookingCost("hourly", price, hours),
      hours,
    },
  };
}

export async function createBookingAction(formData: FormData) {
  return createBooking(formData);
}

export async function createReview(formData: FormData) {
  const appUser = await getAppUser();
  if (!appUser) return { error: "You must be logged in." };

  if (appUser.source === "demo") {
    revalidatePath("/customer/dashboard");
    return { success: true };
  }

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
  if (!bookingId) return { error: "A completed booking is required to leave a review." };

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, customer_id, provider_id, status")
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingError) return { error: bookingError.message };
  if (!booking) return { error: "Booking not found." };
  if (booking.customer_id !== user.id) {
    return { error: "You can only review jobs you booked." };
  }
  if (booking.provider_id !== providerId) {
    return { error: "This review does not match the provider for this booking." };
  }
  if (booking.status !== "completed") {
    return { error: "You can leave a review after the job is completed." };
  }

  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (existing) return { error: "You already reviewed this booking." };

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
  const appUser = await getAppUser();
  if (!appUser) return { error: "You must be logged in." };

  if (appUser.source === "demo") {
    revalidatePath("/provider/dashboard");
    return { success: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be logged in." };

  const services = formData.getAll("services") as string[];
  const pricingType = (formData.get("pricing_type") as "hourly" | "fixed" | "estimate") || "hourly";
  const price = Number(
    formData.get(pricingType === "hourly" ? "hourly_rate" : "price") ??
      formData.get("hourly_rate")
  );
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
    hourly_rate: price,
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
