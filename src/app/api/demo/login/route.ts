import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { runDemoSeed } from "@/lib/demo/seed";
import { DEMO_PASSWORD } from "@/lib/demo/constants";
import {
  createDemoSession,
  createGuestDemoSession,
  DEMO_SESSION_COOKIE,
  demoRedirectForRole,
  resolveDemoUser,
} from "@/lib/demo/session";
import { createServerClient } from "@supabase/ssr";

function cookieLoginResponse(session: ReturnType<typeof createDemoSession>) {
  const redirect = demoRedirectForRole(session.user.role);
  const response = NextResponse.json({
    ok: true,
    user: session.user,
    redirect,
    mode: "cookie",
  });
  response.cookies.set(DEMO_SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    role?: "customer" | "provider" | "admin";
    email?: string;
    name?: string;
  };

  const email = body.email?.trim().toLowerCase();
  let demoUser = resolveDemoUser(email, body.role);

  if (!demoUser && email && !isSupabaseConfigured()) {
    const name =
      body.name?.trim() ||
      email
        .split("@")[0]
        ?.replace(/[._-]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()) ||
      "Demo User";
    const role = body.role ?? "customer";
    return cookieLoginResponse(createGuestDemoSession({ name, email, role }));
  }

  if (!demoUser) {
    return NextResponse.json({ error: "Unknown demo user" }, { status: 400 });
  }

  const redirect = demoRedirectForRole(demoUser.role);

  if (isSupabaseConfigured()) {
    await runDemoSeed();

    const response = NextResponse.json({
      ok: true,
      user: { name: demoUser.name, email: demoUser.email, role: demoUser.role },
      redirect,
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return [];
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.signInWithPassword({
      email: demoUser.email,
      password: DEMO_PASSWORD,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return response;
  }

  return cookieLoginResponse(createDemoSession(demoUser));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role") as "customer" | "provider" | "admin" | null;
  const key = searchParams.get("key");

  let email: string | undefined;
  if (key) {
    const { getDemoUserByKey } = await import("@/lib/demo/seed-data");
    email = getDemoUserByKey(key)?.email;
  } else if (role === "admin") {
    email = "admin@test.com";
  } else if (role === "provider") {
    email = "marcus.reed@demo.com";
  } else {
    email = "sarah.mitchell@demo.com";
  }

  const fakeRequest = new Request(request.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  return POST(fakeRequest);
}
