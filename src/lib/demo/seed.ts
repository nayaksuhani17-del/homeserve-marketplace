import { createAdminClient } from "@/lib/supabase/admin";
import { DEMO_PASSWORD } from "@/lib/demo/constants";
import {
  DEMO_BOOKINGS,
  DEMO_PROVIDERS,
  DEMO_REVIEWS,
  DEMO_USERS,
  bookingId,
  providerId,
  reviewId,
  userId,
} from "@/lib/demo/seed-data";

function providerPayload(provider: (typeof DEMO_PROVIDERS)[number]) {
  return {
    id: providerId(provider.userKey),
    user_id: userId(provider.userKey),
    services: provider.services,
    hourly_rate: provider.price,
    pricing_type: provider.pricingType,
    price: provider.price,
    location: provider.location,
    description: provider.description,
    availability: provider.availability,
    approved: provider.approved,
    distance_miles: provider.distanceMiles,
    jobs_completed: provider.jobsCompleted,
    years_experience: provider.yearsExperience,
    tags: provider.tags,
    available_today: provider.availableToday,
    available_tomorrow: provider.availableTomorrow,
  };
}

let seedPromise: Promise<{ ok: boolean; message: string }> | null = null;

export async function runDemoSeed(): Promise<{ ok: boolean; message: string }> {
  if (seedPromise) return seedPromise;

  seedPromise = seedDemoData();
  return seedPromise;
}

async function seedDemoData(): Promise<{ ok: boolean; message: string }> {
  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: false,
      message: "Demo seed skipped — set SUPABASE_SERVICE_ROLE_KEY in .env.local",
    };
  }

  try {
    const { data: existingAdmin } = await admin
      .from("users")
      .select("id")
      .eq("email", "admin@test.com")
      .maybeSingle();

    if (existingAdmin) {
      await syncDemoProfiles(admin);
      return { ok: true, message: "Demo data already seeded — profiles synced" };
    }

    for (const user of DEMO_USERS) {
      const id = userId(user.key);
      const { error } = await admin.auth.admin.createUser({
        id,
        email: user.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { name: user.name, role: user.role },
      });

      if (error && !error.message.includes("already been registered")) {
        console.error(`[demo-seed] auth user ${user.email}:`, error.message);
      }

      await admin.from("users").upsert(
        {
          id,
          name: user.name,
          email: user.email,
          role: user.role,
          banned: false,
          avatar_url: user.avatarUrl,
        },
        { onConflict: "id" }
      );
    }

    for (const provider of DEMO_PROVIDERS) {
      await admin.from("providers").upsert(
        { ...providerPayload(provider), rating_avg: 0 },
        { onConflict: "id" }
      );
    }

    const demoUserIds = DEMO_USERS.map((u) => userId(u.key));
    await admin.from("reviews").delete().in("customer_id", demoUserIds);
    await admin.from("bookings").delete().in("customer_id", demoUserIds);

    for (let i = 0; i < DEMO_BOOKINGS.length; i++) {
      const booking = DEMO_BOOKINGS[i];
      await admin.from("bookings").insert({
        id: bookingId(i),
        customer_id: userId(booking.customerKey),
        provider_id: providerId(booking.providerKey),
        service: booking.service,
        date: booking.date,
        status: booking.status,
      });
    }

    for (let i = 0; i < DEMO_REVIEWS.length; i++) {
      const review = DEMO_REVIEWS[i];
      await admin.from("reviews").insert({
        id: reviewId(i),
        customer_id: userId(review.customerKey),
        provider_id: providerId(review.providerKey),
        rating: review.rating,
        comment: review.comment,
      });
    }

    for (const provider of DEMO_PROVIDERS) {
      const pid = providerId(provider.userKey);
      const providerReviews = DEMO_REVIEWS.filter(
        (r) => r.providerKey === provider.userKey
      );
      const avg =
        providerReviews.reduce((sum, r) => sum + r.rating, 0) /
        providerReviews.length;

      await admin
        .from("providers")
        .update({ rating_avg: Math.round(avg * 10) / 10 })
        .eq("id", pid);
    }

    console.log("[demo-seed] Seeded 18 users, 12 providers, reviews & bookings");
    return { ok: true, message: "Demo data seeded successfully" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown seed error";
    console.error("[demo-seed]", message);
    seedPromise = null;
    return { ok: false, message };
  }
}

async function syncDemoProfiles(
  admin: NonNullable<ReturnType<typeof createAdminClient>>
) {
  for (const user of DEMO_USERS) {
    const id = userId(user.key);
    await admin.from("users").upsert(
      {
        id,
        name: user.name,
        email: user.email,
        role: user.role,
        banned: false,
        avatar_url: user.avatarUrl,
      },
      { onConflict: "id" }
    );
  }

  for (const provider of DEMO_PROVIDERS) {
    await admin.from("providers").upsert(providerPayload(provider), {
      onConflict: "id",
    });
  }
}
